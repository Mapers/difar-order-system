import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/hooks/use-toast";

export interface LabSellerReportData {
    Laboratorio: string;
    Mes: string;
    Año: number;
    totalVentasLaboratorio: number;
    vendedores: {
        Codigo_Vend: string;
        Vendedor: string;
        SumaDeVta_Tot: number;
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

            const cols = [100, 300, 115];
            const colHeaders = ["Cód Vendedor", "Nombre Vendedor", "Ventas (S/.)"];

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
                    if (i === 2) textX = xPos + cols[i] - boldFont.widthOfTextAtSize(header, 8) - 5;
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
                        formatMoney(vend.SumaDeVta_Tot)
                    ];

                    rowData.forEach((text, i) => {
                        let textX = xPos;
                        if (i === 2) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 8) - 5;
                        currentPage.drawText(text, { x: textX, y: yPosition, size: 8, font });
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
                const txtTotal = formatMoney(lab.totalVentasLaboratorio);
                currentPage.drawText("TOTAL VENTAS:", { x: margin + cols[0] + 150, y: yPosition, size: 9, font: boldFont, color: rgb(0.1, 0.5, 0.1) });
                currentPage.drawText(txtTotal, {
                    x: margin + 5 + cols[0] + cols[1] + cols[2] - boldFont.widthOfTextAtSize(txtTotal, 9) - 5,
                    y: yPosition, size: 9, font: boldFont, color: rgb(0.1, 0.5, 0.1)
                });

                yPosition -= 35;
            }

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
        <Button variant="outline" className="bg-white shadow-sm w-full sm:w-auto" onClick={generatePdf} disabled={loading || disabled}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};