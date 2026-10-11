'use client'

import React, { useEffect, useMemo, useRef, useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Download, Loader2, Maximize2, MessageCircle, Pencil, Printer, Share2, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/app/hooks/useToast"
import apiClient from "@/app/api/client"
import { EMPRESA } from "@/components/reporte/pdfCabecera"
import { WhatsAppModal } from "@/app/dashboard/comprobantes/modals/ActionModals"

/**
 * Vista previa del comprobante de "Tomar Pedido Hoja en Blanco".
 *
 * La hoja se dibuja en HTML (A4) para poder hacer zoom y editar textos en
 * linea; Descargar / Imprimir / Compartir / WhatsApp generan el PDF real con
 * jsPDF a partir de los mismos datos (incluyendo lo editado en el modal).
 *
 * Razon social: /laboratorios/combos/laboratorios/empresas (mismo servicio
 * que Cliente Cobranza y Planilla Cobranza).
 *
 * WhatsApp: /admin/sendWhatsappCompr (el mismo de Comprobantes) solo acepta
 * el idSunat de un comprobante ya emitido. Mientras el guardado sea
 * simulado no hay idSunat, asi que se abre WhatsApp con el mensaje y se
 * descarga el PDF para adjuntarlo. Cuando el guardado real devuelva el
 * idSunat, basta con pasarlo en `data.idSunat` y se usa el servicio.
 */

export interface ComprobantePreviewLinea {
    codigo: string
    descripcion: string
    cantidad: number
    precio: number
    afecto: boolean
}

export interface ComprobantePreviewData {
    idSunat?: string | number
    documento: string
    serie: string
    numero: string
    fecha: string
    clienteNombre: string
    clienteDocumento: string
    clienteDireccion: string
    clienteTelefono: string
    vendedor: string
    condicion: string
    diasCredito: number
    moneda: string
    monedaCodigo: string
    simbolo: string
    operacion: string
    almacen: string
    observaciones: string
    referencia?: string
    tasaIgv: number
    lineas: ComprobantePreviewLinea[]
    totales: { vvna: number; vva: number; igv: number; total: number }
}

interface Empresa { razonSocial: string; ruc: string }

const ZOOM_MIN = 0.4
const ZOOM_MAX = 2
const ZOOM_PASO = 0.1
const ANCHO_HOJA_PX = 794 // A4 a 96dpi

const fmt = (n: number) => n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fechaLegible = (iso: string) => {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
}
const ahoraLegible = () => new Date().toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

// ── Importe en letras ("SON: ...") ──
const UNIDADES = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"]
const DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"]
const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]
const decenas = (n: number) => (n < 30 ? UNIDADES[n] : DECENAS[Math.floor(n / 10)] + (n % 10 ? ` Y ${UNIDADES[n % 10]}` : ""))
const centenas = (n: number) => (n === 100 ? "CIEN" : `${CENTENAS[Math.floor(n / 100)]} ${decenas(n % 100)}`.trim())
const miles = (n: number) => {
    const m = Math.floor(n / 1000)
    const r = n % 1000
    const prefijo = m === 0 ? "" : m === 1 ? "MIL" : `${centenas(m)} MIL`
    return `${prefijo} ${r ? centenas(r) : ""}`.trim()
}
function enteroALetras(n: number): string {
    if (n === 0) return "CERO"
    const millones = Math.floor(n / 1_000_000)
    const r = n % 1_000_000
    const prefijo = millones === 0 ? "" : millones === 1 ? "UN MILLÓN" : `${miles(millones)} MILLONES`
    return `${prefijo} ${r ? miles(r) : ""}`.trim().replace(/VEINTIUNO (MIL|MILLONES)/g, "VEINTIÚN $1").replace(/\bUNO (MIL|MILLONES)/g, "UN $1")
}
function importeEnLetras(total: number, monedaCodigo: string): string {
    const entero = Math.floor(Math.round(total * 100) / 100)
    const centimos = Math.round((total - entero) * 100)
    const moneda = monedaCodigo === "USD" ? "DÓLARES AMERICANOS" : "SOLES"
    return `${enteroALetras(entero)} CON ${String(centimos).padStart(2, "0")}/100 ${moneda}`
}

interface Logo { src: string; aspecto: number } // aspecto = ancho / alto

// difar-logo.png es 2866x1472 con mucho margen transparente: se recorta al
// contenido real y se reduce a 1200px de ancho, asi se ve grande y nitido en
// la hoja y el PDF no carga 1.3MB de imagen.
async function cargarLogo(): Promise<Logo | null> {
    try {
        const img = new Image()
        img.src = "/difar-logo.png"
        await img.decode()

        const lienzo = document.createElement("canvas")
        lienzo.width = img.naturalWidth
        lienzo.height = img.naturalHeight
        const ctx = lienzo.getContext("2d", { willReadFrequently: true })
        if (!ctx) return null
        ctx.drawImage(img, 0, 0)

        const { data, width, height } = ctx.getImageData(0, 0, lienzo.width, lienzo.height)
        let minX = width, minY = height, maxX = -1, maxY = -1
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (data[(y * width + x) * 4 + 3] > 16) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                    if (y < minY) minY = y
                    if (y > maxY) maxY = y
                }
            }
        }
        if (maxX < 0) return null

        const anchoRecorte = maxX - minX + 1
        const altoRecorte = maxY - minY + 1
        const escala = Math.min(1, 1200 / anchoRecorte)
        const salida = document.createElement("canvas")
        salida.width = Math.round(anchoRecorte * escala)
        salida.height = Math.round(altoRecorte * escala)
        const ctxSalida = salida.getContext("2d")
        if (!ctxSalida) return null
        ctxSalida.imageSmoothingQuality = "high"
        ctxSalida.drawImage(lienzo, minX, minY, anchoRecorte, altoRecorte, 0, 0, salida.width, salida.height)

        return { src: salida.toDataURL("image/png"), aspecto: anchoRecorte / altoRecorte }
    } catch {
        return null
    }
}

async function cargarEmpresa(): Promise<Empresa> {
    try {
        const res = await apiClient.get("/laboratorios/combos/laboratorios/empresas")
        const lista: { CodigoEmpresa: string; NombreRazSocial: string }[] = res.data?.data?.data || res.data?.data || []
        const empresa = lista.find((e) => e.CodigoEmpresa === EMPRESA.ruc) ?? lista[0]
        if (empresa?.NombreRazSocial) return { razonSocial: empresa.NombreRazSocial, ruc: empresa.CodigoEmpresa || EMPRESA.ruc }
    } catch { /* se usa el respaldo */ }
    return { razonSocial: EMPRESA.nombre, ruc: EMPRESA.ruc }
}

// Paleta compartida por la hoja HTML y el PDF
const AZUL: [number, number, number] = [30, 64, 175]      // blue-800
const AZUL_CLARO: [number, number, number] = [239, 246, 255] // blue-50
const PIZARRA: [number, number, number] = [15, 23, 42]   // slate-900
const GRIS: [number, number, number] = [100, 116, 139]   // slate-500
const BORDE: [number, number, number] = [226, 232, 240]  // slate-200

function construirPdf(data: ComprobantePreviewData, empresa: Empresa, logo: Logo | null): jsPDF {
    const doc = new jsPDF({ unit: "mm", format: "a4" })
    const ancho = doc.internal.pageSize.getWidth()
    const alto = doc.internal.pageSize.getHeight()
    const m = 14
    const util = ancho - m * 2

    // Marca de agua (antes del contenido para quedar debajo)
    doc.setFont("helvetica", "bold").setFontSize(70).setTextColor(241, 245, 249)
    doc.text("VISTA PREVIA", ancho / 2, alto / 2 + 20, { align: "center", angle: 35 })

    // Franja superior
    doc.setFillColor(...AZUL).rect(0, 0, ancho, 4, "F")

    // Emisor
    let yEmisor = 14
    if (logo) {
        // 21mm de alto, ancho segun proporcion del logo recortado (max 62mm)
        const altoLogo = Math.min(21, 62 / logo.aspecto)
        try { doc.addImage(logo.src, "PNG", m, 9, altoLogo * logo.aspecto, altoLogo, undefined, "FAST"); yEmisor = 9 + altoLogo + 5 } catch { /* sin logo */ }
    }
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...PIZARRA)
    const lineasRazon = doc.splitTextToSize(empresa.razonSocial, 110)
    doc.text(lineasRazon, m, yEmisor)
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS)
    doc.text(`RUC ${empresa.ruc}`, m, yEmisor + lineasRazon.length * 4.4 + 0.6)

    // Recuadro del comprobante
    const bw = 64, bx = ancho - m - bw, by = 10
    doc.setDrawColor(...AZUL).setLineWidth(0.7).roundedRect(bx, by, bw, 30, 2, 2, "S")
    doc.setTextColor(...AZUL).setFont("helvetica", "bold").setFontSize(9.5)
    doc.text(`R.U.C. N° ${empresa.ruc}`, bx + bw / 2, by + 7, { align: "center" })
    doc.setFillColor(...AZUL).rect(bx + 0.35, by + 10, bw - 0.7, 9, "F")
    doc.setTextColor(255).setFontSize(10.5)
    doc.text((data.documento || "Comprobante").toUpperCase(), bx + bw / 2, by + 16, { align: "center" })
    doc.setTextColor(...PIZARRA).setFontSize(12)
    doc.text(`${data.serie || "----"} - ${data.numero}`, bx + bw / 2, by + 26.5, { align: "center" })

    // Bloques de datos: cliente (izq) y comprobante (der)
    let y = 50
    const gap = 4
    const wIzq = util * 0.58, wDer = util - wIzq - gap
    const xDer = m + wIzq + gap
    const altoBloque = 33
    const bloque = (x: number, w: number, titulo: string) => {
        doc.setFillColor(248, 250, 252).setDrawColor(...BORDE).setLineWidth(0.3).roundedRect(x, y, w, altoBloque, 2, 2, "FD")
        doc.setFillColor(...AZUL).rect(x, y + 2, 1.1, altoBloque - 4, "F")
        doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...AZUL)
        doc.text(titulo, x + 5, y + 6)
    }
    const dato = (x: number, yy: number, label: string, valor: string, anchoTotal: number, anchoLabel = 22) => {
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GRIS)
        doc.text(label, x, yy)
        doc.setFont("helvetica", "bold").setTextColor(...PIZARRA)
        doc.text(doc.splitTextToSize(valor || "—", anchoTotal - anchoLabel)[0], x + anchoLabel, yy)
    }
    bloque(m, wIzq, "DATOS DEL CLIENTE")
    dato(m + 5, y + 12.5, "Señor(es)", data.clienteNombre, wIzq - 8)
    dato(m + 5, y + 18.5, "RUC / DNI", data.clienteDocumento, wIzq - 8)
    dato(m + 5, y + 24.5, "Dirección", data.clienteDireccion, wIzq - 8)
    dato(m + 5, y + 30.5, "Vendedor", data.vendedor, wIzq - 8)

    bloque(xDer, wDer, "DATOS DEL COMPROBANTE")
    dato(xDer + 5, y + 12.5, "Emisión", fechaLegible(data.fecha), wDer - 8, 20)
    dato(xDer + 5, y + 18.5, "Condición", data.diasCredito ? `${data.condicion} (${data.diasCredito} d)` : data.condicion, wDer - 8, 20)
    dato(xDer + 5, y + 24.5, "Moneda", data.moneda, wDer - 8, 20)
    dato(xDer + 5, y + 30.5, "Almacén", data.almacen, wDer - 8, 20)
    y += altoBloque + 4

    if (data.referencia) {
        doc.setFillColor(255, 251, 235).setDrawColor(252, 211, 77).roundedRect(m, y, util, 8, 1.5, 1.5, "FD")
        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(180, 83, 9)
        doc.text(`Documento que modifica: ${data.referencia}`, m + 4, y + 5.3)
        y += 11
    }

    autoTable(doc, {
        startY: y,
        head: [["#", "Código", "Descripción", "Cant.", `P. Unit.`, `Importe`]],
        body: data.lineas.length
            ? data.lineas.map((l, i) => [
                String(i + 1),
                l.codigo,
                l.descripcion + (l.afecto ? "" : "  · Inafecto"),
                l.cantidad.toLocaleString("es-PE"),
                fmt(l.precio),
                fmt(l.cantidad * l.precio),
            ])
            : [[{ content: "Sin items agregados", colSpan: 6, styles: { halign: "center", textColor: GRIS } }]],
        theme: "plain",
        headStyles: { fillColor: PIZARRA, textColor: 255, fontStyle: "bold", fontSize: 8, cellPadding: { top: 2.6, bottom: 2.6, left: 2, right: 2 } },
        bodyStyles: { fontSize: 8.3, textColor: PIZARRA, cellPadding: { top: 2.4, bottom: 2.4, left: 2, right: 2 }, lineColor: BORDE, lineWidth: { bottom: 0.2 } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 8, halign: "center", textColor: GRIS },
            1: { cellWidth: 22, font: "courier", fontSize: 8 },
            3: { cellWidth: 15, halign: "right" },
            4: { cellWidth: 24, halign: "right" },
            5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
        },
        didParseCell: (h) => {
            if (h.section === "head" && h.column.index >= 3) h.cell.styles.halign = "right"
            if (h.section === "head" && h.column.index === 0) h.cell.styles.halign = "center"
        },
        margin: { left: m, right: m },
    })

    // Totales (der) + importe en letras y observaciones (izq)
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 6
    const tw = 74, tx = ancho - m - tw
    const filas: [string, number][] = [
        ["Op. gravada", data.totales.vva],
        ["Op. inafecta", data.totales.vvna],
        [`IGV (${(data.tasaIgv * 100).toFixed(0)}%)`, data.totales.igv],
    ]
    doc.setDrawColor(...BORDE).setLineWidth(0.3).roundedRect(tx, y, tw, filas.length * 6.5 + 12, 2, 2, "S")
    let ty = y + 5.5
    filas.forEach(([label, valor]) => {
        doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GRIS).text(label, tx + 4, ty)
        doc.setTextColor(...PIZARRA).text(`${data.simbolo} ${fmt(valor)}`, tx + tw - 4, ty, { align: "right" })
        ty += 6.5
    })
    doc.setFillColor(...AZUL).roundedRect(tx, ty - 3, tw, 10.5, 2, 2, "F")
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(255)
    doc.text("IMPORTE TOTAL", tx + 4, ty + 3.6)
    doc.text(`${data.simbolo} ${fmt(data.totales.total)}`, tx + tw - 4, ty + 3.6, { align: "right" })

    const wl = util - tw - 6
    doc.setFillColor(...AZUL_CLARO).roundedRect(m, y, wl, 13, 2, 2, "F")
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...AZUL).text("SON:", m + 4, y + 5)
    doc.setFontSize(8).setTextColor(...PIZARRA)
    doc.text(doc.splitTextToSize(importeEnLetras(data.totales.total, data.monedaCodigo), wl - 8).slice(0, 2), m + 4, y + 9.4)

    if (data.observaciones) {
        doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...GRIS).text("OBSERVACIONES", m, y + 20)
        doc.setFont("helvetica", "normal").setFontSize(8.3).setTextColor(...PIZARRA)
        doc.text(doc.splitTextToSize(data.observaciones, wl).slice(0, 4), m, y + 25)
    }

    // Pie
    doc.setDrawColor(...BORDE).setLineWidth(0.3).line(m, alto - 16, ancho - m, alto - 16)
    doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...GRIS)
    doc.text("Vista previa generada desde Tomar Pedido Hoja en Blanco — no válida como comprobante electrónico.", m, alto - 11)
    doc.text(`Generado el ${ahoraLegible()} · Página 1 de 1`, ancho - m, alto - 11, { align: "right" })

    return doc
}

export default function ComprobantePreviewModal({
    open, onOpenChange, data,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: ComprobantePreviewData
}) {
    const [editable, setEditable] = useState<ComprobantePreviewData>(data)
    const [editando, setEditando] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [logo, setLogo] = useState<Logo | null>(null)
    const [empresa, setEmpresa] = useState<Empresa>({ razonSocial: EMPRESA.nombre, ruc: EMPRESA.ruc })
    const [ocupado, setOcupado] = useState<null | "descargar" | "imprimir" | "compartir">(null)
    const [whatsappOpen, setWhatsappOpen] = useState(false)
    const [enviandoWhatsapp, setEnviandoWhatsapp] = useState(false)
    const visorRef = useRef<HTMLDivElement>(null)

    const nombreArchivo = `${(editable.documento || "comprobante").replace(/\s+/g, "_")}_${editable.serie || "0000"}-${editable.numero}.pdf`

    // Logo y razon social se cargan una sola vez
    useEffect(() => {
        cargarLogo().then(setLogo)
        cargarEmpresa().then(setEmpresa)
    }, [])

    // Cada vez que se abre, parte de los datos actuales del formulario
    useEffect(() => {
        if (!open) return
        setEditable(data)
        setEditando(false)
        requestAnimationFrame(() => ajustarAncho())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const ajustarAncho = () => {
        const w = visorRef.current?.clientWidth
        if (!w) return
        setZoom(Math.min(1, Math.max(ZOOM_MIN, (w - 32) / ANCHO_HOJA_PX)))
    }
    const cambiarZoom = (delta: number) =>
        setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 10) / 10)))

    const set = <K extends keyof ComprobantePreviewData>(campo: K, valor: ComprobantePreviewData[K]) =>
        setEditable((prev) => ({ ...prev, [campo]: valor }))
    const setDescripcion = (idx: number, valor: string) =>
        setEditable((prev) => ({ ...prev, lineas: prev.lineas.map((l, i) => (i === idx ? { ...l, descripcion: valor } : l)) }))

    const pdf = () => construirPdf(editable, empresa, logo)
    const resumen = `${editable.documento} ${editable.serie}-${editable.numero} · Total ${editable.simbolo} ${fmt(editable.totales.total)}`

    const descargar = () => {
        setOcupado("descargar")
        try { pdf().save(nombreArchivo) } finally { setOcupado(null) }
    }

    const imprimir = () => {
        setOcupado("imprimir")
        const url = URL.createObjectURL(pdf().output("blob"))
        const iframe = document.createElement("iframe")
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"
        iframe.src = url
        iframe.onload = () => {
            try {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
            } catch {
                window.open(url, "_blank")
            }
            setOcupado(null)
            setTimeout(() => { iframe.remove(); URL.revokeObjectURL(url) }, 60_000)
        }
        document.body.appendChild(iframe)
    }

    const compartir = async () => {
        setOcupado("compartir")
        try {
            const archivo = new File([pdf().output("blob")], nombreArchivo, { type: "application/pdf" })
            if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [archivo] })) {
                await navigator.share({ files: [archivo], title: nombreArchivo, text: `${editable.clienteNombre} · ${resumen}` })
            } else {
                pdf().save(nombreArchivo)
                toast({
                    title: "Compartir no disponible",
                    description: "Este navegador no permite compartir archivos (requiere HTTPS o móvil). Se descargó el PDF para que lo envíes manualmente.",
                })
            }
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                toast({ title: "No se pudo compartir", description: "Intenta descargar el PDF.", variant: "destructive" })
            }
        } finally {
            setOcupado(null)
        }
    }

    const enviarWhatsapp = async (telefono: string) => {
        // Comprobante ya emitido → mismo servicio que el modulo Comprobantes
        if (editable.idSunat) {
            setEnviandoWhatsapp(true)
            try {
                const res = await apiClient.post("/admin/sendWhatsappCompr", { id: editable.idSunat, phone: telefono })
                if (res.data?.success) {
                    toast({ title: "Enviado", description: "Mensaje de WhatsApp enviado" })
                    setWhatsappOpen(false)
                } else {
                    toast({ title: "Error", description: res.data?.message, variant: "destructive" })
                }
            } catch {
                toast({ title: "Error", description: "Error al enviar WhatsApp", variant: "destructive" })
            } finally {
                setEnviandoWhatsapp(false)
            }
            return
        }

        // Borrador (aun sin idSunat): WhatsApp con el mensaje + PDF descargado para adjuntar
        const digitos = telefono.replace(/\D/g, "")
        const numero = digitos.length === 9 ? `51${digitos}` : digitos
        const mensaje = `Hola ${editable.clienteNombre || ""}, le compartimos la vista previa de su ${resumen}. Le adjuntamos el PDF.\n\n${empresa.razonSocial}`
        pdf().save(nombreArchivo)
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank")
        setWhatsappOpen(false)
        toast({
            title: "WhatsApp abierto",
            description: "Se descargó el PDF: adjúntalo en el chat. El envío automático con el servicio de Comprobantes se activa cuando el comprobante esté emitido.",
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
                {/* Barra de herramientas */}
                <div className="flex flex-col gap-3 border-b border-border bg-background px-4 py-3 pr-12 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <DialogTitle className="truncate text-base">Vista previa del comprobante</DialogTitle>
                        <DialogDescription className="truncate text-xs">
                            {editando ? "Modo edición: haz clic en los textos resaltados para cambiarlos." : nombreArchivo}
                        </DialogDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => cambiarZoom(-ZOOM_PASO)} disabled={zoom <= ZOOM_MIN} aria-label="Alejar">
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <button type="button" onClick={() => setZoom(1)} className="w-12 text-center font-mono text-xs text-muted-foreground hover:text-foreground" title="Restablecer al 100%">
                                {Math.round(zoom * 100)}%
                            </button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => cambiarZoom(ZOOM_PASO)} disabled={zoom >= ZOOM_MAX} aria-label="Acercar">
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={ajustarAncho} aria-label="Ajustar al ancho" title="Ajustar al ancho">
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button type="button" size="sm" variant={editando ? "default" : "outline"} onClick={() => setEditando((v) => !v)} className={cn(editando && "bg-amber-500 hover:bg-amber-600")}>
                            {editando ? <Check className="mr-1.5 h-4 w-4" /> : <Pencil className="mr-1.5 h-4 w-4" />}
                            {editando ? "Listo" : "Editar"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={compartir} disabled={!!ocupado}>
                            {ocupado === "compartir" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Share2 className="mr-1.5 h-4 w-4" />}
                            Compartir
                        </Button>
                        <Button type="button" size="sm" onClick={() => setWhatsappOpen(true)} disabled={!!ocupado} className="bg-green-600 text-white hover:bg-green-700">
                            <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={descargar} disabled={!!ocupado}>
                            {ocupado === "descargar" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                            Descargar
                        </Button>
                        <Button type="button" size="sm" onClick={imprimir} disabled={!!ocupado} className="bg-blue-600 hover:bg-blue-700">
                            {ocupado === "imprimir" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Printer className="mr-1.5 h-4 w-4" />}
                            Imprimir
                        </Button>
                    </div>
                </div>

                {/* Visor */}
                <div ref={visorRef} className="flex-1 overflow-auto bg-slate-200 p-4 dark:bg-slate-900">
                    <div style={{ zoom }} className="mx-auto w-fit">
                        <HojaComprobante data={editable} empresa={empresa} logo={logo} editando={editando} set={set} setDescripcion={setDescripcion} />
                    </div>
                </div>

                {/* Mismo modal de WhatsApp que el modulo Comprobantes */}
                <WhatsAppModal
                    open={whatsappOpen}
                    onOpenChange={setWhatsappOpen}
                    defaultPhone={editable.clienteTelefono}
                    onSend={enviarWhatsapp}
                    loading={enviandoWhatsapp}
                />
            </DialogContent>
        </Dialog>
    )
}

// Hoja A4 en HTML: mismo contenido y distribucion que el PDF de construirPdf.
// Siempre en colores claros (es una hoja de papel), tambien en modo oscuro.
function HojaComprobante({
    data, empresa, logo, editando, set, setDescripcion,
}: {
    data: ComprobantePreviewData
    empresa: Empresa
    logo: Logo | null
    editando: boolean
    set: <K extends keyof ComprobantePreviewData>(campo: K, valor: ComprobantePreviewData[K]) => void
    setDescripcion: (idx: number, valor: string) => void
}) {
    const filasTotales = useMemo(() => [
        ["Op. gravada", data.totales.vva],
        ["Op. inafecta", data.totales.vvna],
        [`IGV (${(data.tasaIgv * 100).toFixed(0)}%)`, data.totales.igv],
    ] as const, [data.totales, data.tasaIgv])
    const generado = useMemo(ahoraLegible, [])

    return (
        <div className="relative flex min-h-[1123px] w-[794px] flex-col overflow-hidden bg-white px-[53px] pb-[40px] pt-[38px] text-[12px] text-slate-900 shadow-2xl">
            {/* Franja superior y marca de agua */}
            <div className="absolute inset-x-0 top-0 h-[15px] bg-blue-800" />
            <div className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
                <span className="-rotate-[35deg] whitespace-nowrap text-[96px] font-black tracking-widest text-slate-100">VISTA PREVIA</span>
            </div>

            <div className="relative flex flex-1 flex-col">
                {/* Emisor + recuadro del comprobante */}
                <div className="flex items-start justify-between gap-8">
                    <div className="min-w-0 max-w-[420px]">
                        {logo && <img src={logo.src} alt="DIFAR" className="mb-3 h-[80px] w-auto max-w-[235px] object-contain" />}
                        <p className="text-[14px] font-bold leading-snug text-slate-900">{empresa.razonSocial}</p>
                        <p className="mt-0.5 text-slate-500">RUC {empresa.ruc}</p>
                    </div>
                    <div className="w-[242px] shrink-0 overflow-hidden rounded-lg border-[2.5px] border-blue-800 text-center">
                        <p className="py-2 text-[12.5px] font-bold text-blue-800">R.U.C. N° {empresa.ruc}</p>
                        <p className="bg-blue-800 py-2 text-[13.5px] font-bold uppercase tracking-wide text-white">{data.documento || "Comprobante"}</p>
                        <p className="py-2.5 text-[16px] font-bold tracking-wide text-slate-900">{data.serie || "----"} - {data.numero}</p>
                    </div>
                </div>

                {/* Datos del cliente / comprobante */}
                <div className="mt-6 grid grid-cols-[58fr_42fr] gap-4">
                    <Bloque titulo="Datos del cliente">
                        <Dato label="Señor(es)">
                            <Editable value={data.clienteNombre} editando={editando} onChange={(v) => set("clienteNombre", v)} />
                        </Dato>
                        <Dato label="RUC / DNI">
                            <Editable value={data.clienteDocumento} editando={editando} onChange={(v) => set("clienteDocumento", v)} />
                        </Dato>
                        <Dato label="Dirección">
                            <Editable value={data.clienteDireccion} editando={editando} onChange={(v) => set("clienteDireccion", v)} />
                        </Dato>
                        <Dato label="Vendedor">{data.vendedor || "—"}</Dato>
                    </Bloque>
                    <Bloque titulo="Datos del comprobante">
                        <Dato label="Emisión">{fechaLegible(data.fecha)}</Dato>
                        <Dato label="Condición">{data.diasCredito ? `${data.condicion} (${data.diasCredito} d)` : data.condicion || "—"}</Dato>
                        <Dato label="Moneda">{data.moneda || "—"}</Dato>
                        <Dato label="Almacén">{data.almacen || "—"}</Dato>
                    </Bloque>
                </div>

                {data.referencia && (
                    <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-[11px] font-bold text-amber-700">
                        Documento que modifica: {data.referencia}
                    </div>
                )}

                {/* Detalle */}
                <table className="mt-5 w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-[11px] text-white">
                            <th className="w-8 rounded-l-md px-2 py-2.5 text-center font-semibold">#</th>
                            <th className="w-[84px] px-2 py-2.5 text-left font-semibold">Código</th>
                            <th className="px-2 py-2.5 text-left font-semibold">Descripción</th>
                            <th className="w-14 px-2 py-2.5 text-right font-semibold">Cant.</th>
                            <th className="w-24 px-2 py-2.5 text-right font-semibold">P. Unit.</th>
                            <th className="w-24 rounded-r-md px-2 py-2.5 text-right font-semibold">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.lineas.length === 0 ? (
                            <tr><td colSpan={6} className="px-2 py-8 text-center text-slate-400">Sin items agregados</td></tr>
                        ) : data.lineas.map((l, i) => (
                            <tr key={i} className="border-b border-slate-200 align-top even:bg-slate-50/80">
                                <td className="px-2 py-2.5 text-center text-slate-400">{i + 1}</td>
                                <td className="px-2 py-2.5 font-mono text-[11px] text-slate-600">{l.codigo}</td>
                                <td className="px-2 py-2.5">
                                    <Editable value={l.descripcion} editando={editando} onChange={(v) => setDescripcion(i, v)} />
                                    {!l.afecto && <span className="ml-1.5 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-600">Inafecto</span>}
                                </td>
                                <td className="px-2 py-2.5 text-right">{l.cantidad.toLocaleString("es-PE")}</td>
                                <td className="px-2 py-2.5 text-right tabular-nums">{fmt(l.precio)}</td>
                                <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{fmt(l.cantidad * l.precio)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Importe en letras + observaciones | totales */}
                <div className="mt-6 flex items-start justify-between gap-6">
                    <div className="min-w-0 flex-1 space-y-4">
                        <div className="rounded-lg bg-blue-50 px-4 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Son:</p>
                            <p className="mt-0.5 text-[11.5px] font-semibold text-slate-900">{importeEnLetras(data.totales.total, data.monedaCodigo)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Observaciones</p>
                            <div className="mt-1">
                                <Editable value={data.observaciones} editando={editando} onChange={(v) => set("observaciones", v)} multilinea />
                            </div>
                        </div>
                    </div>
                    <div className="w-[280px] shrink-0 overflow-hidden rounded-lg border border-slate-200">
                        <div className="px-4 py-2">
                            {filasTotales.map(([label, valor]) => (
                                <div key={label} className="flex justify-between py-1.5">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="tabular-nums">{data.simbolo} {fmt(valor)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between bg-blue-800 px-4 py-3 text-white">
                            <span className="text-[12px] font-bold tracking-wide">IMPORTE TOTAL</span>
                            <span className="text-[16px] font-bold tabular-nums">{data.simbolo} {fmt(data.totales.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Pie */}
                <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-[9.5px] text-slate-500">
                    <span>Vista previa generada desde Tomar Pedido Hoja en Blanco — no válida como comprobante electrónico.</span>
                    <span className="shrink-0">Generado el {generado} · Página 1 de 1</span>
                </div>
            </div>
        </div>
    )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50/90 py-3 pl-5 pr-4">
            <span className="absolute bottom-2 left-0 top-2 w-[4px] rounded-r bg-blue-800" />
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-800">{titulo}</p>
            <div className="space-y-1.5">{children}</div>
        </div>
    )
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex min-w-0 gap-2">
            <span className="w-[72px] shrink-0 text-slate-500">{label}</span>
            <div className="min-w-0 flex-1 font-semibold text-slate-900">{children}</div>
        </div>
    )
}

function Editable({ value, editando, onChange, multilinea }: { value: string; editando: boolean; onChange: (v: string) => void; multilinea?: boolean }) {
    if (!editando) return <span className="whitespace-pre-wrap break-words">{value || "—"}</span>
    const clases = "w-full rounded border border-amber-300 bg-amber-50 px-1 py-0.5 font-normal text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400"
    return multilinea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cn(clases, "resize-none")} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={clases} />
}
