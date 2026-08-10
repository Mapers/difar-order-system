import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";

export interface VentasTotalesPdfProducto {
    Codigo_Art:   string;
    Producto:     string;
    AbrevUnidMed: string;
    Cantidad:     number;
    Ventas:       number;
    Costo:        number;
    Utilidad:     number;
}

export interface VentasTotalesPdfLab {
    Laboratorio:   string;
    TotalCantidad: number;
    TotalVentas:   number;
    TotalCosto:    number;
    TotalUtilidad: number;
    productos:     VentasTotalesPdfProducto[];
}

export interface VentasTotalesPdfData {
    Anio:    string;
    Mes:     string;
    Empresa: { NombreRazSocial: string; RUC: string };
    TotalCantidad: number;
    TotalVentas:   number;
    TotalCosto:    number;
    TotalUtilidad: number;
    Laboratorios:  VentasTotalesPdfLab[];
}

interface ExportVentasTotalesPdfProps {
    data: VentasTotalesPdfData | null;
    /** resumen = una fila por laboratorio. detallado = productos dentro de cada laboratorio. */
    modo: 'resumen' | 'detallado';
    /** Texto de los filtros aplicados; se imprime en la cabecera. */
    filtroLaboratorios?: string;
    filtroVendedores?:   string;
    disabled?: boolean;
}

const formatMoney = (amount: number) =>
    Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatCant = (amount: number) =>
    Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * Helvetica de pdf-lib codifica en WinAnsi y revienta con cualquier carácter
 * fuera de ese juego. Los nombres de artículo vienen del maestro y traen de
 * todo, así que se limpian antes de dibujar: un carácter raro no puede tumbar
 * la exportación completa.
 */
const sanitizar = (texto: string): string =>
    String(texto ?? '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

export const ExportVentasTotalesPdf: React.FC<ExportVentasTotalesPdfProps> = ({
    data,
    modo,
    filtroLaboratorios,
    filtroVendedores,
    disabled = false,
}) => {
    const [loading, setLoading] = useState(false);

    const generatePdf = async () => {
        if (!data || data.Laboratorios.length === 0) {
            toast({ title: "Sin datos", description: "No hay datos para exportar", variant: "warning" });
            return;
        }

        setLoading(true);

        try {
            const pdfDoc   = await PDFDocument.create();
            const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth    = 595.28;   // A4 vertical, igual que el resto de reportes
            const pageHeight   = 841.89;
            const margin       = 40;
            const contentWidth = pageWidth - (margin * 2);

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition   = pageHeight - margin;

            let logoImage: any = null;
            try {
                const logoBytes = await fetch('/difar-logo.png').then((res) => {
                    if (!res.ok) throw new Error("No se pudo cargar la imagen");
                    return res.arrayBuffer();
                });
                logoImage = await pdfDoc.embedPng(logoBytes);
            } catch (error) {
                console.warn("No se pudo cargar el logotipo para el PDF:", error);
            }

            /** Corta el texto al ancho disponible. Sin esto se monta sobre la columna siguiente. */
            const truncar = (texto: string, ancho: number, size: number, f = font): string => {
                const limpio = sanitizar(texto);
                if (f.widthOfTextAtSize(limpio, size) <= ancho) return limpio;
                let corte = limpio;
                while (corte.length > 1 && f.widthOfTextAtSize(corte + '…', size) > ancho) {
                    corte = corte.slice(0, -1);
                }
                return corte + '…';
            };

            const drawHeader = (page: any) => {
                let titleXPos = margin;
                if (logoImage) {
                    page.drawImage(logoImage, {
                        x: margin, y: pageHeight - margin - 15, width: 50, height: 30,
                    });
                    titleXPos = margin + 60;
                }

                page.drawText(sanitizar(data.Empresa?.NombreRazSocial || 'DROGUERIA DIFAR'), {
                    x: titleXPos, y: pageHeight - margin, size: 12, font: boldFont, color: rgb(0, 0, 0),
                });

                page.drawText(`RUC: ${data.Empresa?.RUC || '-'}`, {
                    x: titleXPos, y: pageHeight - margin - 13, size: 9, font, color: rgb(0.3, 0.3, 0.3),
                });

                const subtitulo = modo === 'resumen'
                    ? 'Ventas Totales - Resumen por Laboratorio'
                    : 'Ventas Totales - Detalle por Producto';
                page.drawText(subtitulo, {
                    x: titleXPos, y: pageHeight - margin - 25, size: 10, font, color: rgb(0.3, 0.3, 0.3),
                });

                const periodoText = `Periodo: ${data.Mes}/${data.Anio}`;
                page.drawText(periodoText, {
                    x: pageWidth - margin - boldFont.widthOfTextAtSize(periodoText, 9),
                    y: pageHeight - margin, size: 9, font: boldFont,
                });

                const dateText = `Generado: ${new Date().toLocaleDateString()}`;
                page.drawText(dateText, {
                    x: pageWidth - margin - font.widthOfTextAtSize(dateText, 8),
                    y: pageHeight - margin - 13, size: 8, font, color: rgb(0.3, 0.3, 0.3),
                });

                // Los filtros van en la cabecera a propósito: sin ellos, dos PDFs
                // del mismo periodo con cifras distintas son inexplicables.
                const filtros = `Laboratorios: ${filtroLaboratorios || 'Todos'}   |   Vendedores: ${filtroVendedores || 'Todos'}`;
                page.drawText(truncar(filtros, contentWidth, 8), {
                    x: margin, y: pageHeight - margin - 40, size: 8, font, color: rgb(0.45, 0.45, 0.45),
                });

                yPosition = pageHeight - margin - 50;
                page.drawLine({
                    start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1,
                });
                yPosition -= 20;
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

            const verde = rgb(0.1, 0.5, 0.1);
            const rojo  = rgb(0.75, 0.1, 0.1);
            const colorUtilidad = (v: number) => (v < 0 ? rojo : verde);

            /** Dibuja una fila de columnas con alineación por índice. */
            const dibujarFila = (
                textos: string[], anchos: number[], derecha: Set<number>,
                size: number, f: any, colores?: (i: number) => any
            ) => {
                let xPos = margin + 5;
                textos.forEach((texto, i) => {
                    const t = truncar(texto, anchos[i] - 8, size, f);
                    const textX = derecha.has(i)
                        ? xPos + anchos[i] - f.widthOfTextAtSize(t, size) - 8
                        : xPos;
                    currentPage.drawText(t, {
                        x: textX, y: yPosition, size, font: f,
                        color: colores ? colores(i) : rgb(0, 0, 0),
                    });
                    xPos += anchos[i];
                });
            };

            const dibujarEncabezadoTabla = (headers: string[], anchos: number[], derecha: Set<number>) => {
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 2, width: contentWidth, height: 12, color: rgb(0.95, 0.95, 0.95),
                });
                dibujarFila(headers, anchos, derecha, 8, boldFont);
                yPosition -= 15;
            };

            drawHeader(currentPage);

            // ─────────────────────────────────────────────────────────────
            if (modo === 'resumen') {
                const anchos   = [195, 70, 85, 80, 85];
                const headers  = ["Laboratorio", "Cantidad", "Ventas (S/.)", "Costo (S/.)", "Utilidad (S/.)"];
                const derecha  = new Set([1, 2, 3, 4]);

                dibujarEncabezadoTabla(headers, anchos, derecha);

                for (const lab of data.Laboratorios) {
                    if (checkPageBreak(15)) dibujarEncabezadoTabla(headers, anchos, derecha);

                    dibujarFila(
                        [
                            lab.Laboratorio,
                            formatCant(lab.TotalCantidad),
                            formatMoney(lab.TotalVentas),
                            formatMoney(lab.TotalCosto),
                            formatMoney(lab.TotalUtilidad),
                        ],
                        anchos, derecha, 8, font,
                        (i) => (i === 4 ? colorUtilidad(lab.TotalUtilidad) : rgb(0, 0, 0))
                    );

                    currentPage.drawLine({
                        start: { x: margin, y: yPosition - 5 }, end: { x: pageWidth - margin, y: yPosition - 5 },
                        thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
                    });
                    yPosition -= 15;
                }

                yPosition -= 10;
            } else {
                const anchos  = [60, 165, 30, 60, 70, 65, 65];
                const headers = ["Código", "Producto", "Und.", "Cantidad", "Ventas", "Costo", "Utilidad"];
                const derecha = new Set([3, 4, 5, 6]);

                for (const lab of data.Laboratorios) {
                    checkPageBreak(60);

                    // Banda del laboratorio
                    currentPage.drawRectangle({
                        x: margin, y: yPosition - 10, width: contentWidth, height: 20, color: rgb(0.3, 0.3, 0.8),
                    });
                    currentPage.drawText(truncar(lab.Laboratorio, contentWidth - 130, 10, boldFont), {
                        x: margin + 5, y: yPosition - 5, size: 10, font: boldFont, color: rgb(1, 1, 1),
                    });
                    const prodTxt = `${lab.productos.length} producto${lab.productos.length === 1 ? '' : 's'}`;
                    currentPage.drawText(prodTxt, {
                        x: pageWidth - margin - boldFont.widthOfTextAtSize(prodTxt, 9) - 5,
                        y: yPosition - 5, size: 9, font: boldFont, color: rgb(1, 1, 1),
                    });

                    yPosition -= 30;
                    dibujarEncabezadoTabla(headers, anchos, derecha);

                    for (const p of lab.productos) {
                        if (checkPageBreak(15)) dibujarEncabezadoTabla(headers, anchos, derecha);

                        // El SP devuelve Producto como "<código> <nombre>": se le
                        // quita el código del inicio porque ya va en su columna.
                        const nombre = sanitizar(p.Producto).startsWith(p.Codigo_Art)
                            ? sanitizar(p.Producto).substring(p.Codigo_Art.length).trim()
                            : sanitizar(p.Producto);

                        dibujarFila(
                            [
                                p.Codigo_Art,
                                nombre,
                                p.AbrevUnidMed || '-',
                                formatCant(p.Cantidad),
                                formatMoney(p.Ventas),
                                formatMoney(p.Costo),
                                formatMoney(p.Utilidad),
                            ],
                            anchos, derecha, 8, font,
                            (i) => (i === 6 ? colorUtilidad(p.Utilidad) : rgb(0, 0, 0))
                        );

                        currentPage.drawLine({
                            start: { x: margin, y: yPosition - 5 }, end: { x: pageWidth - margin, y: yPosition - 5 },
                            thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
                        });
                        yPosition -= 15;
                    }

                    // Subtotal del laboratorio, cada valor bajo su columna
                    checkPageBreak(20);
                    currentPage.drawText("TOTAL LABORATORIO:", {
                        x: margin + 5, y: yPosition, size: 9, font: boldFont, color: verde,
                    });

                    const subtotales: [string, number, any][] = [
                        [formatCant(lab.TotalCantidad),  3, verde],
                        [formatMoney(lab.TotalVentas),   4, verde],
                        [formatMoney(lab.TotalCosto),    5, verde],
                        [formatMoney(lab.TotalUtilidad), 6, colorUtilidad(lab.TotalUtilidad)],
                    ];
                    for (const [texto, idx, color] of subtotales) {
                        const bordeDerecho = margin + 5 + anchos.slice(0, idx + 1).reduce((a, c) => a + c, 0);
                        currentPage.drawText(texto, {
                            x: bordeDerecho - boldFont.widthOfTextAtSize(texto, 9) - 8,
                            y: yPosition, size: 9, font: boldFont, color,
                        });
                    }

                    yPosition -= 35;
                }
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
            currentPage.drawText(`${data.Laboratorios.length} laboratorio${data.Laboratorios.length === 1 ? '' : 's'}`, {
                x: margin + 10, y: yPosition - 25, size: 8, font, color: rgb(0.85, 0.9, 1),
            });

            const resumenFinal =
                `Cantidad: ${formatCant(data.TotalCantidad)}     ` +
                `Ventas: S/ ${formatMoney(data.TotalVentas)}     ` +
                `Costo: S/ ${formatMoney(data.TotalCosto)}     ` +
                `Utilidad: S/ ${formatMoney(data.TotalUtilidad)}`;
            currentPage.drawText(resumenFinal, {
                x: pageWidth - margin - boldFont.widthOfTextAtSize(resumenFinal, 9) - 10,
                y: yPosition - 18, size: 9, font: boldFont, color: rgb(1, 1, 1),
            });

            // ── Pie: numeración ──────────────────────────────────────────
            // No la tiene el resto de reportes salvo el de comprobantes, pero
            // este se puede ir a decenas de páginas y sin numerar es inmanejable.
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
            link.download = `Ventas-Totales-${modo}-${data.Anio}${data.Mes}-${new Date().toISOString().split('T')[0]}.pdf`;
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
            size="sm"
            className="bg-background shadow-sm flex-1 md:flex-none"
            onClick={generatePdf}
            disabled={loading || disabled}
        >
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : modo === 'resumen' ? "PDF Resumen" : "PDF Detallado"}
        </Button>
    );
};
