import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";

interface ExportPdfProps {
    data: any;
    disabled?: boolean;
}

export const ExportDetalleLabVendedorPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const generatePdf = async () => {
        if (!data || data.length === 0) return;
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

            let logoImage: any = null;
            try {
                const logoBytes = await fetch('/difar-logo.png').then(res => res.arrayBuffer());
                logoImage = await pdfDoc.embedPng(logoBytes);
            } catch (error) { console.warn("Sin logo"); }

            const drawHeader = (page: any, isFirstPage: boolean, labName: string, mes: string, año: string) => {
                if (isFirstPage) {
                    let titleXPos = margin;
                    if (logoImage) {
                        page.drawImage(logoImage, { x: margin, y: pageHeight - margin - 15, width: 50, height: 30 });
                        titleXPos = margin + 60;
                    }

                    page.drawText("DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.", { x: titleXPos, y: pageHeight - margin, size: 10, font: boldFont });
                    page.drawText("20481321892", { x: titleXPos, y: pageHeight - margin - 12, size: 10, font });

                    yPosition -= 40;
                    page.drawText("Ventas por vendedor", { x: margin, y: yPosition, size: 12, font: boldFont });
                    yPosition -= 15;
                    page.drawText(`${labName}`, { x: margin, y: yPosition, size: 10, font });
                    yPosition -= 12;
                    page.drawText(`${mes}, ${año}`, { x: margin, y: yPosition, size: 10, font });

                    yPosition -= 20;
                    page.drawText("Detalle", { x: margin, y: yPosition, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
                    page.drawLine({ start: { x: margin, y: yPosition - 4 }, end: { x: pageWidth - margin, y: yPosition - 4 }, thickness: 1 });
                    yPosition -= 15;
                } else {
                    yPosition -= 10;
                }
            };

            const checkPageBreak = (needed: number, labName: string, mes: string, año: string) => {
                if (yPosition - needed < margin + 20) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    yPosition = pageHeight - margin;
                    drawHeader(currentPage, false, labName, mes, año);
                }
            };

            const vendData = data[0];
            const labData = vendData.Laboratorios[0];

            drawHeader(currentPage, true, labData.Laboratorio, vendData.Mes, vendData.Año);

            currentPage.drawText(`${vendData.Vendedor}`, { x: margin, y: yPosition, size: 9, font: boldFont });
            yPosition -= 15;
            currentPage.drawText(`${labData.Laboratorio}`, { x: margin, y: yPosition, size: 9, font: boldFont });
            yPosition -= 20;

            const cols = [30, 30, 370, 60];

            for (const cli of labData.Clientes) {
                checkPageBreak(40, labData.Laboratorio, vendData.Mes, vendData.Año);

                currentPage.drawText(`${cli.Codigo}    ${cli.Nombre}`, { x: margin, y: yPosition, size: 8, font: boldFont });
                yPosition -= 12;
                currentPage.drawText(`${cli.NombreComercial || '-'}`, { x: margin + 60, y: yPosition, size: 8, font: boldFont });
                yPosition -= 15;

                for (const item of cli.Items) {
                    checkPageBreak(15, labData.Laboratorio, vendData.Mes, vendData.Año);

                    let xPos = margin;
                    const desc = item.NombreItem.length > 75 ? item.NombreItem.substring(0, 75) + "..." : item.NombreItem;

                    const rowData = [
                        item.Cantidad_Sal.toString(),
                        item.AbrevUnidMed,
                        desc,
                        formatMoney(item.SumaDeVta_Tot)
                    ];

                    rowData.forEach((text, i) => {
                        let textX = xPos;
                        if (i === 3) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 8);

                        currentPage.drawText(text, { x: textX, y: yPosition, size: 8, font });
                        xPos += cols[i];
                    });
                    yPosition -= 12;
                }

                checkPageBreak(20, labData.Laboratorio, vendData.Mes, vendData.Año);
                currentPage.drawText("Total Cliente", { x: margin + cols[0] + cols[1] + 250, y: yPosition, size: 8, font: boldFont });
                currentPage.drawText(formatMoney(cli.TotalCliente), { x: margin + cols[0] + cols[1] + cols[2] + cols[3] - boldFont.widthOfTextAtSize(formatMoney(cli.TotalCliente), 8), y: yPosition, size: 8, font: boldFont });
                yPosition -= 20;
            }

            checkPageBreak(40, labData.Laboratorio, vendData.Mes, vendData.Año);
            yPosition -= 10;
            currentPage.drawText("Total Linea", { x: margin, y: yPosition, size: 9, font: boldFont });
            currentPage.drawText(formatMoney(labData.TotalLinea), { x: margin + 100, y: yPosition, size: 9, font: boldFont });
            yPosition -= 15;
            currentPage.drawText("Total Vendedor", { x: margin, y: yPosition, size: 9, font: boldFont });
            currentPage.drawText(formatMoney(vendData.TotalVendedor), { x: margin + 100, y: yPosition, size: 9, font: boldFont });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Detalle_Ventas_${vendData.Codigo_Vend}_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto shadow-sm" onClick={generatePdf} disabled={loading || disabled}>
            <FileText className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar Detalle"}
        </Button>
    );
};