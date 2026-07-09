'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useProcesarNotaCredito } from "@/app/hooks/useProcesarNotaCredito"
import { AsientoLinea } from "@/app/types/procesar-nota-credito-types"
import { CabeceraAsientoForm } from "./CabeceraAsientoForm"
import { DetalleAsientoTable } from "./DetalleAsientoTable"
import { LineaAsientoModal } from "./LineaAsientoModal"
import { ReiniciarVoucherDialog } from "./ReiniciarVoucherDialog"
import { ConfirmarAplicacionDialog, FaseAplicacion } from "./ConfirmarAplicacionDialog"

function docRef(l?: AsientoLinea) {
    if (!l) return '—'
    return `${l.serie || '—'}${l.serie ? '-' : ''}${l.numero || ''}`
}

export default function ProcesarNotaCreditoPage() {
    const hook = useProcesarNotaCredito()

    const [lineaModalOpen, setLineaModalOpen] = useState(false)
    const [editIndex, setEditIndex]           = useState<number | null>(null)
    const [voucherDialogOpen, setVoucherDialogOpen] = useState(false)
    const [confirmOpen, setConfirmOpen]       = useState(false)
    const [fase, setFase]                     = useState<FaseAplicacion>('confirmar')

    const nc  = hook.lineas.find(l => l.tipDoc === '07') ?? hook.lineas.find(l => l.cargo > 0)
    const fac = hook.lineas.find(l => l.tipDoc === '01' || l.tipDoc === '03') ?? hook.lineas.find(l => l.abono > 0)

    function abrirNueva() {
        setEditIndex(null)
        setLineaModalOpen(true)
    }

    function abrirEditar(index: number) {
        setEditIndex(index)
        setLineaModalOpen(true)
    }

    function guardarLinea(linea: AsientoLinea) {
        if (editIndex === null) hook.agregarLinea(linea)
        else hook.editarLinea(editIndex, linea)
    }

    function onAceptar() {
        if (!hook.puedeAceptar) return
        setFase('confirmar')
        setConfirmOpen(true)
    }

    async function onConfirmarAplicacion() {
        setFase('procesando')
        const ok = await hook.aplicarAsiento()
        setFase(ok ? 'exito' : 'confirmar')
        if (!ok) setConfirmOpen(false)
    }

    async function onConfirmarReinicio() {
        await hook.reiniciarVoucher()
        setVoucherDialogOpen(false)
    }

    return (
        <div className="grid gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Procesar Nota de Crédito</h1>
                <p className="text-muted-foreground">Registra el asiento contable que aplica una nota de crédito contra un comprobante.</p>
            </div>

            <CabeceraAsientoForm
                cabecera={hook.cabecera}
                onChange={hook.setCabecera}
                numeroVoucher={hook.numeroVoucher}
                onReiniciar={() => setVoucherDialogOpen(true)}
                combos={hook.combos}
                combosLoading={hook.combosLoading}
            />

            <Card>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold">Detalle del asiento</h2>
                        <Badge variant="secondary">
                            {hook.lineas.length} {hook.lineas.length === 1 ? 'línea' : 'líneas'}
                        </Badge>
                    </div>
                    <Button onClick={abrirNueva} className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        Agregar línea
                    </Button>
                </div>

                <DetalleAsientoTable
                    lineas={hook.lineas}
                    totalCargo={hook.totalCargo}
                    totalAbono={hook.totalAbono}
                    diferencia={hook.diferencia}
                    cuadrado={hook.cuadrado}
                    onEditar={abrirEditar}
                    onEliminar={hook.eliminarLinea}
                />

                <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t py-3.5">
                    <p className={hook.puedeAceptar ? "text-sm text-green-700" : "text-sm text-red-600"}>
                        {hook.lineas.length === 0
                            ? "Agrega líneas para procesar la aplicación."
                            : hook.puedeAceptar
                                ? "Asiento cuadrado · listo para procesar."
                                : "El asiento debe estar cuadrado (diferencia 0.00) para procesar."}
                    </p>
                    <Button size="lg" disabled={!hook.puedeAceptar} onClick={onAceptar} className="gap-2">
                        Aceptar y procesar
                    </Button>
                </CardContent>
            </Card>

            <LineaAsientoModal
                open={lineaModalOpen}
                onOpenChange={setLineaModalOpen}
                linea={editIndex === null ? null : hook.lineas[editIndex]}
                fechaAsiento={hook.cabecera.fecha}
                onSave={guardarLinea}
            />

            <ReiniciarVoucherDialog
                open={voucherDialogOpen}
                onOpenChange={setVoucherDialogOpen}
                numeroVoucher={hook.numeroVoucher}
                onConfirmar={onConfirmarReinicio}
            />

            <ConfirmarAplicacionDialog
                open={confirmOpen}
                fase={fase}
                ncRef={docRef(nc)}
                facRef={docRef(fac)}
                onCancelar={() => setConfirmOpen(false)}
                onConfirmar={onConfirmarAplicacion}
                onCerrar={() => setConfirmOpen(false)}
            />
        </div>
    )
}
