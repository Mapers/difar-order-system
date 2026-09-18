'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { FileImage, FileText, Printer, Loader2 } from 'lucide-react'
import { PDFDocument, PDFImage, StandardFonts, rgb, PDFFont } from 'pdf-lib'
import { cargarLogoPdf, dibujarCabeceraPdf, sanitizarPdf } from '@/components/reporte/pdfCabecera'
import { format, parseISO } from 'date-fns'
import apiClient, { publicApi } from '@/app/api/client'
import { toast } from '@/app/hooks/useToast'
import {
    CobranzaAsignada, ETIQUETA_ESTADO, EvidenciaCobranza,
    coincideEstado, estadoVisible, simboloMonedaCobranza,
} from '@/app/types/cobranza-types'

interface Props {
    filtros: {
        busqueda?: string
        vendedor?: string
        estados?: string[]
        fechaDesde?: string
        fechaHasta?: string
    }
    descripcionFiltros: string
}

const COLS: { h: string; w: number; align: 'left' | 'right' | 'center' }[] = [
    { h: '#',        w: 16,  align: 'center' },
    { h: 'Factura',  w: 60,  align: 'left'   },
    { h: 'Cliente',  w: 140, align: 'left'   },
    { h: 'RUC/DNI',  w: 56,  align: 'left'   },
    { h: 'Vendedor', w: 94,  align: 'left'   },
    { h: 'Vence',    w: 44,  align: 'center' },
    { h: 'Saldo',    w: 60,  align: 'right'  },
    { h: 'Estado',   w: 64,  align: 'center' },
]

const PAGE_W    = 595.28   // A4 vertical
const PAGE_H    = 841.89
const MARGIN    = 30
const ROW_H     = 14
const PAD_H     = 2
const CONTENT_W = PAGE_W - MARGIN * 2

const CLR_HEADER_BG   = rgb(0.08, 0.17, 0.32)
const CLR_HEADER_TEXT = rgb(1, 1, 1)
const CLR_ROW_ALT     = rgb(0.96, 0.97, 0.99)
const CLR_SEP_HEAVY   = rgb(0.08, 0.17, 0.32)
const CLR_SEP_LIGHT   = rgb(0.88, 0.88, 0.88)
const CLR_BODY        = rgb(0.08, 0.08, 0.08)
const CLR_VENCIDO     = rgb(0.70, 0.10, 0.10)
const CLR_TOTAL       = rgb(0.08, 0.22, 0.62)
const CLR_META_LABEL  = rgb(0.45, 0.45, 0.45)
const CLR_META_VAL    = rgb(0.08, 0.08, 0.08)

// Mismos colores que EstadoCobranzaBadge.tsx (variante texto-700 de cada tono),
// para que el estado se vea igual en la web y en el PDF.
const CLR_ESTADO: Record<string, ReturnType<typeof rgb>> = {
    pendiente:    rgb(0.706, 0.325, 0.035), // amber-700
    en_gestion:   rgb(0.114, 0.306, 0.847), // blue-700
    promesa_pago: rgb(0.494, 0.133, 0.808), // purple-700
    incobrable:   rgb(0.334, 0.373, 0.412), // slate-600 (muted-foreground)
    pagado:       rgb(0.016, 0.471, 0.341), // emerald-700
}

const LIMITE_EXPORTACION = 5000
const LIMITE_COMPROBANTES = 60
const ANCHO_MAX_MINIATURA = 1100

const fmtFecha = (f: string | null) => {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f.slice(0, 10) }
}

const fmtMonto = (n: number) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const recortarTexto = (raw: string, fnt: PDFFont, size: number, maxW: number): string => {
    let texto = raw
    while (texto.length > 0 && fnt.widthOfTextAtSize(texto, size) > maxW) {
        texto = texto.slice(0, -1)
    }
    if (texto !== raw && texto.length > 0) texto = texto.slice(0, -1) + '…'
    return texto
}

// A diferencia de recortarTexto, no corta el texto: lo reparte en tantas
// líneas como haga falta para que el nombre del cliente salga completo.
const partirEnLineas = (raw: string, fnt: PDFFont, size: number, maxW: number): string[] => {
    const palabras = raw.split(' ').filter(Boolean)
    if (palabras.length === 0) return ['']

    const lineas: string[] = []
    let actual = ''

    const partirPalabraLarga = (palabra: string) => {
        let trozo = ''
        for (const car of palabra) {
            const tentativo = trozo + car
            if (fnt.widthOfTextAtSize(tentativo, size) > maxW && trozo) {
                lineas.push(trozo)
                trozo = car
            } else {
                trozo = tentativo
            }
        }
        return trozo
    }

    for (const palabra of palabras) {
        const tentativo = actual ? `${actual} ${palabra}` : palabra
        if (fnt.widthOfTextAtSize(tentativo, size) <= maxW) {
            actual = tentativo
            continue
        }
        if (actual) lineas.push(actual)
        actual = fnt.widthOfTextAtSize(palabra, size) > maxW ? partirPalabraLarga(palabra) : palabra
    }
    if (actual) lineas.push(actual)

    return lineas.length > 0 ? lineas : ['']
}

const esPdfRuta = (ruta: string) => /\.pdf$/i.test(ruta)

// Convierte cualquier imagen (jpg/png/webp) a bytes JPEG reducidos, para que
// el anexo de comprobantes no infle demasiado el PDF final.
async function descargarImagenComoJpg(url: string, anchoMax: number): Promise<Uint8Array | null> {
    try {
        const res = await fetch(url)
        if (!res.ok) return null
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image()
                el.onload = () => resolve(el)
                el.onerror = () => reject(new Error('No se pudo leer la imagen'))
                el.src = blobUrl
            })
            const escala = Math.min(1, anchoMax / img.naturalWidth)
            const w = Math.max(1, Math.round(img.naturalWidth * escala))
            const h = Math.max(1, Math.round(img.naturalHeight * escala))
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
            ctx.drawImage(img, 0, 0, w, h)
            const jpgBlob: Blob = await new Promise((resolve, reject) => {
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo convertir la imagen'))), 'image/jpeg', 0.88)
            })
            return new Uint8Array(await jpgBlob.arrayBuffer())
        } finally {
            URL.revokeObjectURL(blobUrl)
        }
    } catch {
        return null
    }
}

export function ExportAsignadasPdfButton({ filtros, descripcionFiltros }: Props) {
    const [loading, setLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [progreso, setProgreso] = useState<{ actual: number; total: number } | null>(null)

    const generar = async (incluirComprobantes: boolean) => {
        setConfirmOpen(false)
        const { estados, ...restoFiltros } = filtros

        // Igual que en la tabla: si el selector de estados existe pero no tiene
        // nada marcado, no se exporta nada en vez de exportar todo.
        if (estados !== undefined && estados.length === 0) {
            toast({ title: 'Sin registros', description: 'Selecciona uno o más estados para exportar.', variant: 'warning' })
            return
        }

        setLoading(true)
        try {
            const params: Record<string, string> = {
                limit: String(LIMITE_EXPORTACION),
                offset: '0',
            }
            Object.entries(restoFiltros).forEach(([k, v]) => { if (v) params[k] = String(v) })

            const res = await apiClient.get(`/cobranza/asignadas?${new URLSearchParams(params)}`)
            // El backend solo filtra por un estado a la vez; con selección
            // múltiple filtramos aquí sobre lo ya traído.
            const todas: CobranzaAsignada[] = res.data?.data?.data ?? []
            const totalSinTruncar: number = res.data?.data?.total ?? todas.length
            const filas = (estados && estados.length > 0)
                ? todas.filter(c => estados.some(e => coincideEstado(c, e)))
                : todas
            const truncado = totalSinTruncar > todas.length

            if (filas.length === 0) {
                toast({ title: 'Sin registros', description: 'No hay cobranzas asignadas con esos filtros.', variant: 'warning' })
                return
            }

            const pdfDoc   = await PDFDocument.create()
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

            let page       = pdfDoc.addPage([PAGE_W, PAGE_H])
            let y          = PAGE_H - MARGIN
            let pageNumber = 1

            const logoImage = await cargarLogoPdf(pdfDoc)

            const drawPageHeader = (p: typeof page) => {
                const now = new Date()
                const impreso = `Impreso: ${now.toLocaleDateString('es-PE')} `
                    + `${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`

                y = dibujarCabeceraPdf({
                    page: p, font, boldFont, logo: logoImage,
                    pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
                    subtitulo: 'COBRANZAS ASIGNADAS',
                    infoDerecha: `Página ${pageNumber}`,
                    infoDerechaSec: impreso,
                    filtros: descripcionFiltros,
                })
            }

            const checkBreak = (needed: number) => {
                if (y - needed < MARGIN + 24) {
                    page = pdfDoc.addPage([PAGE_W, PAGE_H])
                    pageNumber++
                    drawPageHeader(page)
                    drawTableRow(page, y, COLS.map(c => c.h), true)
                    y -= ROW_H
                    return true
                }
                return false
            }

            function drawTableRow(
                p: typeof page,
                rowY: number,
                cells: (string | string[])[],
                isHeader: boolean,
                isAlt = false,
                estadoKey: string | null = null,
                rowHeight = ROW_H,
            ) {
                if (isHeader) {
                    p.drawRectangle({
                        x: MARGIN, y: rowY - rowHeight + 2,
                        width: CONTENT_W, height: rowHeight, color: CLR_HEADER_BG,
                    })
                } else if (isAlt) {
                    p.drawRectangle({
                        x: MARGIN, y: rowY - rowHeight + 2,
                        width: CONTENT_W, height: rowHeight, color: CLR_ROW_ALT,
                    })
                }

                const fnt  = isHeader ? boldFont : font
                const size = 7
                const maxW = (col: typeof COLS[number]) => col.w - PAD_H * 2

                let x = MARGIN
                COLS.forEach((col, i) => {
                    // La columna Estado usa el mismo color que su badge en la web
                    // (EstadoCobranzaBadge.tsx); el resto de columnas va en negro.
                    const color = isHeader
                        ? CLR_HEADER_TEXT
                        : (col.h === 'Estado' && estadoKey && CLR_ESTADO[estadoKey]) || CLR_BODY

                    // Datos del backend pueden traer caracteres de control (ej. tab al inicio
                    // de cliente_denominacion) que WinAnsi no puede codificar y rompían el PDF.
                    const valor = cells[i]
                    const lineas = Array.isArray(valor)
                        ? valor
                        : [recortarTexto(sanitizarPdf(String(valor ?? '')), fnt, size, maxW(col))]

                    lineas.forEach((linea, lineaIdx) => {
                        const textW = fnt.widthOfTextAtSize(linea, size)
                        const textX = col.align === 'right'
                            ? x + col.w - textW - PAD_H
                            : col.align === 'center'
                                ? x + (col.w - textW) / 2
                                : x + PAD_H

                        p.drawText(linea, { x: textX, y: rowY - ROW_H + 4 - lineaIdx * ROW_H, size, font: fnt, color })
                    })
                    x += col.w
                })
            }

            const drawRowLine = (p: typeof page, rowY: number, rowHeight = ROW_H) => {
                p.drawLine({
                    start: { x: MARGIN, y: rowY - rowHeight + 2 },
                    end:   { x: PAGE_W - MARGIN, y: rowY - rowHeight + 2 },
                    thickness: 0.25, color: CLR_SEP_LIGHT,
                })
            }

            // ── Documento ────────────────────────────────────────────────
            drawPageHeader(page)

            const porMoneda = new Map<string, number>()
            const porEstado = new Map<string, number>()
            let vencidas = 0

            filas.forEach(c => {
                const sim = simboloMonedaCobranza(c.moneda)
                porMoneda.set(sim, (porMoneda.get(sim) ?? 0) + Number(c.saldo_actual || 0))
                const est = estadoVisible(c)
                porEstado.set(est, (porEstado.get(est) ?? 0) + 1)
                if (Number(c.esta_vencido) === 1) vencidas++
            })

            const metaItems = [
                { label: 'Documentos', val: String(filas.length) },
                { label: 'Vencidos',   val: String(vencidas) },
                ...[...porEstado.entries()].map(([est, n]) => ({
                    label: ETIQUETA_ESTADO[est] ?? est,
                    val: String(n),
                })),
            ]
            const metaColW = CONTENT_W / Math.max(metaItems.length, 1)

            metaItems.forEach((item, i) => {
                const x = MARGIN + i * metaColW
                page.drawText(item.label.toUpperCase(), { x, y, size: 6, font, color: CLR_META_LABEL })
                page.drawText(item.val, { x, y: y - 11, size: 8, font: boldFont, color: CLR_META_VAL })
            })
            y -= 30

            if (truncado) {
                page.drawText(
                    `Se alcanzó el límite de exportación (${LIMITE_EXPORTACION}). Acota los filtros para ver el resto.`,
                    { x: MARGIN, y, size: 7, font, color: CLR_VENCIDO },
                )
                y -= 13
            }

            page.drawLine({
                start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
                thickness: 0.4, color: CLR_SEP_LIGHT,
            })
            y -= 4

            drawTableRow(page, y, COLS.map(c => c.h), true)
            y -= ROW_H

            filas.forEach((c, idx) => {
                const nombreCliente = sanitizarPdf(c.cliente_denominacion || '—')
                const lineasCliente = partirEnLineas(nombreCliente, font, 7, COLS[2].w - PAD_H * 2)
                const rowHeight = ROW_H * Math.max(1, lineasCliente.length)

                checkBreak(rowHeight + 2)
                const est = estadoVisible(c)
                drawTableRow(page, y, [
                    String(idx + 1),
                    `${c.serie}-${c.numero}`,
                    lineasCliente,
                    c.cliente_numdoc || '—',
                    c.nombre_vendedor_asignado || c.cod_vendedor_asignado || '—',
                    fmtFecha(c.fecha_vencimiento),
                    `${simboloMonedaCobranza(c.moneda)} ${fmtMonto(Number(c.saldo_actual || 0))}`,
                    ETIQUETA_ESTADO[est] ?? est,
                ], false, idx % 2 === 1, est, rowHeight)

                drawRowLine(page, y, rowHeight)
                y -= rowHeight
            })

            // ── Totales por moneda ───────────────────────────────────────
            checkBreak(20 + porMoneda.size * 14)
            y -= 3
            page.drawLine({
                start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y },
                thickness: 0.8, color: CLR_SEP_HEAVY,
            })
            y -= 14

            const valColW = 90
            const lblColW = 130

            ;[...porMoneda.entries()].forEach(([sim, monto]) => {
                const label = `Saldo total ${sim}:`
                const val   = `${sim} ${fmtMonto(monto)}`
                page.drawText(label, {
                    x: PAGE_W - MARGIN - valColW - lblColW, y,
                    size: 9, font: boldFont, color: CLR_TOTAL,
                })
                page.drawText(val, {
                    x: PAGE_W - MARGIN - boldFont.widthOfTextAtSize(val, 9) - PAD_H, y,
                    size: 9, font: boldFont, color: CLR_TOTAL,
                })
                y -= 14
            })

            // ── Anexo: comprobantes adjuntos ─────────────────────────────
            if (incluirComprobantes) {
                const candidatas = filas.filter(f => Number(f.tiene_evidencia) === 1)
                if (candidatas.length > LIMITE_COMPROBANTES) {
                    toast({
                        title: '',
                        description: `Hay ${candidatas.length} comprobantes; el anexo solo incluye hasta ${LIMITE_COMPROBANTES}. Acota los filtros para verlos todos.`,
                        variant: 'warning',
                    })
                }
                const aIncluir = candidatas.slice(0, LIMITE_COMPROBANTES)

                const items: { fila: CobranzaAsignada; img: PDFImage }[] = []
                let procesados = 0
                for (const fila of aIncluir) {
                    procesados++
                    setProgreso({ actual: procesados, total: aIncluir.length })
                    try {
                        const res = await apiClient.get(`/cobranza/${fila.id_asignacion}/evidencia`)
                        const ev: EvidenciaCobranza | null = res.data?.data?.data ?? null
                        if (!ev || esPdfRuta(ev.ruta)) continue

                        const bytes = await descargarImagenComoJpg(`${publicApi}${ev.ruta}`, ANCHO_MAX_MINIATURA)
                        if (!bytes) continue

                        const img = await pdfDoc.embedJpg(bytes)
                        items.push({ fila, img })
                    } catch {
                        // Si un comprobante puntual falla (red, formato, etc.) se omite
                        // y se sigue con el resto; no debe tumbar toda la exportación.
                    }
                }

                if (items.length > 0) {
                    const COLS_ANEXO = 1
                    const GAP        = 14
                    const CARD_PAD   = 10
                    const IMG_BOX_H  = 430
                    const CARD_W     = (CONTENT_W - GAP * (COLS_ANEXO - 1)) / COLS_ANEXO
                    const CARD_H     = CARD_PAD * 2 + 31 + IMG_BOX_H + 4

                    page = pdfDoc.addPage([PAGE_W, PAGE_H])
                    pageNumber++
                    y = dibujarCabeceraPdf({
                        page, font, boldFont, logo: logoImage,
                        pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
                        subtitulo: 'ANEXO — COMPROBANTES ADJUNTOS',
                        infoDerecha: `Página ${pageNumber}`,
                        infoDerechaSec: `${items.length} de ${filas.length} documentos`,
                    })

                    const filasAnexo: typeof items[] = []
                    for (let i = 0; i < items.length; i += COLS_ANEXO) filasAnexo.push(items.slice(i, i + COLS_ANEXO))

                    filasAnexo.forEach((fila) => {
                        if (y - CARD_H < MARGIN) {
                            page = pdfDoc.addPage([PAGE_W, PAGE_H])
                            pageNumber++
                            y = dibujarCabeceraPdf({
                                page, font, boldFont, logo: logoImage,
                                pageWidth: PAGE_W, pageHeight: PAGE_H, margin: MARGIN,
                                subtitulo: 'ANEXO — COMPROBANTES ADJUNTOS',
                                infoDerecha: `Página ${pageNumber}`,
                                infoDerechaSec: `${items.length} de ${filas.length} documentos`,
                            })
                        }

                        const topY = y
                        fila.forEach((it, col) => {
                            const x = MARGIN + col * (CARD_W + GAP)

                            page.drawRectangle({
                                x, y: topY - CARD_H, width: CARD_W, height: CARD_H,
                                borderColor: CLR_SEP_LIGHT, borderWidth: 0.75,
                            })

                            const facturaTxt = `${it.fila.serie}-${it.fila.numero}`
                            page.drawText(
                                recortarTexto(sanitizarPdf(facturaTxt), boldFont, 12, CARD_W - CARD_PAD * 2 - 140),
                                { x: x + CARD_PAD, y: topY - CARD_PAD - 10, size: 12, font: boldFont, color: CLR_BODY },
                            )
                            const montoCabecera = `${simboloMonedaCobranza(it.fila.moneda)} ${fmtMonto(Number(it.fila.saldo_actual || 0))}`
                            page.drawText(montoCabecera, {
                                x: x + CARD_W - CARD_PAD - boldFont.widthOfTextAtSize(montoCabecera, 12),
                                y: topY - CARD_PAD - 10, size: 12, font: boldFont, color: CLR_TOTAL,
                            })
                            page.drawText(
                                recortarTexto(sanitizarPdf(it.fila.cliente_denominacion || '—'), font, 10, CARD_W - CARD_PAD * 2),
                                { x: x + CARD_PAD, y: topY - CARD_PAD - 24, size: 10, font, color: CLR_META_LABEL },
                            )

                            const imgBoxW  = CARD_W - CARD_PAD * 2
                            const imgTopY  = topY - CARD_PAD - 31
                            const escalaImg = Math.min(imgBoxW / it.img.width, IMG_BOX_H / it.img.height)
                            const dw = it.img.width * escalaImg
                            const dh = it.img.height * escalaImg
                            const imgX = x + CARD_PAD + (imgBoxW - dw) / 2
                            const imgY = imgTopY - IMG_BOX_H + (IMG_BOX_H - dh) / 2
                            page.drawImage(it.img, { x: imgX, y: imgY, width: dw, height: dh })
                        })

                        y -= CARD_H + GAP
                    })
                }
            }

            const pdfBytes = await pdfDoc.save()
            const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
            const link     = document.createElement('a')
            link.href      = URL.createObjectURL(blob)
            link.download  = `Cobranzas_Asignadas_${format(new Date(), 'yyyy-MM-dd')}.pdf`
            link.click()
            URL.revokeObjectURL(link.href)

        } catch (err) {
            console.error(err)
            toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' })
        } finally {
            setLoading(false)
            setProgreso(null)
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 border-border text-foreground hover:bg-muted lg:w-auto"
                onClick={() => setConfirmOpen(true)}
                disabled={loading}
            >
                {loading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Printer className="h-3.5 w-3.5" />}
                {loading
                    ? (progreso ? `Comprobante ${progreso.actual}/${progreso.total}...` : 'Generando...')
                    : 'Exportar PDF'}
            </Button>

            <Dialog open={confirmOpen} onOpenChange={(v) => { if (!loading) setConfirmOpen(v) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Exportar PDF</DialogTitle>
                        <DialogDescription>
                            ¿Quieres incluir un anexo con los comprobantes de pago adjuntos, o solo el listado?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => generar(false)}
                            className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-muted"
                        >
                            <FileText className="h-7 w-7 text-muted-foreground" />
                            <span className="text-sm font-medium">Solo listado</span>
                            <span className="text-xs text-muted-foreground">Más rápido y liviano</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => generar(true)}
                            className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-muted"
                        >
                            <FileImage className="h-7 w-7 text-muted-foreground" />
                            <span className="text-sm font-medium">Con comprobantes</span>
                            <span className="text-xs text-muted-foreground">Agrega un anexo con las fotos</span>
                        </button>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
                            Cancelar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
