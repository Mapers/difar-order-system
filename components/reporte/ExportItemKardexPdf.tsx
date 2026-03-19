import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/use-toast";

export interface KardexItemData {
    IdArticulo: number;
    Codigo_Art: string;
    NombreItem: string;
    Fecha_Mvto: string;
    SumaDeCantidad_Ing: number;
    SumaDeCantidad_Sal: number;
    SumaDeSaldo: number;
    AbrevUnidMed: string;
    OPERACION: string;
    SerieNumero: string;
    DescripcionTipoExistencia: string;
    Abreviatura: string;
    formula_ab: string | null;
    UndCostos?: string | null;
}

interface ExportPdfProps {
    data: KardexItemData[];
    startDate: Date;
    endDate: Date;
    disabled?: boolean;
}

export const ExportItemKardexPdf: React.FC<ExportPdfProps> = ({ data, startDate, endDate, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatNumber = (amount: number) => {
        return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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

                page.drawText("REGISTRO DE INVENTARIO PERMANENTE EN UNIDADES FISICAS", {
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

            const cols = [45, 30, 45, 140, 45, 70, 70, 70];
            const colHeaders = ["Fecha", "Doc.", "Serie Nro.", "Concepto", "Fórmula", "Cant. Ingreso", "Cant. Salida", "Cant. Saldo"];

            const drawTableHeaders = () => {
                const baseItem = data[0];

                const productTxt = `${baseItem.Codigo_Art} - ${baseItem.NombreItem}`;
                const productWidth = boldFont.widthOfTextAtSize(productTxt, 10);
                currentPage.drawText(productTxt, {
                    x: (pageWidth - productWidth) / 2,
                    y: yPosition,
                    size: 10,
                    font: boldFont,
                    color: rgb(0.1, 0.1, 0.1),
                });
                yPosition -= 14;

                const fechasTxt = `${formatDate(startDate)} - ${formatDate(endDate)}`;
                const fechasWidth = font.widthOfTextAtSize(fechasTxt, 9);
                currentPage.drawText(fechasTxt, {
                    x: (pageWidth - fechasWidth) / 2,
                    y: yPosition,
                    size: 9,
                    font,
                    color: rgb(0.4, 0.4, 0.4)
                });
                yPosition -= 25;

                currentPage.drawText(`Tipo de Existencia: ${baseItem.DescripcionTipoExistencia || 'Mercadería'}`, { x: margin, y: yPosition, size: 8, font });
                currentPage.drawText(`U.M.: ${baseItem.AbrevUnidMed || 'UND'}`, { x: pageWidth - margin - 80, y: yPosition, size: 8, font });
                yPosition -= 20;

                currentPage.drawText("Unidad de Costos", {
                    x: margin,
                    y: yPosition,
                    size: 8,
                    font: boldFont,
                    color: rgb(0.3, 0.3, 0.3)
                });
                yPosition -= 14;

                let xPos = margin;
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 4, width: contentWidth, height: 16, color: rgb(0.9, 0.9, 0.9)
                });

                colHeaders.forEach((header, i) => {
                    let textX = xPos + 2;
                    if (i >= 5) textX = xPos + cols[i] - boldFont.widthOfTextAtSize(header, 8) - 2;
                    currentPage.drawText(header, { x: textX, y: yPosition, size: 8, font: boldFont });
                    xPos += cols[i];
                });
                yPosition -= 15;
            };

            const checkPageBreak = (needed: number) => {
                if (yPosition - needed < margin) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader(currentPage);
                    drawTableHeaders();
                }
            };

            drawHeader(currentPage);
            drawTableHeaders();

            let totalIngreso = 0;
            let totalSalida = 0;

            for (const row of data) {
                checkPageBreak(15);
                let xPos = margin;

                totalIngreso += Number(row.SumaDeCantidad_Ing) || 0;
                totalSalida += Number(row.SumaDeCantidad_Sal) || 0;

                const fechaFormateada = row.Fecha_Mvto ? row.Fecha_Mvto.substring(0, 10) : '-';

                const rowData = [
                    fechaFormateada.split('-').reverse().join('/'),
                    row.Abreviatura || '-',
                    row.SerieNumero || '-',
                    row.OPERACION || '-',
                    row.formula_ab || '-',
                    formatNumber(row.SumaDeCantidad_Ing),
                    formatNumber(row.SumaDeCantidad_Sal),
                    formatNumber(row.SumaDeSaldo)
                ];

                rowData.forEach((text, i) => {
                    let textX = xPos + 2;
                    if (i >= 5) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 7) - 2;

                    let displayText = text;
                    if (i === 3) {
                        const maxW = cols[i] - 4;
                        if (font.widthOfTextAtSize(displayText, 7) > maxW) {
                            displayText = displayText.substring(0, 32) + "...";
                        }
                    }

                    currentPage.drawText(displayText, { x: textX, y: yPosition, size: 7, font });
                    xPos += cols[i];
                });

                currentPage.drawLine({
                    start: { x: margin, y: yPosition - 5 },
                    end: { x: pageWidth - margin, y: yPosition - 5 },
                    thickness: 0.5, color: rgb(0.9, 0.9, 0.9)
                });

                yPosition -= 12;
            }

            checkPageBreak(25);
            yPosition -= 5;
            currentPage.drawRectangle({
                x: margin, y: yPosition - 4, width: contentWidth, height: 16, color: rgb(0.95, 0.95, 0.95)
            });

            const lblTotal = "TOTAL ARTICULO:";
            const xOffsetTotales = margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4];

            currentPage.drawText(lblTotal, { x: xOffsetTotales - boldFont.widthOfTextAtSize(lblTotal, 8) - 10, y: yPosition, size: 8, font: boldFont, color: rgb(0.1, 0.5, 0.1) });

            const txtTotIng = formatNumber(totalIngreso);
            const txtTotSal = formatNumber(totalSalida);

            currentPage.drawText(txtTotIng, { x: xOffsetTotales + cols[5] - boldFont.widthOfTextAtSize(txtTotIng, 8) - 2, y: yPosition, size: 8, font: boldFont, color: rgb(0.1, 0.5, 0.1) });
            currentPage.drawText(txtTotSal, { x: xOffsetTotales + cols[5] + cols[6] - boldFont.widthOfTextAtSize(txtTotSal, 8) - 2, y: yPosition, size: 8, font: boldFont, color: rgb(0.1, 0.5, 0.1) });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Kardex-${data[0].Codigo_Art}-${new Date().getTime()}.pdf`;
            link.click();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" className="bg-white shadow-sm w-full sm:w-auto" onClick={generatePdf} disabled={loading || disabled}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};