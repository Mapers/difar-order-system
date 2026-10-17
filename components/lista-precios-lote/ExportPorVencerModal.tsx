'use client'

import { useState } from 'react'
import { CalendarClock, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { generarExcel } from '@/app/dashboard/lista-precios-lote/export-excel-button'
import { generarPdf } from '@/app/dashboard/lista-precios-lote/export-pdf-button'
import { FiltrosPantalla, obtenerDatosPorVencer, rangoVencimiento } from '@/app/dashboard/lista-precios-lote/services/porVencerExport'

type Formato = 'excel' | 'pdf-horizontal' | 'pdf-vertical'

const MESES = Array.from({ length: 12 }, (_, i) => i + 1)

const FORMATOS: { id: Formato; titulo: string; detalle: string; icono: typeof FileText; color: string }[] = [
    { id: 'excel',          titulo: 'Excel',          detalle: '.xlsx',         icono: FileSpreadsheet, color: 'text-green-600' },
    { id: 'pdf-horizontal', titulo: 'PDF horizontal', detalle: 'Recomendado',   icono: FileText,        color: 'text-red-600' },
    { id: 'pdf-vertical',   titulo: 'PDF vertical',   detalle: 'Letra pequeña', icono: FileText,        color: 'text-red-600' },
]

function listaCorta(nombres: string[], max = 3) {
    if (nombres.length <= max) return nombres.join(', ')
    return `${nombres.slice(0, max).join(', ')} y ${nombres.length - max} más`
}

interface ExportPorVencerModalProps {
    payload: any
    filters: FiltrosPantalla
    porAlmacen: boolean
    almacenSel: number | null
    /** Nombres de los laboratorios elegidos en la pantalla; vacío = todos. */
    laboratorios: string[]
    almacenNombre: string | null
}

/**
 * Export de productos por vencer. Solo pide los meses y el formato: el resto
 * (laboratorios, almacén, stock, búsqueda) sale de los filtros de la pantalla
 * y se muestra en el resumen para que se vea qué se va a exportar.
 */
export function ExportPorVencerModal({ payload, filters, porAlmacen, almacenSel, laboratorios, almacenNombre }: ExportPorVencerModalProps) {
    const [open, setOpen] = useState(false)
    const [meses, setMeses] = useState(4)
    const [formato, setFormato] = useState<Formato>('pdf-vertical')
    const [loading, setLoading] = useState(false)

    const { desde, hasta } = rangoVencimiento(meses)
    const stockEscaso = Number(filters.lowStockThreshold)

    const resumen: { etiqueta: string; valor: string }[] = [
        { etiqueta: 'Laboratorios', valor: laboratorios.length > 0 ? listaCorta(laboratorios) : 'Todos' },
        {
            etiqueta: 'Almacén',
            valor: almacenSel != null
                ? (almacenNombre ?? `Almacén ${almacenSel}`)
                : porAlmacen ? 'Todos, separado por almacén' : 'Todos los almacenes',
        },
        {
            etiqueta: 'Stock',
            valor: [
                filters.excludeNoStock ? 'Solo con stock' : 'Con y sin stock',
                stockEscaso > 0 ? `stock escaso menor a ${stockEscaso}` : null,
            ].filter(Boolean).join(' · '),
        },
    ]
    if (filters.searchTerm) resumen.push({ etiqueta: 'Búsqueda', valor: filters.searchTerm })
    if (filters.selectedPrinciple) resumen.push({ etiqueta: 'Principio activo', valor: filters.selectedPrinciple })

    const exportar = async () => {
        if (loading) return
        setLoading(true)

        try {
            const datos = await obtenerDatosPorVencer({ payload, meses, filtros: filters, porAlmacen, almacenSel })
            if (!datos) {
                alert(`No hay lotes que venzan hasta el ${hasta.format('DD/MM/YYYY')} con los filtros aplicados.`)
                return
            }

            const fechaHasta = hasta.format('DD/MM/YYYY')
            const sufijo = `${almacenSel != null ? `-alm${almacenSel}` : porAlmacen ? '-por-almacen' : ''}-${meses}m-${new Date().toISOString().split('T')[0]}`

            if (formato === 'excel') {
                await generarExcel({
                    datos,
                    titulo: `PRODUCTOS POR VENCER HASTA ${fechaHasta} — DROGUERÍA DIFAR`,
                    nombreArchivo: `productos-por-vencer${sufijo}.xlsx`,
                })
            } else {
                const orientation = formato === 'pdf-horizontal' ? 'horizontal' : 'vertical'
                await generarPdf({
                    datos,
                    orientation,
                    subtitulo: `PRODUCTOS POR VENCER HASTA ${fechaHasta}`,
                    nombreArchivo: `productos-por-vencer${sufijo}-${orientation}.pdf`,
                    mensajeVacio: 'No hay lotes por vencer con los filtros aplicados.',
                })
            }

            setOpen(false)
        } catch (error) {
            console.error('Error al exportar productos por vencer:', error)
            alert('Ocurrió un error al generar el archivo.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={v => { if (!loading) setOpen(v) }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="relative flex items-center gap-2 border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                >
                    <CalendarClock className="h-4 w-4" />
                    Por vencer
                    <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold leading-4 text-white">
                        Nuevo
                    </span>
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
                            <CalendarClock className="h-5 w-5 text-orange-600" />
                        </span>
                        Exportar productos por vencer
                    </DialogTitle>
                    <DialogDescription className="pl-12">
                        Solo se incluyen los lotes que vencen dentro del rango elegido.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <p className="text-sm font-semibold">Vencen en los próximos</p>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                        {MESES.map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMeses(m)}
                                className={cn(
                                    'rounded-md border py-1.5 text-sm transition-colors',
                                    meses === m
                                        ? 'border-blue-600 bg-blue-600 font-semibold text-white'
                                        : 'border-border hover:bg-muted',
                                )}
                            >
                                {m === 1 ? '1 mes' : `${m} meses`}
                            </button>
                        ))}
                    </div>
                    <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Lotes con vencimiento entre <b>{desde.format('DD/MM/YYYY')}</b> y <b>{hasta.format('DD/MM/YYYY')}</b>
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-semibold">Formato</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {FORMATOS.map(f => {
                            const Icono = f.icono
                            return (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setFormato(f.id)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors',
                                        formato === f.id
                                            ? 'border-2 border-blue-600 bg-blue-50 dark:bg-blue-950'
                                            : 'border-border hover:bg-muted',
                                    )}
                                >
                                    <Icono className={cn('h-4 w-4 shrink-0', f.color)} />
                                    <span>
                                        <span className="block text-sm font-semibold">{f.titulo}</span>
                                        <span className="block text-xs text-muted-foreground">{f.detalle}</span>
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1 text-xs">
                        <p className="font-semibold text-muted-foreground">Filtros de la pantalla que se aplican:</p>
                        {resumen.map(r => (
                            <p key={r.etiqueta}>
                                <span className="text-muted-foreground">{r.etiqueta}:</span> {r.valor}
                            </p>
                        ))}
                    </div>
                    <div className="flex shrink-0 gap-2">
                        <Button variant="outline" disabled={loading} onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button disabled={loading} onClick={exportar} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {loading ? 'Generando...' : 'Exportar'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
