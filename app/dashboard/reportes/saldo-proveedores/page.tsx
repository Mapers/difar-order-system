'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronRight, ChevronsUpDown, Loader2, Search, Truck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/app/hooks/useToast'
import {
    SaldoProveedoresService, agruparPorProveedor, esSolesProv, fmtFecha, fmtMonto,
} from '@/app/services/reportes/SaldoProveedoresService'
import { SaldoProvDocumento, SaldoProvDuplicado, SaldoProvGrupo, SaldoProvResumen } from '@/app/types/saldo-proveedores-types'
import { ExportSaldoProveedoresPdf } from '@/components/reporte/saldo-proveedores/exportSaldoProveedoresPdf'
import { ExportSaldoProveedoresExcel } from '@/components/reporte/saldo-proveedores/exportSaldoProveedoresExcel'

const hoy = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Saldo de Documentos por Pagar Proveedor.
 * Reemplaza los reportes Access "Saldo Proveedores 1" (un proveedor) y "Saldo Proveedores" (todos).
 */
export default function SaldoProveedoresPage() {
    const [fechaCorte, setFechaCorte] = useState(hoy())
    const [excluirDuplicados, setExcluirDuplicados] = useState(true)
    const [proveedores, setProveedores] = useState<SaldoProvResumen[]>([])
    const [codProv, setCodProv] = useState('')
    const [abrirCombo, setAbrirCombo] = useState(false)

    const [cargando, setCargando] = useState(false)
    const [docs, setDocs] = useState<SaldoProvDocumento[] | null>(null)
    const [consulta, setConsulta] = useState<{ fechaCorte: string; excluirDuplicados: boolean; codProv: string } | null>(null)
    const [movDuplicados, setMovDuplicados] = useState(0)
    const [abiertos, setAbiertos] = useState<Set<string>>(new Set())

    const [auditoria, setAuditoria] = useState<SaldoProvDuplicado[] | null>(null)
    const [cargandoAud, setCargandoAud] = useState(false)

    // Combo de proveedores: los que tienen saldo a la fecha de corte.
    useEffect(() => {
        SaldoProveedoresService.resumen({ fechaCorte, excluirDuplicados: true })
            .then(setProveedores)
            .catch(() => setProveedores([]))
    }, [fechaCorte])

    const provSel = proveedores.find(p => p.CodProveedor === codProv)

    const buscar = async () => {
        setCargando(true)
        try {
            const [rows, crudos] = await Promise.all([
                SaldoProveedoresService.documentos({ fechaCorte, codProv, excluirDuplicados }),
                // Movimientos repetidos que se dejan de sumar (para el aviso).
                excluirDuplicados
                    ? SaldoProveedoresService.documentos({ fechaCorte, codProv, excluirDuplicados: false })
                    : Promise.resolve(null),
            ])
            setDocs(rows)
            setConsulta({ fechaCorte, excluirDuplicados, codProv })
            const base = crudos ?? rows
            setMovDuplicados(base.reduce((a, d) => a + (Number(d.MovDuplicados) || 0), 0))
            const grupos = agruparPorProveedor(rows)
            setAbiertos(new Set(grupos.length === 1 ? [grupos[0].codigo] : []))
            if (!rows.length) toast({ description: 'No hay documentos con saldo a esa fecha.' })
        } catch (e: any) {
            console.error(e)
            toast({ title: 'Error', description: e?.response?.data?.message || 'No se pudo generar el reporte.', variant: 'destructive' })
        } finally {
            setCargando(false)
        }
    }

    const verAuditoria = async () => {
        setCargandoAud(true)
        try {
            setAuditoria(await SaldoProveedoresService.duplicados(consulta?.codProv))
        } catch {
            toast({ title: 'Error', description: 'No se pudo cargar la auditoría.', variant: 'destructive' })
        } finally {
            setCargandoAud(false)
        }
    }

    const grupos = useMemo(() => agruparPorProveedor(docs ?? []), [docs])
    const tot = useMemo(() => {
        const all = docs ?? []
        return {
            soles: all.reduce((a, d) => a + (Number(d.SaldoSoles) || 0), 0),
            dolares: all.reduce((a, d) => a + (Number(d.SaldoDolares) || 0), 0),
            documentos: all.length,
            vencidos: all.filter(d => (d.DiasVencido ?? 0) > 0 && Number(d.Saldo) > 0).length,
        }
    }, [docs])

    const alternar = (c: string) => setAbiertos(prev => {
        const n = new Set(prev)
        n.has(c) ? n.delete(c) : n.add(c)
        return n
    })

    const estado = (d: SaldoProvDocumento) => {
        if (Number(d.Saldo) < 0) return <Badge variant="destructive" className="whitespace-nowrap">Negativo</Badge>
        if ((d.DiasVencido ?? 0) > 0) return <Badge className="whitespace-nowrap bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">{d.DiasVencido} d vencido</Badge>
        return <Badge className="whitespace-nowrap bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">Por vencer</Badge>
    }

    const tablaDocumentos = (g: SaldoProvGrupo) => (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left text-muted-foreground">
                    <thead className="text-[10px] uppercase border-b border-border">
                    <tr>
                        <th className="px-3 py-2 font-bold whitespace-nowrap">F. Vcto</th>
                        <th className="px-3 py-2 font-bold whitespace-nowrap">F. Emisión</th>
                        <th className="px-3 py-2 font-bold">Doc.</th>
                        <th className="px-3 py-2 font-bold">Serie</th>
                        <th className="px-3 py-2 font-bold">Número</th>
                        <th className="px-3 py-2 font-bold text-center">M</th>
                        <th className="px-3 py-2 font-bold text-right">Provisión</th>
                        <th className="px-3 py-2 font-bold text-right">Amortiz.</th>
                        <th className="px-3 py-2 font-bold text-right text-blue-700 dark:text-blue-400">Saldo S/.</th>
                        <th className="px-3 py-2 font-bold text-right text-green-700 dark:text-green-400">Saldo US$</th>
                        <th className="px-3 py-2 font-bold text-center">Estado</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                    {g.documentos.map((d, i) => {
                        const soles = esSolesProv(d)
                        const neg = Number(d.Saldo) < 0
                        return (
                            <tr key={i} className={cn('hover:bg-muted transition-colors', neg && 'bg-red-50 dark:bg-red-950/40')}>
                                <td className={cn('px-3 py-2 whitespace-nowrap', (d.DiasVencido ?? 0) > 0 && 'text-red-600 font-medium')}>{fmtFecha(d.FechaVcto)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{fmtFecha(d.FechaEmision)}</td>
                                <td className="px-3 py-2 font-medium">{d.Documento}</td>
                                <td className="px-3 py-2 font-mono font-semibold text-foreground">{d.Serie}</td>
                                <td className="px-3 py-2 font-mono font-semibold text-foreground">{d.Numero}</td>
                                <td className="px-3 py-2 text-center font-bold">{d.Moneda}</td>
                                <td className="px-3 py-2 text-right">{fmtMonto(d.Provision)}</td>
                                <td className="px-3 py-2 text-right">{fmtMonto(d.Amortizacion)}</td>
                                <td className={cn('px-3 py-2 text-right font-bold', neg ? 'text-red-600' : 'text-blue-700 dark:text-blue-400')}>{soles ? fmtMonto(d.Saldo) : '-'}</td>
                                <td className="px-3 py-2 text-right font-bold text-green-700 dark:text-green-400">{!soles ? fmtMonto(d.Saldo) : '-'}</td>
                                <td className="px-3 py-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {estado(d)}
                                        {Number(d.MovDuplicados) > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{d.MovDuplicados} dup.</Badge>}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                    <tfoot>
                    <tr className="bg-muted/50 font-bold text-foreground">
                        <td className="px-3 py-2" colSpan={8}>Total {g.nombre}</td>
                        <td className={cn('px-3 py-2 text-right', g.soles < 0 ? 'text-red-600' : 'text-blue-700 dark:text-blue-400')}>{fmtMonto(g.soles)}</td>
                        <td className="px-3 py-2 text-right text-green-700 dark:text-green-400">{fmtMonto(g.dolares)}</td>
                        <td />
                    </tr>
                    </tfoot>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-2 p-2.5 md:hidden">
                {g.documentos.map((d, i) => {
                    const neg = Number(d.Saldo) < 0
                    return (
                        <div key={i} className={cn('rounded-lg border p-3 flex flex-col gap-2.5', neg ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40' : 'border-border bg-muted/30')}>
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{d.Documento}</span>
                                    <p className="font-mono font-bold text-sm text-foreground">{d.Serie}-{d.Numero}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {estado(d)}
                                    {Number(d.MovDuplicados) > 0 && <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">{d.MovDuplicados} dup.</Badge>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-muted-foreground">Emisión</span><p className="font-medium text-foreground">{fmtFecha(d.FechaEmision)}</p></div>
                                <div><span className="text-muted-foreground">Vcto</span><p className={cn('font-medium', (d.DiasVencido ?? 0) > 0 ? 'text-red-600' : 'text-foreground')}>{fmtFecha(d.FechaVcto)}</p></div>
                                <div><span className="text-muted-foreground">Provisión</span><p className="font-medium">{fmtMonto(d.Provision)}</p></div>
                                <div><span className="text-muted-foreground">Amortiz.</span><p className="font-medium">{fmtMonto(d.Amortizacion)}</p></div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Saldo</span>
                                <span className={cn('text-base font-bold', neg ? 'text-red-600' : esSolesProv(d) ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400')}>
                                    {d.Moneda} {fmtMonto(d.Saldo)}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div className="flex justify-between rounded-lg bg-blue-50 p-3 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <span>Total</span>
                    <span>S/ {fmtMonto(g.soles)}{g.dolares ? `  ·  US$ ${fmtMonto(g.dolares)}` : ''}</span>
                </div>
            </div>
        </>
    )

    return (
        <div className="grid grid-cols-1 gap-6 p-0 md:p-2">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Saldo de Documentos por Pagar Proveedor</h1>
                <p className="text-sm md:text-base text-muted-foreground">Documentos con saldo a la fecha de corte, por proveedor (reemplaza &quot;Saldo Proveedores&quot; de Access).</p>
            </div>

            <Card className="shadow-md overflow-hidden">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="flex flex-col gap-1.5 md:col-span-4 min-w-0">
                            <Label className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-muted-foreground" /> Proveedor (vacío = todos)</Label>
                            <Popover open={abrirCombo} onOpenChange={setAbrirCombo}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between bg-background font-normal">
                                        <span className="truncate">{provSel ? `${provSel.NombreProveedor}` : 'Todos los proveedores'}</span>
                                        <span className="flex items-center gap-1">
                                            {codProv && <X className="h-4 w-4 opacity-60 hover:opacity-100" onClick={e => { e.stopPropagation(); setCodProv('') }} />}
                                            <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar por nombre o RUC..." />
                                        <CommandList>
                                            <CommandEmpty>Sin proveedores con saldo.</CommandEmpty>
                                            <CommandGroup>
                                                {proveedores.map(p => (
                                                    <CommandItem key={p.CodProveedor} value={`${p.NombreProveedor} ${p.RucProveedor}`}
                                                                 onSelect={() => { setCodProv(p.CodProveedor); setAbrirCombo(false) }}>
                                                        <Check className={cn('mr-2 h-4 w-4', codProv === p.CodProveedor ? 'opacity-100' : 'opacity-0')} />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm">{p.NombreProveedor}</p>
                                                            <p className="text-[11px] text-muted-foreground">RUC {p.RucProveedor} · S/ {fmtMonto(p.SaldoSoles)}</p>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                            <Label htmlFor="fcorte">Fecha de corte</Label>
                            <Input id="fcorte" type="date" className="bg-background" value={fechaCorte} max="2100-12-31"
                                   onChange={e => setFechaCorte(e.target.value || hoy())} />
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-3">
                            <Label>Duplicados</Label>
                            <label className="flex h-10 items-center gap-3 cursor-pointer">
                                <Switch checked={excluirDuplicados} onCheckedChange={setExcluirDuplicados} />
                                <span className="leading-tight">
                                    <span className="block text-sm font-semibold">Excluir duplicados</span>
                                    <span className="block text-[11px] text-muted-foreground">{excluirDuplicados ? 'Saldo real' : 'Igual que Access'}</span>
                                </span>
                            </label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 md:col-span-3 md:justify-end">
                            <Button onClick={buscar} disabled={cargando} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                                {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Buscar
                            </Button>
                            <ExportSaldoProveedoresPdf grupos={grupos} fechaCorte={consulta?.fechaCorte ?? fechaCorte}
                                                       excluirDuplicados={consulta?.excluirDuplicados ?? excluirDuplicados} disabled={!grupos.length} />
                            <ExportSaldoProveedoresExcel grupos={grupos} fechaCorte={consulta?.fechaCorte ?? fechaCorte}
                                                         excluirDuplicados={consulta?.excluirDuplicados ?? excluirDuplicados} disabled={!grupos.length} />
                        </div>
                    </div>
                </CardHeader>

                {docs && (
                    <CardContent className="p-0">
                        {movDuplicados > 0 && (
                            <div className={cn('m-3 md:m-4 mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm',
                                consulta?.excluirDuplicados
                                    ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
                                    : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200')}>
                                <span className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                    {consulta?.excluirDuplicados
                                        ? <span>Se excluyeron <b>{movDuplicados} movimientos duplicados</b> (pagos y canjes de letras repetidos por la &quot;Actualización contable&quot; de Access).</span>
                                        : <span>Resultado <b>igual que Access</b>: incluye {movDuplicados} movimientos duplicados, por eso hay saldos negativos.</span>}
                                </span>
                                <Button variant="link" className="h-auto p-0 font-bold text-inherit" onClick={verAuditoria} disabled={cargandoAud}>
                                    {cargandoAud && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Ver auditoría ›
                                </Button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 md:p-4">
                            {[
                                { t: 'Saldo S/.', v: `S/ ${fmtMonto(tot.soles)}`, c: tot.soles < 0 ? 'text-red-600' : 'text-blue-700 dark:text-blue-400' },
                                { t: 'Saldo US$', v: `US$ ${fmtMonto(tot.dolares)}`, c: 'text-green-700 dark:text-green-400' },
                                { t: grupos.length > 1 ? `Documentos · ${grupos.length} prov.` : 'Documentos', v: String(tot.documentos), c: 'text-foreground' },
                                { t: 'Vencidos', v: String(tot.vencidos), c: 'text-red-600' },
                            ].map(k => (
                                <div key={k.t} className="rounded-lg border border-border p-3 md:p-4">
                                    <p className="text-[10px] md:text-[11px] uppercase tracking-wider text-muted-foreground">{k.t}</p>
                                    <p className={cn('mt-1 text-lg md:text-2xl font-bold', k.c)}>{k.v}</p>
                                </div>
                            ))}
                        </div>

                        {grupos.map(g => {
                            const abierto = abiertos.has(g.codigo)
                            return (
                                <div key={g.codigo} className="border-t border-border">
                                    <button type="button" onClick={() => alternar(g.codigo)}
                                            className="flex w-full items-center justify-between gap-3 bg-muted/40 px-3.5 py-3 text-left hover:bg-muted">
                                        <div className="flex min-w-0 items-start gap-2">
                                            {abierto ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />}
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-extrabold text-foreground">{g.nombre}</h3>
                                                <div className="mt-1 flex flex-wrap gap-1.5">
                                                    <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground"><b className="mr-1 text-foreground">RUC</b>{g.ruc}</span>
                                                    <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">{g.documentos.length} doc.</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo proveedor</p>
                                            <p className={cn('text-sm font-extrabold', g.soles < 0 ? 'text-red-600' : 'text-blue-700 dark:text-blue-400')}>
                                                S/ {fmtMonto(g.soles)}
                                                {g.dolares !== 0 && <span className="ml-2 text-green-700 dark:text-green-400">US$ {fmtMonto(g.dolares)}</span>}
                                            </p>
                                        </div>
                                    </button>
                                    {abierto && tablaDocumentos(g)}
                                </div>
                            )
                        })}

                        {grupos.length > 1 && (
                            <div className="flex flex-col sm:flex-row justify-between gap-1 border-t-2 border-border bg-muted px-4 py-3 font-extrabold">
                                <span>TOTAL GENERAL</span>
                                <span><span className={tot.soles < 0 ? 'text-red-600' : 'text-blue-700 dark:text-blue-400'}>S/ {fmtMonto(tot.soles)}</span>
                                    <span className="ml-3 text-green-700 dark:text-green-400">US$ {fmtMonto(tot.dolares)}</span></span>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            <Dialog open={auditoria !== null} onOpenChange={o => !o && setAuditoria(null)}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Auditoría de movimientos duplicados</DialogTitle>
                        <DialogDescription>
                            Filas de kardex proveedores idénticas a otra anterior (mismo documento, importe, fecha y módulo).
                            No se suman en el saldo cuando &quot;Excluir duplicados&quot; está activo. {auditoria?.length ?? 0} movimientos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="text-[10px] uppercase text-muted-foreground border-b">
                            <tr>
                                <th className="px-2 py-2 text-left">Id copia</th><th className="px-2 py-2 text-left">Id original</th>
                                <th className="px-2 py-2 text-left">Proveedor</th><th className="px-2 py-2 text-left">Módulo</th>
                                <th className="px-2 py-2 text-left">Documento</th><th className="px-2 py-2 text-left">Fecha</th>
                                <th className="px-2 py-2 text-right">Provisión</th><th className="px-2 py-2 text-right">Amortiz.</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y">
                            {(auditoria ?? []).map(a => (
                                <tr key={a.IdDuplicado}>
                                    <td className="px-2 py-1.5 font-mono">{a.IdDuplicado}</td>
                                    <td className="px-2 py-1.5 font-mono text-muted-foreground">{a.IdOriginal}</td>
                                    <td className="px-2 py-1.5 max-w-[220px] truncate">{a.NombreProveedor}</td>
                                    <td className="px-2 py-1.5">{a.ModuloTrabajo} {a.Modulo}</td>
                                    <td className="px-2 py-1.5 font-mono whitespace-nowrap">{a.Documento} {a.Serie}-{a.Numero}</td>
                                    <td className="px-2 py-1.5 whitespace-nowrap">{fmtFecha(a.FechaAmortizacion || a.FechaEmision)}</td>
                                    <td className="px-2 py-1.5 text-right">{fmtMonto(a.Provision)}</td>
                                    <td className="px-2 py-1.5 text-right">{fmtMonto(a.Amortizacion)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
