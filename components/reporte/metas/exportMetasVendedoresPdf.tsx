import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";
import { IVendedorDashboard, ICiclo } from "@/app/types/metas-types";
import {
    agruparVendedores, capPct, esSinMeta, getStatusColor,
    ID_LAB_SIN_META, MONTH_NAMES,
} from "@/app/utils/metas-helpers";

interface ExportMetasVendedoresPdfProps {
    vendedores: IVendedorDashboard[];
    ciclo: ICiclo | null;
    /** Estado del switch de la pantalla. Va impreso: cambia las cifras por completo. */
    soloFacturado: boolean;
    /** resumen = una fila por vendedor. detallado = los laboratorios de cada uno. */
    modo: 'resumen' | 'detallado';
    disabled?: boolean;
}

const formatMoney = (amount: number) =>
    Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Helvetica de pdf-lib codifica en WinAnsi y revienta fuera de ese juego. */
const sanitizar = (texto: string): string =>
    String(texto ?? '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

const hexARgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export const ExportMetasVendedoresPdf: React.FC<ExportMetasVendedoresPdfProps> = ({
    vendedores, ciclo, soloFacturado, modo, disabled = false,
}) => {
    const [loading, setLoading] = useState(false);

    const generatePdf = async () => {
        const agrupados = agruparVendedores(vendedores || []);
        if (agrupados.length === 0) {
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

            const truncar = (texto: string, ancho: number, size: number, f = font): string => {
                const limpio = sanitizar(texto);
                if (f.widthOfTextAtSize(limpio, size) <= ancho) return limpio;
                let corte = limpio;
                while (corte.length > 1 && f.widthOfTextAtSize(corte + '…', size) > ancho) {
                    corte = corte.slice(0, -1);
                }
                return corte + '…';
            };

            const cicloTxt = ciclo
                ? `${MONTH_NAMES[ciclo.mes]} ${ciclo.anio} (${ciclo.estado})`
                : 'Sin ciclo';

            const drawHeader = (page: any) => {
                let titleXPos = margin;
                if (logoImage) {
                    page.drawImage(logoImage, { x: margin, y: pageHeight - margin - 15, width: 50, height: 30 });
                    titleXPos = margin + 60;
                }

                page.drawText("DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.", {
                    x: titleXPos, y: pageHeight - margin, size: 10, font: boldFont,
                });
                page.drawText("20481321892", {
                    x: titleXPos, y: pageHeight - margin - 12, size: 9, font, color: rgb(0.3, 0.3, 0.3),
                });
                page.drawText(
                    modo === 'resumen'
                        ? "Metas Comerciales - Avance por Vendedor"
                        : "Metas Comerciales - Avance por Vendedor y Laboratorio",
                    { x: titleXPos, y: pageHeight - margin - 24, size: 10, font, color: rgb(0.3, 0.3, 0.3) }
                );

                const cicloLabel = `Ciclo: ${cicloTxt}`;
                page.drawText(cicloLabel, {
                    x: pageWidth - margin - boldFont.widthOfTextAtSize(cicloLabel, 9),
                    y: pageHeight - margin, size: 9, font: boldFont,
                });
                const dateText = `Generado: ${new Date().toLocaleDateString()}`;
                page.drawText(dateText, {
                    x: pageWidth - margin - font.widthOfTextAtSize(dateText, 8),
                    y: pageHeight - margin - 12, size: 8, font, color: rgb(0.3, 0.3, 0.3),
                });

                // El switch de la pantalla cambia la venta por completo: sin
                // declararlo, dos PDFs del mismo ciclo con cifras distintas son
                // imposibles de explicar.
                const modoVenta = soloFacturado
                    ? 'Venta considerada: SOLO FACTURADA'
                    : 'Venta considerada: TODA la del periodo (incluye despachos sin comprobante)';
                page.drawText(truncar(modoVenta, contentWidth, 8), {
                    x: margin, y: pageHeight - margin - 40, size: 8, font, color: rgb(0.45, 0.45, 0.45),
                });

                yPosition = pageHeight - margin - 50;
                page.drawLine({
                    start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1,
                });
                yPosition -= 20;
            };

            const checkPageBreak = (needed: number): boolean => {
                if (yPosition - needed < margin + 25) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader(currentPage);
                    return true;
                }
                return false;
            };

            const verde = rgb(0.1, 0.5, 0.1);

            /** "—" cuando no hay meta contra la cual medir: no es 0%. */
            const textoPct = (pct: number | null | undefined): string =>
                esSinMeta(pct as any) ? "—" : `${capPct(Number(pct))}%`;

            const colorPct = (pct: number | null | undefined) =>
                esSinMeta(pct as any) ? rgb(0.45, 0.45, 0.45) : hexARgb(getStatusColor(Number(pct))[0]);

            const dibujarFila = (
                textos: string[], anchos: number[], derecha: Set<number>,
                size: number, f: any, colores?: (i: number) => any
            ) => {
                let xPos = margin + 5;
                textos.forEach((texto, i) => {
                    const t = truncar(texto, anchos[i] - 8, size, f);
                    const textX = derecha.has(i) ? xPos + anchos[i] - f.widthOfTextAtSize(t, size) - 8 : xPos;
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

            // Los totales se calculan sobre las MISMAS filas que se imprimen, no
            // sobre el KPI de la pantalla: así el papel siempre cuadra consigo mismo.
            const totalMeta  = agrupados.reduce((s, v) => s + Number(v.meta_monto || 0), 0);
            const totalVenta = agrupados.reduce((s, v) => s + Number(v.venta_real || 0), 0);
            const pctGlobal  = totalMeta > 0 ? Math.round((totalVenta / totalMeta) * 100) : null;

            if (modo === 'resumen') {
                const anchos  = [40, 150, 80, 80, 50, 65, 50];
                const headers = ["Cód.", "Vendedor", "Meta (S/.)", "Venta (S/.)", "% Avan.", "Pendiente", "Clientes"];
                const derecha = new Set([2, 3, 4, 5, 6]);

                dibujarEncabezadoTabla(headers, anchos, derecha);

                for (const v of agrupados) {
                    if (checkPageBreak(15)) dibujarEncabezadoTabla(headers, anchos, derecha);

                    dibujarFila(
                        [
                            v.cod_vendedor,
                            v.nombre_vendedor || v.cod_vendedor,
                            formatMoney(Number(v.meta_monto)),
                            formatMoney(Number(v.venta_real)),
                            textoPct(v.pct_avance_monto),
                            formatMoney(Number(v.monto_pendiente)),
                            `${Number(v.clientes_atendidos || 0)}/${Number(v.meta_clientes || 0)}`,
                        ],
                        anchos, derecha, 8, font,
                        (i) => (i === 4 ? colorPct(v.pct_avance_monto) : rgb(0, 0, 0))
                    );

                    currentPage.drawLine({
                        start: { x: margin, y: yPosition - 5 }, end: { x: pageWidth - margin, y: yPosition - 5 },
                        thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
                    });
                    yPosition -= 15;
                }

                yPosition -= 10;
            } else {
                const anchos  = [175, 85, 85, 55, 65, 50];
                const headers = ["Laboratorio", "Meta (S/.)", "Venta (S/.)", "% Avan.", "Pendiente", "Clientes"];
                const derecha = new Set([1, 2, 3, 4, 5]);

                for (const v of agrupados) {
                    checkPageBreak(70);

                    // Banda del vendedor
                    currentPage.drawRectangle({
                        x: margin, y: yPosition - 10, width: contentWidth, height: 20, color: rgb(0.3, 0.3, 0.8),
                    });
                    currentPage.drawText(
                        truncar(`${v.cod_vendedor} · ${v.nombre_vendedor || ''}`, contentWidth - 190, 10, boldFont),
                        { x: margin + 5, y: yPosition - 5, size: 10, font: boldFont, color: rgb(1, 1, 1) }
                    );
                    const cab = `Meta: ${formatMoney(Number(v.meta_monto))}   Venta: ${formatMoney(Number(v.venta_real))}   ${textoPct(v.pct_avance_monto)}`;
                    currentPage.drawText(cab, {
                        x: pageWidth - margin - boldFont.widthOfTextAtSize(cab, 9) - 5,
                        y: yPosition - 5, size: 9, font: boldFont, color: rgb(1, 1, 1),
                    });

                    yPosition -= 30;
                    dibujarEncabezadoTabla(headers, anchos, derecha);

                    const labs = (v.labs || []);
                    for (const lab of labs) {
                        if (checkPageBreak(15)) dibujarEncabezadoTabla(headers, anchos, derecha);

                        const sinMetaLab = lab.id_linea_ge === ID_LAB_SIN_META;

                        dibujarFila(
                            [
                                sinMetaLab ? 'Sin meta asignada' : (lab.nombre_lab || `Lab ${lab.id_linea_ge}`),
                                sinMetaLab ? '—' : formatMoney(Number(lab.meta_monto)),
                                formatMoney(Number(lab.venta_real)),
                                textoPct(lab.pct_avance_monto),
                                sinMetaLab ? '—' : formatMoney(Number(lab.monto_pendiente)),
                                sinMetaLab ? '—' : `${Number(lab.clientes_atendidos || 0)}/${Number(lab.meta_clientes || 0)}`,
                            ],
                            anchos, derecha, 8, font,
                            (i) => (i === 3 ? colorPct(lab.pct_avance_monto) : rgb(0, 0, 0))
                        );

                        currentPage.drawLine({
                            start: { x: margin, y: yPosition - 5 }, end: { x: pageWidth - margin, y: yPosition - 5 },
                            thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
                        });
                        yPosition -= 15;
                    }

                    // La venta sin meta se declara aparte: suma al avance del
                    // vendedor pero no tiene cuota contra la cual medirse.
                    if (Number(v.venta_sin_meta || 0) > 0) {
                        checkPageBreak(14);
                        const nota = `De la venta anterior, S/ ${formatMoney(Number(v.venta_sin_meta))} corresponde a productos sin meta configurada (${Number(v.items_sin_meta || 0)} ítem/s).`;
                        currentPage.drawText(truncar(nota, contentWidth - 10, 7), {
                            x: margin + 5, y: yPosition, size: 7, font, color: rgb(0.5, 0.35, 0.05),
                        });
                        yPosition -= 14;
                    }

                    yPosition -= 20;
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
            currentPage.drawText(`${agrupados.length} vendedor${agrupados.length === 1 ? '' : 'es'}`, {
                x: margin + 10, y: yPosition - 25, size: 8, font, color: rgb(0.85, 0.9, 1),
            });

            const resumenFinal =
                `Meta: S/ ${formatMoney(totalMeta)}     ` +
                `Venta: S/ ${formatMoney(totalVenta)}     ` +
                `Avance: ${pctGlobal === null ? '—' : `${capPct(pctGlobal)}%`}`;
            currentPage.drawText(resumenFinal, {
                x: pageWidth - margin - boldFont.widthOfTextAtSize(resumenFinal, 9) - 10,
                y: yPosition - 18, size: 9, font: boldFont, color: rgb(1, 1, 1),
            });

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
            link.download = `Metas-Vendedores-${modo}-${ciclo ? `${ciclo.anio}${String(ciclo.mes).padStart(2, '0')}-` : ''}${new Date().toISOString().split('T')[0]}.pdf`;
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
            className="bg-background shadow-sm"
            onClick={generatePdf}
            disabled={loading || disabled}
        >
            <Download className="h-3.5 w-3.5 mr-1" />
            {loading ? "Generando..." : modo === 'resumen' ? "PDF Resumen" : "PDF Detallado"}
        </Button>
    );
};
