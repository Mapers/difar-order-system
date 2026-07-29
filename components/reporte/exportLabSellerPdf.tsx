import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";
import { capPctCuota, estadoCuota, hexEstado } from "@/app/utils/cuotas-helpers";

export interface LabSellerReportData {
    Laboratorio: string;
    Mes: string;
    Año: number;
    totalVentasLaboratorio: number;
    /** Los campos de cuota los agrega dataConCuotas en la página. */
    IdLineaGe?: number;
    cuotaLab?: number;
    pctLab?: number | null;
    vendedores: {
        Codigo_Vend: string;
        Vendedor: string;
        SumaDeVta_Tot: number;
        SumaDeVta_Fact?: number;
        cuota?: number;
        pct?: number | null;
        sinVentas?: boolean;
    }[];
}

interface ExportPdfProps {
    data: LabSellerReportData[];
    disabled?: boolean;
}

export const ExportLabSellerPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatMoney = (amount: number) => {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const generatePdf = async () => {
        if (!data || data.length === 0) {
            toast({ title: "Sin datos", description: "No hay datos para exportar", variant: "warning" });
            return;
        }

        setLoading(true);

        try {
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 40;
            const contentWidth = pageWidth - (margin * 2);

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition = pageHeight - margin;

            let logoImage = null;
            try {
                const logoUrl = '/difar-logo.png';
                const logoBytes = await fetch(logoUrl).then((res) => {
                    if (!res.ok) throw new Error("No se pudo cargar la imagen");
                    return res.arrayBuffer();
                });
                logoImage = await pdfDoc.embedPng(logoBytes);
            } catch (error) {
                console.warn("No se pudo cargar el logotipo para el PDF:", error);
            }

            const drawHeader = (page: any) => {
                let titleXPos = margin;
                if (logoImage) {
                    const logoWidth = 50;
                    const logoHeight = 30;
                    page.drawImage(logoImage, {
                        x: margin,
                        y: pageHeight - margin - 15,
                        width: logoWidth,
                        height: logoHeight,
                    });
                    titleXPos = margin + logoWidth + 10;
                }

                page.drawText("DROGUERIA DIFAR", {
                    x: titleXPos,
                    y: pageHeight - margin,
                    size: 12,
                    font: boldFont,
                    color: rgb(0, 0, 0),
                });

                page.drawText("Ventas por Vendedor", {
                    x: titleXPos,
                    y: pageHeight - margin - 15,
                    size: 10,
                    font,
                    color: rgb(0.3, 0.3, 0.3),
                });

                const dateText = `Fecha: ${new Date().toLocaleDateString()}`;
                page.drawText(dateText, { x: pageWidth - margin - font.widthOfTextAtSize(dateText, 8), y: pageHeight - margin, size: 8, font });

                yPosition = pageHeight - margin - 40;
                page.drawLine({ start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1 });
                yPosition -= 20;
            };

            const checkPageBreak = (needed: number) => {
                if (yPosition - needed < margin) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader(currentPage);
                }
            };

            drawHeader(currentPage);

            // Columnas: las tres últimas van alineadas a la derecha.
            const cols = [70, 190, 85, 85, 85];
            const colHeaders = ["Cód Vend.", "Nombre Vendedor", "Ventas (S/.)", "Cuota (S/.)", "% Cumpl."];
            const alineadasDerecha = new Set([2, 3, 4]);

            /**
             * "—" cuando no hay cuota contra la cual medir, que es distinto de
             * 0%. El valor se topa a 100, igual que en pantalla.
             */
            const textoPct = (pct: number | null | undefined): string =>
                pct === null || pct === undefined ? "—" : `${capPctCuota(pct)!.toFixed(2)}%`;

            const colorPct = (pct: number | null | undefined) => {
                const hex = hexEstado[estadoCuota(pct ?? null)];
                const n = parseInt(hex.slice(1), 16);
                return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
            };

            for (const lab of data) {
                checkPageBreak(50);

                currentPage.drawRectangle({
                    x: margin, y: yPosition - 10, width: contentWidth, height: 20, color: rgb(0.3, 0.3, 0.8)
                });
                currentPage.drawText(`${lab.Laboratorio}`, {
                    x: margin + 5, y: yPosition - 5, size: 10, font: boldFont, color: rgb(1, 1, 1)
                });

                const periodoTxt = `Mes: ${lab.Mes} | Año: ${lab.Año}`;
                currentPage.drawText(periodoTxt, {
                    x: pageWidth - margin - boldFont.widthOfTextAtSize(periodoTxt, 9) - 5,
                    y: yPosition - 5, size: 9, font: boldFont, color: rgb(1, 1, 1)
                });

                yPosition -= 30;

                let xPos = margin + 5;
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 2, width: contentWidth, height: 12, color: rgb(0.95, 0.95, 0.95)
                });

                colHeaders.forEach((header, i) => {
                    let textX = xPos;
                    if (alineadasDerecha.has(i)) textX = xPos + cols[i] - boldFont.widthOfTextAtSize(header, 8) - 5;
                    currentPage.drawText(header, { x: textX, y: yPosition, size: 8, font: boldFont });
                    xPos += cols[i];
                });

                yPosition -= 15;

                for (const vend of lab.vendedores) {
                    checkPageBreak(15);
                    xPos = margin + 5;

                    const cleanName = vend.Vendedor.substring(vend.Codigo_Vend.length).trim();

                    const rowData = [
                        vend.Codigo_Vend,
                        cleanName,
                        formatMoney(vend.SumaDeVta_Tot),
                        vend.cuota && vend.cuota > 0 ? formatMoney(vend.cuota) : "—",
                        textoPct(vend.pct)
                    ];

                    rowData.forEach((text, i) => {
                        let textX = xPos;
                        if (alineadasDerecha.has(i)) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 8) - 5;
                        // El semáforo es lo único con color: en PDF no hay barra
                        // de avance, así que el color carga toda la señal.
                        const color = i === 4 ? colorPct(vend.pct) : rgb(0, 0, 0);
                        currentPage.drawText(text, { x: textX, y: yPosition, size: 8, font, color });
                        xPos += cols[i];
                    });

                    currentPage.drawLine({
                        start: { x: margin, y: yPosition - 5 },
                        end: { x: pageWidth - margin, y: yPosition - 5 },
                        thickness: 0.5, color: rgb(0.9, 0.9, 0.9)
                    });

                    yPosition -= 15;
                }

                checkPageBreak(20);
                const verde = rgb(0.1, 0.5, 0.1);
                currentPage.drawText("TOTALES:", { x: margin + 5, y: yPosition, size: 9, font: boldFont, color: verde });

                // Cada total va alineado al borde derecho de su propia columna,
                // para que quede debajo del valor que resume.
                const totalesFila: [string, number][] = [
                    [formatMoney(lab.totalVentasLaboratorio), 2],
                    [lab.cuotaLab && lab.cuotaLab > 0 ? formatMoney(lab.cuotaLab) : "—", 3],
                    [textoPct(lab.pctLab), 4],
                ];
                for (const [texto, idx] of totalesFila) {
                    const bordeDerecho = margin + 5 + cols.slice(0, idx + 1).reduce((a, c) => a + c, 0);
                    currentPage.drawText(texto, {
                        x: bordeDerecho - boldFont.widthOfTextAtSize(texto, 9) - 5,
                        y: yPosition, size: 9, font: boldFont,
                        color: idx === 4 ? colorPct(lab.pctLab) : verde,
                    });
                }

                yPosition -= 35;
            }

            // --- CUADRO FINAL: TOTAL GENERAL (TODOS LOS LABORATORIOS) ---
            const totalGeneral = data.reduce((acc, lab) => acc + (lab.totalVentasLaboratorio || 0), 0);
            const cuotaGeneral = data.reduce((acc, lab) => acc + (lab.cuotaLab || 0), 0);
            const factGeneral = data.reduce(
                (acc, lab) => acc + lab.vendedores.reduce((b, v) => b + Number(v.SumaDeVta_Fact || 0), 0),
                0
            );
            // Mismo criterio que la pantalla: sobre venta facturada, y "—" si
            // no hay cuota. No se promedian los porcentajes de cada laboratorio.
            const pctGeneral = cuotaGeneral > 0
                ? Math.round((factGeneral / cuotaGeneral) * 10000) / 100
                : null;

            checkPageBreak(40);
            yPosition -= 5;

            currentPage.drawRectangle({ x: margin, y: yPosition - 20, width: contentWidth, height: 25, color: rgb(0.1, 0.4, 0.8) });
            currentPage.drawText("TOTAL GENERAL:", { x: margin + 10, y: yPosition - 10, size: 9, font: boldFont, color: rgb(1, 1, 1) });

            const txtTotalGeneral =
                `Ventas: S/ ${formatMoney(totalGeneral)}    ` +
                `Cuota: ${cuotaGeneral > 0 ? `S/ ${formatMoney(cuotaGeneral)}` : "—"}    ` +
                `Cumpl.: ${textoPct(pctGeneral)}`;
            currentPage.drawText(txtTotalGeneral, {
                x: pageWidth - margin - boldFont.widthOfTextAtSize(txtTotalGeneral, 9) - 10,
                y: yPosition - 10,
                size: 9,
                font: boldFont,
                color: rgb(1, 1, 1)
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Ventas-Laboratorio-Vendedor-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" className="bg-background shadow-sm w-full sm:w-auto" onClick={generatePdf} disabled={loading || disabled}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};