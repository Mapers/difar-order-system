import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";
import { formatDocumentoConTipo, formatFechaEmision } from "@/components/reporte/detalleLabVendedorShared";

interface ProductoAgrupado {
    Codigo_Art: string;
    NombreItem: string;
    AbrevUnidMed: string;
    TotalCantidad: number;
    TotalVentas: number;
}

interface ExportPdfProps {
    data: any;
    viewMode: 'laboratorios' | 'productos';
    productData?: ProductoAgrupado[];
    disabled?: boolean;
}

export const ExportDetalleLabVendedorPdf: React.FC<ExportPdfProps> = ({
    data,
    viewMode,
    productData = [],
    disabled = false
}) => {
    const [loading, setLoading] = useState(false);

    const formatMoney = (amount: number) =>
        amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition = pageHeight - margin;

            let logoImage: any = null;
            try {
                const logoBytes = await fetch('/difar-logo.png').then(res => res.arrayBuffer());
                logoImage = await pdfDoc.embedPng(logoBytes);
            } catch { console.warn("Sin logo"); }

            const vendData = data[0];
            const labData = vendData.Laboratorios[0];

            const drawPageHeader = (page: any, isFirst: boolean) => {
                if (isFirst) {
                    let titleXPos = margin;
                    if (logoImage) {
                        page.drawImage(logoImage, { x: margin, y: pageHeight - margin - 15, width: 50, height: 30 });
                        titleXPos = margin + 60;
                    }
                    page.drawText("DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.", { x: titleXPos, y: pageHeight - margin, size: 10, font: boldFont });
                    page.drawText("20481321892", { x: titleXPos, y: pageHeight - margin - 12, size: 10, font });

                    yPosition -= 40;
                    const titulo = viewMode === 'laboratorios' ? 'Ventas por Vendedor — Detalle por Laboratorio' : 'Ventas por Vendedor — Resumen por Productos';
                    page.drawText(titulo, { x: margin, y: yPosition, size: 12, font: boldFont });
                    yPosition -= 15;
                    page.drawText(`${labData.Laboratorio}`, { x: margin, y: yPosition, size: 10, font });
                    yPosition -= 12;
                    page.drawText(`${vendData.Mes}, ${vendData.Año}`, { x: margin, y: yPosition, size: 10, font });
                    yPosition -= 15;
                    page.drawText(`Vendedor: ${vendData.Vendedor}`, { x: margin, y: yPosition, size: 9, font: boldFont });
                    yPosition -= 20;
                    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1 });
                    yPosition -= 15;
                } else {
                    yPosition -= 10;
                }
            };

            const checkPageBreak = (needed: number) => {
                if (yPosition - needed < margin + 20) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    yPosition = pageHeight - margin;
                    drawPageHeader(currentPage, false);
                }
            };

            drawPageHeader(currentPage, true);

            if (viewMode === 'laboratorios') {
                // Cant | U.M. | Descripción | Documento | F. Emisión | Total
                // Suma 506 sobre 515.28 útiles (A4 vertical, margen 40).
                const cols       = [28, 28, 245, 85, 55, 65];
                const colHeaders = ['Cant', 'U.M.', 'Descripción', 'Documento', 'F. Emisión', 'Total S/.'];
                const totalColsW = cols.reduce((a, b) => a + b, 0);

                // El modo laboratorios no tenía encabezado de columnas. Con
                // Documento y F. Emisión sumadas, sin rótulos no se entiende.
                checkPageBreak(20);
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 2, width: totalColsW, height: 13,
                    color: rgb(0.93, 0.93, 0.95)
                });
                let xHdr = margin;
                colHeaders.forEach((h, i) => {
                    const isRight = i === 5;
                    const textW = boldFont.widthOfTextAtSize(h, 8);
                    currentPage.drawText(h, {
                        x: isRight ? xHdr + cols[i] - textW - 2 : xHdr + 2,
                        y: yPosition, size: 8, font: boldFont
                    });
                    xHdr += cols[i];
                });
                yPosition -= 18;

                for (const cli of labData.Clientes) {
                    checkPageBreak(40);

                    currentPage.drawText(`${cli.Codigo}    ${cli.Nombre}`, { x: margin, y: yPosition, size: 8, font: boldFont });
                    yPosition -= 12;
                    currentPage.drawText(`${cli.NombreComercial || '-'}`, { x: margin + 60, y: yPosition, size: 8, font });
                    yPosition -= 15;

                    for (const item of cli.Items) {
                        checkPageBreak(15);
                        let xPos = margin;
                        // 48 chars ~ 245pt a 8pt. Antes eran 75 sobre 370pt.
                        const desc = item.NombreItem.length > 48 ? item.NombreItem.substring(0, 48) + '...' : item.NombreItem;
                        const rowData = [
                            item.Cantidad_Sal.toString(),
                            item.AbrevUnidMed,
                            desc,
                            formatDocumentoConTipo(item),
                            formatFechaEmision(item),
                            formatMoney(item.SumaDeVta_Tot)
                        ];

                        rowData.forEach((text, i) => {
                            let textX = xPos;
                            if (i === 5) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 8);
                            currentPage.drawText(text, { x: textX, y: yPosition, size: 8, font });
                            xPos += cols[i];
                        });
                        yPosition -= 12;
                    }

                    checkPageBreak(20);
                    const tcText = formatMoney(cli.TotalCliente);
                    currentPage.drawText("Total Cliente", {
                        x: margin + totalColsW - cols[5] - boldFont.widthOfTextAtSize("Total Cliente", 8) - 8,
                        y: yPosition, size: 8, font: boldFont
                    });
                    currentPage.drawText(tcText, {
                        x: margin + totalColsW - boldFont.widthOfTextAtSize(tcText, 8),
                        y: yPosition, size: 8, font: boldFont
                    });
                    yPosition -= 20;
                }

                checkPageBreak(40);
                yPosition -= 10;
                currentPage.drawText("Total Línea", { x: margin, y: yPosition, size: 9, font: boldFont });
                currentPage.drawText(formatMoney(labData.TotalLinea), { x: margin + 100, y: yPosition, size: 9, font: boldFont });
                yPosition -= 15;
                currentPage.drawText("Total Vendedor", { x: margin, y: yPosition, size: 9, font: boldFont });
                currentPage.drawText(formatMoney(vendData.TotalVendedor), { x: margin + 100, y: yPosition, size: 9, font: boldFont });

            } else {
                // Encabezado de columnas para productos
                const colWidths = [55, 270, 40, 60, 70];
                const colHeaders = ['Cód. Art', 'Descripción', 'U.M.', 'Cant. Total', 'Total S/.'];
                let xPos = margin;

                currentPage.drawRectangle({ x: margin, y: yPosition - 2, width: pageWidth - margin * 2, height: 13, color: rgb(0.93, 0.93, 0.95) });
                colHeaders.forEach((h, i) => {
                    const isRight = i >= 3;
                    const textW = boldFont.widthOfTextAtSize(h, 8);
                    currentPage.drawText(h, {
                        x: isRight ? xPos + colWidths[i] - textW - 2 : xPos + 2,
                        y: yPosition, size: 8, font: boldFont
                    });
                    xPos += colWidths[i];
                });
                yPosition -= 18;

                for (const prod of productData) {
                    checkPageBreak(14);
                    xPos = margin;
                    const desc = prod.NombreItem.length > 60 ? prod.NombreItem.substring(0, 60) + '...' : prod.NombreItem;
                    const rowData = [prod.Codigo_Art, desc, prod.AbrevUnidMed, prod.TotalCantidad.toString(), formatMoney(prod.TotalVentas)];

                    rowData.forEach((text, i) => {
                        const isRight = i >= 3;
                        const textW = font.widthOfTextAtSize(text, 8);
                        currentPage.drawText(text, {
                            x: isRight ? xPos + colWidths[i] - textW - 2 : xPos + 2,
                            y: yPosition, size: 8, font
                        });
                        xPos += colWidths[i];
                    });

                    currentPage.drawLine({
                        start: { x: margin, y: yPosition - 4 },
                        end: { x: pageWidth - margin, y: yPosition - 4 },
                        thickness: 0.3, color: rgb(0.88, 0.88, 0.88)
                    });
                    yPosition -= 14;
                }

                checkPageBreak(25);
                yPosition -= 8;
                const tvText = formatMoney(vendData.TotalVendedor);
                const totalLabel = 'TOTAL VENDEDOR:';
                currentPage.drawText(totalLabel, {
                    x: pageWidth - margin - boldFont.widthOfTextAtSize(totalLabel, 9) - boldFont.widthOfTextAtSize(tvText, 9) - 15,
                    y: yPosition, size: 9, font: boldFont, color: rgb(0.1, 0.45, 0.1)
                });
                currentPage.drawText(tvText, {
                    x: pageWidth - margin - boldFont.widthOfTextAtSize(tvText, 9),
                    y: yPosition, size: 9, font: boldFont, color: rgb(0.1, 0.45, 0.1)
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            const suffix = viewMode === 'productos' ? 'Productos' : 'Laboratorio';
            link.download = `Detalle_${suffix}_${vendData.Codigo_Vend}_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            className={`w-full sm:w-auto shadow-sm ${viewMode === 'productos' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            onClick={generatePdf}
            disabled={loading || disabled}
        >
            <FileText className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar Detalle"}
        </Button>
    );
};
