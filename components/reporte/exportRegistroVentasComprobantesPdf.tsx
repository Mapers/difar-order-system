import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";
import {
    RegistroVentaAgrupado,
    fmtCantidad,
    fmtFechaCorta,
    fmtMonto,
    fmtPrecio,
} from "@/components/reporte/registroVentasShared";
import {
    cargarLogoPdf,
    dibujarCabeceraPdf,
    sanitizarPdf as sanitizar,
    truncarPdf,
} from "@/components/reporte/pdfCabecera";

interface Props {
    data: RegistroVentaAgrupado | null;
    desde: Date;
    hasta: Date;
    filtroVendedor?: string;
    disabled?: boolean;
}

const fmtFechaLarga = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export const ExportRegistroVentasComprobantesPdf: React.FC<Props> = ({
    data, desde, hasta, filtroVendedor, disabled = false,
}) => {
    const [loading, setLoading] = useState(false);

    const generatePdf = async () => {
        if (!data || data.comprobantes.length === 0) {
            toast({ title: "Sin datos", description: "No hay datos para exportar", variant: "warning" });
            return;
        }

        setLoading(true);

        try {
            const pdfDoc   = await PDFDocument.create();
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth    = 595.28;
            const pageHeight   = 841.89;
            const margin       = 40;
            const contentWidth = pageWidth - (margin * 2);

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition   = pageHeight - margin;

            const logoImage = await cargarLogoPdf(pdfDoc);

            // Anchos de las ocho columnas. Suman 514 de los 515.28 disponibles.
            // El grueso se lo lleva PRODUCTO, que es lo que se lee; NO AFECTO no
            // baja de 52 porque su encabezado mide 46.8 pt y no entra en menos.
            const anchos = {
                fecha:     40,
                documento: 62,
                cantidad:  30,
                producto: 170,
                pu:        36,
                noAfecto:  52,
                afecto:    46,
                igv:       36,
                total:     42,
            };

            let acumulado = margin;
            const x: Record<string, number> = {};
            for (const [clave, ancho] of Object.entries(anchos)) {
                x[clave] = acumulado;
                acumulado += ancho;
            }

            const truncar = (texto: string, ancho: number, size: number, f = font): string =>
                truncarPdf(texto, ancho, size, f);

            /** Texto pegado al borde derecho de su columna: así cuadran los decimales. */
            const derecha = (texto: string, clave: string, y: number, size: number,
                             f = font, color = rgb(0, 0, 0)) => {
                const ancho = (anchos as any)[clave];
                const t = truncar(texto, ancho - 4, size, f);
                currentPage.drawText(t, {
                    x: x[clave] + ancho - f.widthOfTextAtSize(t, size) - 3,
                    y, size, font: f, color,
                });
            };

            const dibujarEncabezadoTabla = () => {
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 2, width: contentWidth, height: 12, color: rgb(0.95, 0.95, 0.95),
                });
                currentPage.drawText('COMPROBANTE', { x: x.fecha, y: yPosition, size: 8, font: boldFont });
                currentPage.drawText('CANTIDAD',     { x: x.cantidad, y: yPosition, size: 8, font: boldFont });
                const tp = 'PRODUCTO';
                currentPage.drawText(tp, {
                    x: x.producto + (anchos.producto - boldFont.widthOfTextAtSize(tp, 8)) / 2,
                    y: yPosition, size: 8, font: boldFont,
                });
                derecha('PU',        'pu',       yPosition, 8, boldFont);
                derecha('NO AFECTO', 'noAfecto', yPosition, 8, boldFont);
                derecha('AFECTO',    'afecto',   yPosition, 8, boldFont);
                derecha('IGV',       'igv',      yPosition, 8, boldFont);
                derecha('Total',     'total',    yPosition, 8, boldFont);
                yPosition -= 15;
            };

            const drawHeader = (page: any) => {
                yPosition = dibujarCabeceraPdf({
                    page, font, boldFont, logo: logoImage,
                    pageWidth, pageHeight, margin,
                    subtitulo: 'Registro de Ventas / Comprobantes de Pago',
                    infoDerecha: `Periodo: ${fmtFechaLarga(desde)} - ${fmtFechaLarga(hasta)}`,
                    filtros: `Vendedor: ${filtroVendedor || 'Todos'}   |   Expresado en Nuevos Soles (S/.)`,
                });

                // Los encabezados de columna se repiten una vez por página, no
                // por comprobante: son cientos y repetirlos ahogaría el reporte.
                dibujarEncabezadoTabla();
            };

            const nuevaPagina = () => {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader(currentPage);
            };

            const checkPageBreak = (needed: number): boolean => {
                if (yPosition - needed < margin + 25) {   // +25 deja sitio al pie de página
                    nuevaPagina();
                    return true;
                }
                return false;
            };

            const azul  = rgb(0.3, 0.3, 0.8);
            const verde = rgb(0.1, 0.5, 0.1);
            const rojo  = rgb(0.75, 0.1, 0.1);

            drawHeader(currentPage);

            for (const comprobante of data.comprobantes) {
                // La banda del comprobante nunca debe quedar sola al pie: se pide
                // sitio para ella más su primera línea.
                checkPageBreak(60);

                // ── Banda del comprobante ────────────────────────────────
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 16, width: contentWidth, height: 26, color: azul,
                });

                currentPage.drawText(fmtFechaCorta(comprobante.fecha_emision), {
                    x: margin + 5, y: yPosition - 2, size: 9, font: boldFont, color: rgb(1, 1, 1),
                });
                currentPage.drawText(`${comprobante.tipo_cpe} : ${comprobante.documento}`, {
                    x: margin + 60, y: yPosition - 2, size: 9, font: boldFont, color: rgb(1, 1, 1),
                });
                const cliente = `${comprobante.cliente_numdoc} ${comprobante.cliente_denominacion}`;
                currentPage.drawText(truncar(cliente, contentWidth - 190, 9, boldFont), {
                    x: margin + 145, y: yPosition - 2, size: 9, font: boldFont, color: rgb(1, 1, 1),
                });

                if (comprobante.anulado) {
                    const txt = 'ANULADO';
                    currentPage.drawText(txt, {
                        x: pageWidth - margin - boldFont.widthOfTextAtSize(txt, 9) - 5,
                        y: yPosition - 2, size: 9, font: boldFont, color: rgb(1, 0.85, 0.85),
                    });
                }

                // Vendedor y días crédito: lo que este reporte agrega sobre el
                // de comprobantes.
                const credito = comprobante.dias_credito > 0
                    ? `Créd: ${comprobante.dias_credito} d`
                    : 'Contado';
                currentPage.drawText(
                    truncar(`Vend: ${comprobante.codigo_vendedor || '-'}${comprobante.vendedor ? ` · ${comprobante.vendedor}` : ''}   ${credito}`, 300, 7.5),
                    { x: margin + 5, y: yPosition - 13, size: 7.5, font, color: rgb(0.85, 0.9, 1) }
                );

                // El resumen del CPE. No todos los comprobantes lo tienen.
                if (comprobante.codigo_hash) {
                    const h = truncar(comprobante.codigo_hash, 190, 7);
                    currentPage.drawText(h, {
                        x: pageWidth - margin - font.widthOfTextAtSize(h, 7) - 5,
                        y: yPosition - 13, size: 7, font, color: rgb(0.85, 0.9, 1),
                    });
                }

                yPosition -= 30;

                // ── Líneas de producto ───────────────────────────────────
                for (const linea of comprobante.lineas) {
                    if (checkPageBreak(15)) { /* la cabecera de tabla ya se redibujó */ }

                    derecha(fmtCantidad(linea.cantidad), 'cantidad', yPosition, 8);
                    currentPage.drawText(truncar(`${linea.unidad} ${linea.producto}`.trim(), anchos.producto - 4, 8), {
                        x: x.producto + 2, y: yPosition, size: 8, font,
                    });
                    derecha(fmtPrecio(linea.precio_unitario), 'pu',       yPosition, 8);
                    derecha(fmtMonto(linea.no_afecto),        'noAfecto', yPosition, 8);
                    derecha(fmtMonto(linea.afecto),           'afecto',   yPosition, 8);
                    derecha(fmtMonto(linea.igv),              'igv',      yPosition, 8);
                    derecha(fmtMonto(linea.total),            'total',    yPosition, 8);

                    currentPage.drawLine({
                        start: { x: margin, y: yPosition - 5 }, end: { x: pageWidth - margin, y: yPosition - 5 },
                        thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
                    });
                    yPosition -= 15;
                }

                // ── Subtotal del comprobante ─────────────────────────────
                checkPageBreak(20);
                currentPage.drawText("TOTAL COMPROBANTE:", {
                    x: margin + 5, y: yPosition, size: 9, font: boldFont,
                    color: comprobante.anulado ? rojo : verde,
                });
                const color = comprobante.anulado ? rojo : verde;
                derecha(fmtMonto(comprobante.no_afecto), 'noAfecto', yPosition, 9, boldFont, color);
                derecha(fmtMonto(comprobante.afecto),    'afecto',   yPosition, 9, boldFont, color);
                derecha(fmtMonto(comprobante.igv),       'igv',      yPosition, 9, boldFont, color);
                derecha(fmtMonto(comprobante.total),     'total',    yPosition, 9, boldFont, color);

                yPosition -= 30;
            }

            // ── Total general ────────────────────────────────────────────
            checkPageBreak(45);
            yPosition -= 5;

            currentPage.drawRectangle({
                x: margin, y: yPosition - 32, width: contentWidth, height: 38, color: rgb(0.1, 0.4, 0.8),
            });
            currentPage.drawText("TOTAL GENERAL", {
                x: margin + 10, y: yPosition - 12, size: 10, font: boldFont, color: rgb(1, 1, 1),
            });
            const cantidadTxt = `${data.comprobantes.length} comprobante${data.comprobantes.length === 1 ? '' : 's'}`;
            currentPage.drawText(cantidadTxt, {
                x: margin + 10, y: yPosition - 25, size: 8, font, color: rgb(0.85, 0.9, 1),
            });

            const resumenFinal =
                `No afecto: S/ ${fmtMonto(data.totales.no_afecto)}     ` +
                `Afecto: S/ ${fmtMonto(data.totales.afecto)}     ` +
                `IGV: S/ ${fmtMonto(data.totales.igv)}     ` +
                `Total: S/ ${fmtMonto(data.totales.total)}`;
            currentPage.drawText(resumenFinal, {
                x: pageWidth - margin - boldFont.widthOfTextAtSize(resumenFinal, 9) - 10,
                y: yPosition - 18, size: 9, font: boldFont, color: rgb(1, 1, 1),
            });

            // ── Pie: numeración ──────────────────────────────────────────
            // Este reporte se puede ir a decenas de páginas y sin numerar es
            // inmanejable.
            const paginas = pdfDoc.getPages();
            paginas.forEach((pg, idx) => {
                const txt = `Página ${idx + 1} de ${paginas.length}`;
                pg.drawText(txt, {
                    x: pageWidth - margin - font.widthOfTextAtSize(txt, 7),
                    y: margin - 12, size: 7, font, color: rgb(0.5, 0.5, 0.5),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob     = new Blob([pdfBytes], { type: 'application/pdf' });
            const link     = document.createElement('a');
            link.href     = window.URL.createObjectURL(blob);
            link.download = `Registro-Ventas-Comprobantes-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            window.URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="bg-background shadow-sm w-full sm:w-auto h-12"
            onClick={generatePdf}
            disabled={loading || disabled}
        >
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};
