'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
    AlertTriangle, BookOpen, Building2, CalendarDays, CheckCircle2, GitBranch, Hash, Landmark, Layers, Loader2,
    Receipt, Save, ShoppingCart, Sparkles, Trash2, Wallet, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ComboSelect } from '@/components/ui/combo-select'
import { cn } from '@/lib/utils'
import { toast } from '@/app/hooks/useToast'
import { mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { PlanCuentasService } from '@/app/services/contabilidad/PlanCuentasService'
import { CatalogosPlan, FichaCuenta, OpcionCatalogo, UsoCuenta } from '@/app/types/plan-cuentas-types'
import { FilaInforme } from '@/app/types/informes-contables-types'

/** Ficha vacía (alta): mismos valores por defecto que la tabla (Sí/No = 1 "No", estado de flujo 4). */
export const fichaVacia = (): FichaCuenta => ({
    id: null, codigo: '', descripcion: '', tipo: '0', conceptoEeff: '0', estadoFlujo: '4', amarreCargo: '', amarreAbono: '',
    caja: '1', bancos: '1', libroCaja: '1', libroBancos: '1', regCompras: '1', regVentas: '1', cuentaSunat: '', fechaAlta: '',
})

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v))
/** Fila del reporte plan-cuentas -> ficha. */
export const fichaDe = (f: FilaInforme): FichaCuenta => ({
    id: Number(f.IdCtaContable), codigo: s(f.Cuenta), descripcion: s(f.Descripcion), tipo: s(f.IdTipoCuenta), conceptoEeff: s(f.IdConceptoEEFF),
    estadoFlujo: s(f.IdEstadoFlujo), amarreCargo: s(f.IdAmarreCargo), amarreAbono: s(f.IdAmarreAbono),
    caja: s(f.CtaCaja), bancos: s(f.CtaBcos), libroCaja: s(f.CtaRegistrosCaja), libroBancos: s(f.CtaRegistrosBancos),
    regCompras: s(f.CtaRegistroCompras), regVentas: s(f.CtaRegistroVentas), cuentaSunat: s(f.IdCuentaSunat), fechaAlta: s(f.FAlta).slice(0, 10),
})

/** Niveles del plan (largo del código), como dice el form Access. */
const NIVELES = [{ n: 2, t: 'Principal' }, { n: 3, t: 'Sub cuenta' }, { n: 5, t: 'Sub cuenta 2' }, { n: 7, t: 'Registros' }]

interface Props {
    abierta: boolean
    ficha: FichaCuenta | null
    catalogos: CatalogosPlan | null
    /** Plan completo (para los combos Cargos/Abonos y el aviso de código repetido). */
    plan: FilaInforme[]
    onCerrar: () => void
    onCambio: () => void
}

/** Tarjeta de sección con ícono; aparece con un pequeño retraso (efecto en cascada). */
function Seccion({ icono, titulo, ayuda, retraso, children, className }: {
    icono: React.ReactNode; titulo: string; ayuda?: string; retraso: number; children: React.ReactNode; className?: string
}) {
    return (
        <section style={{ animationDelay: `${retraso}ms`, animationFillMode: 'backwards' }}
                 className={cn('group rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300',
                     'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 animate-in fade-in-0 slide-in-from-bottom-3 duration-500', className)}>
            <header className="mb-3 flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 dark:bg-blue-950/60 dark:text-blue-400">
                    {icono}
                </span>
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{titulo}</h3>
                    {ayuda && <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{ayuda}</p>}
                </div>
            </header>
            {children}
        </section>
    )
}

function Campo({ label, obligatorio, children, className }: { label: string; obligatorio?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}{obligatorio && <span className="text-red-500"> *</span>}
            </Label>
            {children}
        </div>
    )
}

/** Interruptor Sí/No (cta_registros: 0 = "Si Registros", 1 = "No"). */
function Interruptor({ icono, label, valor, onChange }: { icono: React.ReactNode; label: string; valor: string; onChange: (v: string) => void }) {
    const si = valor === '0'
    return (
        <label className={cn('flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-all duration-200 select-none',
            si ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-border bg-muted/30 hover:bg-muted/60')}>
            <span className="flex items-center gap-2 min-w-0">
                <span className={cn('transition-colors', si ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>{icono}</span>
                <span className="text-xs font-medium text-foreground truncate">{label}</span>
            </span>
            <span className="flex items-center gap-2">
                <span className={cn('text-[10px] font-bold uppercase w-5 text-right transition-colors', si ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>{si ? 'Sí' : 'No'}</span>
                <Switch checked={si} onCheckedChange={(c) => onChange(c ? '0' : '1')} className="data-[state=checked]:bg-emerald-500" />
            </span>
        </label>
    )
}

/** Ficha de la cuenta (form Access [Plan Contable]): Guardar y nuevo / Modificar / Eliminar Registro. */
export function FichaCuentaDialog({ abierta, ficha, catalogos, plan, onCerrar, onCambio }: Props) {
    const [f, setF] = useState<FichaCuenta>(fichaVacia())
    const [guardando, setGuardando] = useState(false)
    const [confirmar, setConfirmar] = useState<string[] | null>(null)
    const [usos, setUsos] = useState<UsoCuenta[] | null>(null)
    const [preguntaEliminar, setPreguntaEliminar] = useState(false)
    useEffect(() => { if (abierta) setF(ficha ?? fichaVacia()) }, [abierta, ficha])
    const set = (p: Partial<FichaCuenta>) => setF(x => ({ ...x, ...p }))

    const cuentas = useMemo(() => plan.map(p => ({ id: String(p.IdCtaContable), codigo: s(p.Cuenta), nombre: s(p.Descripcion) })), [plan])
    const original = ficha?.codigo ?? ''
    const nivel = f.codigo.trim().length
    const general = ficha && plan.find(p => Number(p.IdCtaContable) === ficha.id)?.EmpRegistro === '0'
    const tipoNombre = catalogos?.tipos.find(t => String(t.id) === f.tipo)?.nombre
    const completo = !!f.codigo.trim() && !!f.descripcion.trim()

    const combo = (items: OpcionCatalogo[] | undefined, valor: string, cambiar: (v: string) => void, conCodigo = false) => (
        <ComboSelect<OpcionCatalogo> value={valor} onChange={(i) => cambiar(String(i.id))} items={items ?? []}
                     getKey={(i) => String(i.id)} getLabel={(i) => conCodigo && i.codigo ? `${i.codigo}  ${i.nombre}` : i.nombre}
                     placeholder="Seleccionar…" triggerClassName="h-10 bg-background transition-shadow focus-visible:ring-2 hover:border-blue-300" />
    )
    const comboCuenta = (valor: string, cambiar: (v: string) => void) => (
        <div className="flex gap-1">
            <div className="min-w-0 flex-1">
                <ComboSelect value={valor} onChange={(i: { id: string }) => cambiar(i.id)} items={cuentas} getKey={(i) => i.id}
                             getLabel={(i) => i.codigo} getSub={(i) => i.nombre} subEnBoton="debajo" placeholder="Sin amarre"
                             triggerClassName="h-auto min-h-10 bg-background hover:border-blue-300" contentClassName="min-w-[380px]" />
            </div>
            {valor && <Button type="button" variant="ghost" size="icon" className="h-10 w-9 shrink-0" title="Quitar" onClick={() => cambiar('')}><X className="h-4 w-4" /></Button>}
        </div>
    )

    /** Avisos antes de guardar (Access no bloquea: se pide confirmación). */
    async function avisos(): Promise<string[]> {
        const a: string[] = []
        const cod = f.codigo.trim()
        if (plan.some(p => s(p.Cuenta) === cod && Number(p.IdCtaContable) !== f.id)) a.push(`Ya existe otra cuenta con el código ${cod}.`)
        if (f.id && original && original !== cod) {
            const u = await PlanCuentasService.uso(f.id)
            if (u.length) a.push(`La cuenta ${original} tiene movimientos (${u.map(x => `${x.descripcion}: ${x.cantidad.toLocaleString('en-US')}`).join(', ')}). Si cambia el código, el libro mayor seguirá mostrando el código anterior.`)
        }
        return a
    }

    async function guardar(confirmado = false) {
        if (!completo) {
            toast({ title: 'Información incompleta', description: 'Terminar ingreso en campos (*): código y descripción.', variant: 'destructive' })
            return
        }
        setGuardando(true)
        try {
            if (!confirmado) {
                const a = await avisos()
                if (a.length) { setConfirmar(a); return }
            }
            await PlanCuentasService.guardar(f)
            toast({ title: f.id ? 'Cuenta modificada' : 'Cuenta guardada', description: `${f.codigo} ${f.descripcion}` })
            onCambio()
            if (f.id) onCerrar(); else setF(fichaVacia())   // "Guardar y nuevo"
        } catch (e) {
            toast({ title: 'No se pudo guardar', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
        } finally { setGuardando(false) }
    }

    async function eliminar() {
        if (!f.id) return
        setPreguntaEliminar(false)
        setGuardando(true)
        try {
            const r = await PlanCuentasService.eliminar(f.id)
            if (!r.eliminada) { setUsos(r.usos); return }
            toast({ title: 'Cuenta eliminada', description: `${f.codigo} ${f.descripcion}` })
            onCambio(); onCerrar()
        } catch (e) {
            toast({ title: 'No se pudo eliminar', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
        } finally { setGuardando(false) }
    }

    return (
        <>
            <Dialog open={abierta} onOpenChange={(o) => !o && onCerrar()}>
                <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0 max-h-[94vh] flex flex-col" closeClassName="text-white opacity-90 hover:opacity-100 z-10">
                    {/* ---------- cabecera */}
                    <DialogHeader className="relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-4 text-left text-white sm:px-6 sm:py-5">
                        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl animate-pulse" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
                        <div className="relative flex flex-wrap items-start justify-between gap-3 pr-8 sm:gap-4">
                            <div className="min-w-0 animate-in fade-in-0 slide-in-from-left-4 duration-500">
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                                    {f.id ? <BookOpen className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                    {f.id ? 'Ficha de la cuenta' : 'Nueva cuenta'}
                                </p>
                                <DialogTitle className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-bold">
                                    <span className="font-mono tracking-wider">{f.codigo || '·······'}</span>
                                    <span className="max-w-full truncate text-base font-medium text-blue-50/90 sm:max-w-[480px]">{f.descripcion || 'Sin descripción'}</span>
                                </DialogTitle>
                                <DialogDescription className="mt-2 flex flex-wrap gap-1.5">
                                    {tipoNombre && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/20 backdrop-blur">{tipoNombre}</span>}
                                    {f.id && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/20">Id {f.id}</span>}
                                    {ficha && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white ring-1 ring-white/20">{general ? 'Cuenta general' : 'Cuenta de la empresa'}</span>}
                                </DialogDescription>
                            </div>
                            {/* indicador de nivel */}
                            <div className="flex items-end gap-1 animate-in fade-in-0 slide-in-from-right-4 duration-500 sm:gap-1.5">
                                {NIVELES.map((x, i) => {
                                    const activo = nivel === x.n
                                    const pasado = nivel > x.n
                                    return (
                                        <div key={x.n} className="flex flex-col items-center gap-1" title={`Nivel ${x.n}: ${x.t}`}>
                                            <span className={cn('flex items-center justify-center rounded-lg font-mono text-xs font-bold transition-all duration-500',
                                                activo ? 'h-8 w-8 bg-white text-blue-700 shadow-lg shadow-blue-900/40 scale-110 sm:h-10 sm:w-10'
                                                    : pasado ? 'h-7 w-7 bg-white/35 text-white sm:h-8 sm:w-8' : 'h-7 w-7 bg-white/10 text-blue-100 ring-1 ring-white/20 sm:h-8 sm:w-8')}
                                                  style={{ transitionDelay: `${i * 60}ms` }}>{x.n}</span>
                                            <span className={cn('text-[9px] uppercase tracking-wide', activo ? 'text-white font-semibold' : 'text-blue-200/80')}>{x.t}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* ---------- cuerpo */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-5 sm:py-5">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <Seccion icono={<Hash className="h-4 w-4" />} titulo="Identificación" ayuda="Código y nombre con que la cuenta aparece en los libros." retraso={60}>
                                <div className="grid grid-cols-6 gap-3">
                                    <Campo label="Código cta." obligatorio className="col-span-6 sm:col-span-3">
                                        <Input className="h-10 bg-background font-mono text-base tracking-wider transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500"
                                               maxLength={12} placeholder="1040101" value={f.codigo} onChange={e => set({ codigo: e.target.value.trim() })} />
                                    </Campo>
                                    <Campo label="Fecha alta" className="col-span-6 sm:col-span-3">
                                        <div className="relative">
                                            <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input type="date" className="h-10 bg-background pl-9" value={f.fechaAlta} onChange={e => set({ fechaAlta: e.target.value })} />
                                        </div>
                                    </Campo>
                                    <Campo label="Descripción" obligatorio className="col-span-6">
                                        <Input className="h-10 bg-background transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500" maxLength={255}
                                               placeholder="Nombre de la cuenta" value={f.descripcion} onChange={e => set({ descripcion: e.target.value })} />
                                    </Campo>
                                </div>
                            </Seccion>

                            <Seccion icono={<Layers className="h-4 w-4" />} titulo="Clasificación" ayuda="Tipo, estado de flujo de efectivo y rubro de estados financieros." retraso={140}>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Campo label="Tipo cuenta" obligatorio>{combo(catalogos?.tipos, f.tipo, v => set({ tipo: v }))}</Campo>
                                    <Campo label="Estado flujo" obligatorio>{combo(catalogos?.flujos, f.estadoFlujo, v => set({ estadoFlujo: v }))}</Campo>
                                    <Campo label="Concepto EEFF" obligatorio className="sm:col-span-2">{combo(catalogos?.conceptos, f.conceptoEeff, v => set({ conceptoEeff: v }))}</Campo>
                                </div>
                            </Seccion>

                            <Seccion icono={<GitBranch className="h-4 w-4" />} titulo="Destino automático en libro diario" ayuda="Cuentas que se generan solas al registrar un movimiento en esta cuenta." retraso={220}>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Campo label="Cargos" obligatorio>{comboCuenta(f.amarreCargo, v => set({ amarreCargo: v }))}</Campo>
                                    <Campo label="Abonos" obligatorio>{comboCuenta(f.amarreAbono, v => set({ amarreAbono: v }))}</Campo>
                                </div>
                                <div className="mt-4">
                                    <Campo label="Código SUNAT · balance de comprobación PDT">
                                        <div className="flex gap-1">
                                            <div className="min-w-0 flex-1">{combo(catalogos?.sunat, f.cuentaSunat, v => set({ cuentaSunat: v }), true)}</div>
                                            {f.cuentaSunat && <Button type="button" variant="ghost" size="icon" className="h-10 w-9 shrink-0" title="Quitar" onClick={() => set({ cuentaSunat: '' })}><X className="h-4 w-4" /></Button>}
                                        </div>
                                    </Campo>
                                </div>
                            </Seccion>

                            <Seccion icono={<CheckCircle2 className="h-4 w-4" />} titulo="Disponible en" ayuda="Libros y registros donde se podrá elegir esta cuenta." retraso={300}>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Interruptor icono={<Wallet className="h-4 w-4" />} label="Caja control" valor={f.caja} onChange={v => set({ caja: v })} />
                                    <Interruptor icono={<Landmark className="h-4 w-4" />} label="Ctas. bancos" valor={f.bancos} onChange={v => set({ bancos: v })} />
                                    <Interruptor icono={<BookOpen className="h-4 w-4" />} label="Libro caja" valor={f.libroCaja} onChange={v => set({ libroCaja: v })} />
                                    <Interruptor icono={<Building2 className="h-4 w-4" />} label="Libro bancos" valor={f.libroBancos} onChange={v => set({ libroBancos: v })} />
                                    <Interruptor icono={<ShoppingCart className="h-4 w-4" />} label="Reg. compras" valor={f.regCompras} onChange={v => set({ regCompras: v })} />
                                    <Interruptor icono={<Receipt className="h-4 w-4" />} label="Reg. ventas" valor={f.regVentas} onChange={v => set({ regVentas: v })} />
                                </div>
                            </Seccion>
                        </div>
                    </div>

                    {/* ---------- pie */}
                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>{f.id && (
                            <Button variant="ghost" className="w-full text-red-600 sm:w-auto hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 transition-colors" disabled={guardando} onClick={() => setPreguntaEliminar(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar registro
                            </Button>
                        )}</div>
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            {!completo && <span className="hidden md:inline text-xs text-muted-foreground animate-in fade-in-0">Completa los campos con <span className="text-red-500">*</span></span>}
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onCerrar}>Cerrar</Button>
                            <Button disabled={guardando}
                                    className="relative flex-[2] overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md sm:flex-none shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40 active:translate-y-0"
                                    onClick={() => guardar()}>
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {f.id ? 'Modificar' : 'Guardar y nuevo'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmación de avisos (código repetido / cuenta con movimientos) */}
            <AlertDialog open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /> Revisa antes de guardar</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <ul className="list-disc pl-5 space-y-1 text-sm">{confirmar?.map(a => <li key={a}>{a}</li>)}</ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { setConfirmar(null); guardar(true) }}>Guardar igual</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Pregunta de eliminar */}
            <AlertDialog open={preguntaEliminar} onOpenChange={setPreguntaEliminar}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar la cuenta {original}?</AlertDialogTitle>
                        <AlertDialogDescription>Solo se elimina si no tiene movimientos, subcuentas ni es amarre de otra cuenta.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={eliminar}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ALERTA: no se puede eliminar */}
            <AlertDialog open={!!usos} onOpenChange={(o) => !o && setUsos(null)}>
                <AlertDialogContent className="overflow-hidden p-0 gap-0">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-5 text-white">
                        <AlertDialogHeader className="text-left">
                            <AlertDialogTitle className="flex items-center gap-2 text-white">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 animate-in zoom-in-50 duration-500"><AlertTriangle className="h-5 w-5" /></span>
                                No se puede eliminar la cuenta {original}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-red-50">La cuenta está en uso. Para eliminarla no debe tener movimientos.</AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <div className="px-6 py-4 space-y-2">
                        {usos?.map((u, i) => {
                            const max = Math.max(...(usos ?? []).map(x => x.cantidad), 1)
                            return (
                                <div key={u.tabla} className="animate-in fade-in-0 slide-in-from-left-2" style={{ animationDelay: `${i * 70}ms`, animationFillMode: 'backwards' }}>
                                    <div className="flex justify-between text-sm"><span className="font-medium text-foreground">{u.descripcion}</span>
                                        <span className="font-mono tabular-nums text-muted-foreground">{u.cantidad.toLocaleString('en-US')}</span></div>
                                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-700" style={{ width: `${Math.max(4, (u.cantidad / max) * 100)}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <AlertDialogFooter className="px-6 pb-5"><AlertDialogAction onClick={() => setUsos(null)}>Entendido</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
