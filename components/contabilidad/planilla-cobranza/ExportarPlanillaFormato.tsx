'use client'

import { useRef, useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PdfVistaPreviaDialog } from '@/components/reporte/PdfVistaPreviaDialog'
import { AnexosPlanilla, construirPdfPlanilla } from '@/components/contabilidad/planilla-cobranza/pdfPlanillaFormato'
import apiClient, { publicApi } from '@/app/api/client'
import { OpcionesPdfReporte } from '@/components/reporte/pdfOpciones'
import { CatalogosBanco, PlanillaCabecera, PlanillaDetalle, TipoComprobante } from '@/app/types/planilla-types'

type VoucherPlanilla = { id_detalle: number; ruta_archivo: string }

/**
 * Busca el PDF de cada recibo de cuenta citado en la planilla. El registro solo
 * guarda el número (p. ej. "R-000021"), así que se busca por número.
 */
async function buscarRecibos(numeros: string[]): Promise<Record<string, string>> {
    const mapa: Record<string, string> = {}
    await Promise.all(numeros.map(async numero => {
        const digitos = numero.replace(/\D/g, '')
        if (!digitos) return
        try {
            const res = await apiClient.get('/recibos', { params: { busqueda: digitos } })
            const lista: any[] = res.data?.data?.data ?? []
            const r = lista.find(x => `${x.prefijo}-${x.numero_recibo}` === numero || x.numero_recibo === digitos.padStart(6, '0'))
            if (r?.ruta_pdf && r.estado !== 'ANULADO') mapa[numero] = `${publicApi}${r.ruta_pdf}`
        } catch { /* sin recibo: no se anexa */ }
    }))
    return mapa
}

/** Botón que abre la vista previa de la planilla en el formato impreso (admin y vendedor). */
export function ExportarPlanillaFormato({
    planilla, detalle, tiposComprobante, bancos, etiqueta = 'Exportar planilla', disabled = false, vouchers,
}: {
    planilla:         PlanillaCabecera
    detalle:          PlanillaDetalle[]
    tiposComprobante: TipoComprobante[]
    bancos:           CatalogosBanco[]
    etiqueta?:        string
    disabled?:        boolean
    /** Vouchers de la planilla (por registro); si no se pasan se toman de planilla.vouchers. */
    vouchers?:        VoucherPlanilla[]
}) {
    const [abierto, setAbierto] = useState(false)
    const recibosRef = useRef<Promise<Record<string, string>> | null>(null)

    const listaVouchers: VoucherPlanilla[] = vouchers ?? (planilla as any).vouchers ?? []
    const numerosRecibo = Array.from(new Set(detalle.map(r => r.numero_recibo).filter((n): n is string => !!n)))

    const generar = async (op: OpcionesPdfReporte) => {
        let anexos: AnexosPlanilla | undefined
        if (op.extras?.vouchers || op.extras?.recibos) {
            if (op.extras?.recibos && !recibosRef.current) recibosRef.current = buscarRecibos(numerosRecibo)
            anexos = {
                vouchers: listaVouchers.map(v => ({ id_detalle: v.id_detalle, url: `${publicApi}${v.ruta_archivo}` })),
                recibos:  op.extras?.recibos ? await recibosRef.current! : {},
            }
        }
        return construirPdfPlanilla(planilla, detalle, tiposComprobante, bancos, op, anexos)
    }
    return (
        <>
            <Button size="sm" variant="outline" className="gap-1.5" disabled={disabled || detalle.length === 0}
                    onClick={() => setAbierto(true)} title="Ver la planilla en el formato impreso">
                <FileDown className="h-3.5 w-3.5" /> {etiqueta}
            </Button>
            <PdfVistaPreviaDialog
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo={`Planilla de cobranza ${planilla.numero_planilla}`}
                descripcion="Mismo formato que la planilla impresa"
                defecto={{ titulo: 'PLANILLA DE COBRANZA', nota: '', color: '#163161', tamanoLetra: 'normal',
                           extras: { vouchers: listaVouchers.length > 0, recibos: numerosRecibo.length > 0 } }}
                archivoDefecto={`planilla-cobranza-${planilla.numero_planilla}`}
                generar={generar}
                interruptores={[
                    { k: 'vouchers', t: `Vouchers de pago (${listaVouchers.length})`, d: 'Una hoja por cobro: el voucher junto a su recibo' },
                    { k: 'recibos',  t: `Recibos de cuenta (${numerosRecibo.length})`, d: 'El PDF del recibo al costado de su voucher' },
                ]}
            />
        </>
    )
}
