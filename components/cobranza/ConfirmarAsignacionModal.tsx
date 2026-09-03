'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Loader2, MessageCircle } from 'lucide-react'
import apiClient from '@/app/api/client'
import { FacturaPorAsignar, VendedorNotificar } from '@/app/types/cobranza-types'

interface VendedorOpcion { codigo: string; nombre: string }

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    seleccionadas: FacturaPorAsignar[]
    guardando: boolean
    consultarVendedores: (codigos: string[]) => Promise<VendedorNotificar[]>
    onConfirmar: (asignaciones: { id_sunat: number; cod_vendedor: string }[]) => void
}

export function ConfirmarAsignacionModal({
    open, onOpenChange, seleccionadas, guardando, consultarVendedores, onConfirmar,
}: Props) {
    const [destinos, setDestinos] = useState<Record<string, string>>({})
    const [vendedores, setVendedores] = useState<VendedorOpcion[]>([])
    const [avisos, setAvisos] = useState<VendedorNotificar[]>([])
    const [cargando, setCargando] = useState(false)

    const grupos = useMemo(() => {
        const mapa = new Map<string, { nombre: string; facturas: FacturaPorAsignar[] }>()
        seleccionadas.forEach(f => {
            const g = mapa.get(f.cod_vendedor) ?? { nombre: f.nombre_vendedor, facturas: [] }
            g.facturas.push(f)
            mapa.set(f.cod_vendedor, g)
        })
        return [...mapa.entries()].map(([codigo, g]) => ({ codigo, ...g }))
    }, [seleccionadas])

    useEffect(() => {
        if (!open) return

        setDestinos(Object.fromEntries(grupos.map(g => [g.codigo, g.codigo])))

        let cancelado = false
        setCargando(true)

        apiClient.get('/usuarios/listar/vendedores')
            .then(res => {
                if (cancelado) return
                const filas = res.data?.data?.data ?? []
                setVendedores(filas.map((v: any) => ({
                    codigo: v.Codigo_Vend,
                    nombre: `${v.Nombres ?? ''} ${v.Apellidos ?? ''}`.trim() || v.Codigo_Vend,
                })))
            })
            .catch(() => { if (!cancelado) setVendedores([]) })
            .finally(() => { if (!cancelado) setCargando(false) })

        return () => { cancelado = true }
    }, [open, grupos])

    useEffect(() => {
        if (!open) return
        const codigos = [...new Set(Object.values(destinos))].filter(Boolean)
        if (codigos.length === 0) { setAvisos([]); return }

        let cancelado = false
        consultarVendedores(codigos).then(v => { if (!cancelado) setAvisos(v) })
        return () => { cancelado = true }
    }, [open, destinos, consultarVendedores])

    const sinTelefono = avisos.filter(v => Number(v.telefono_usable) !== 1)

    const confirmar = () => {
        const asignaciones = seleccionadas.map(f => ({
            id_sunat: f.id_sunat,
            cod_vendedor: destinos[f.cod_vendedor] || f.cod_vendedor,
        }))
        onConfirmar(asignaciones)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!guardando) onOpenChange(v) }}>
            <DialogContent className="max-h-[95vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Confirmar asignación</DialogTitle>
                    <DialogDescription>
                        Se avisará por WhatsApp a cada vendedor de sus nuevas facturas por cobrar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    {grupos.map(g => (
                        <div key={g.codigo} className="rounded-lg border bg-muted/40 p-3">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm">
                                    <b>{g.nombre}</b>{' '}
                                    <span className="text-muted-foreground">
                                        · {g.facturas.length} factura{g.facturas.length === 1 ? '' : 's'}
                                    </span>
                                </span>
                                {destinos[g.codigo] && destinos[g.codigo] !== g.codigo && (
                                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                        Reasignada
                                    </span>
                                )}
                            </div>

                            <Select
                                value={destinos[g.codigo] ?? g.codigo}
                                onValueChange={(v) => setDestinos(prev => ({ ...prev, [g.codigo]: v }))}
                                disabled={cargando || guardando}
                            >
                                <SelectTrigger className="text-xs">
                                    <SelectValue placeholder="Asignar a..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendedores.map(v => (
                                        <SelectItem key={v.codigo} value={v.codigo}>
                                            {v.codigo} · {v.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>

                {sinTelefono.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                            <AlertTriangle className="h-4 w-4" />
                            Sin WhatsApp
                        </p>
                        <p className="mt-1 text-xs text-amber-700">
                            {sinTelefono.map(v => v.nombre).join(', ')}{' '}
                            {sinTelefono.length === 1 ? 'no tiene' : 'no tienen'} un número válido registrado.
                            La asignación se hará igual, pero {sinTelefono.length === 1 ? 'no recibirá' : 'no recibirán'} el aviso.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button onClick={confirmar} disabled={guardando || seleccionadas.length === 0} className="gap-1.5">
                        {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        Confirmar y avisar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
