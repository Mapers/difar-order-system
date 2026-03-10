import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/hooks/use-toast";

interface ExportPdfProps {
    data: any;
    disabled?: boolean;
}

export const ExportSaldoCobrarPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateString = (dateStr: string) => {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const generatePdf = async () => {
        if (!data) return;
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
                const logoUrl = '/difar-logo.png';
                const logoBytes = await fetch(logoUrl).then((res) => {
                    if (!res.ok) throw new Error("No se pudo cargar la imagen");
                    return res.arrayBuffer();
                });
                logoImage = await pdfDoc.embedPng(logoBytes);
            } catch (error) {
                console.warn("No se pudo cargar el logotipo para el PDF:", error);
            }

            const drawHeader = (page: any, isFirstPage: boolean) => {
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

                page.drawText("DROGUERÍA DIFAR", {
                    x: titleXPos,
                    y: pageHeight - margin,
                    size: 10,
                    font: boldFont,
                    color: rgb(0.3, 0.3, 0.3),
                });

                page.drawText("SALDO DE DOCUMENTOS POR COBRAR CLIENTE", {
                    x: titleXPos,
                    y: pageHeight - margin - 15,
                    size: 12,
                    font: boldFont,
                    color: rgb(0, 0, 0),
                });

                const dateText = `Impreso: ${new Date().toLocaleDateString('es-PE')}`;
                page.drawText(dateText, {
                    x: pageWidth - margin - font.widthOfTextAtSize(dateText, 8),
                    y: pageHeight - margin,
                    size: 8,
                    font
                });

                yPosition = pageHeight - margin - 35;

                if (isFirstPage) {
                    page.drawRectangle({
                        x: margin,
                        y: yPosition - 50,
                        width: contentWidth,
                        height: 55,
                        color: rgb(0.96, 0.96, 0.96),
                        borderColor: rgb(0.8, 0.8, 0.8),
                        borderWidth: 1
                    });

                    const direccionCorta = data.Direccion && data.Direccion.length > 85
                        ? data.Direccion.substring(0, 85) + "..."
                        : data.Direccion;

                    page.drawText(`CLIENTE: ${data.Cliente}`, { x: margin + 10, y: yPosition - 15, size: 8, font: boldFont });
                    page.drawText(`DOCUMENTO: ${data.RUC}`, { x: margin + 350, y: yPosition - 15, size: 8, font: boldFont });
                    page.drawText(`DIRECCIÓN: ${direccionCorta}`, { x: margin + 10, y: yPosition - 30, size: 8, font });
                    page.drawText(`${formatDateString(data.FechaCorte)}`, { x: margin + 10, y: yPosition - 45, size: 8, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
                    page.drawText(`TELÉFONO: ${data.Telefono || '-'}`, { x: margin + 350, y: yPosition - 45, size: 8, font });

                    yPosition -= 70;
                } else {
                    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1 });
                    yPosition -= 15;
                }
            };

            const checkPageBreak = (needed: number) => {
                if (yPosition - needed < margin) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader(currentPage, false);
                }
            };

            drawHeader(currentPage, true);

            const cols = [50, 50, 40, 60, 20, 65, 65, 80, 80];
            const colHeaders = ["Emisión", "Vcto.", "Doc.", "Nro Doc", "M", "Provisión", "Amortiz.", "Saldo S/.", "Saldo US$"];

            for (const vend of data.vendedores) {
                checkPageBreak(50);
                currentPage.drawRectangle({ x: margin, y: yPosition - 12, width: contentWidth, height: 16, color: rgb(0.2, 0.2, 0.2) });
                currentPage.drawText(`Vendedor: ${vend.Vendedor}    |    Zona: ${vend.NombreZona}`, {
                    x: margin + 5, y: yPosition - 8, size: 8, font: boldFont, color: rgb(1, 1, 1)
                });

                yPosition -= 25;

                let xPos = margin + 5;
                currentPage.drawRectangle({ x: margin, y: yPosition - 4, width: contentWidth, height: 14, color: rgb(0.9, 0.9, 0.9) });

                colHeaders.forEach((header, i) => {
                    let textX = xPos;
                    if (i >= 5) textX = xPos + cols[i] - boldFont.widthOfTextAtSize(header, 7) - 5;
                    if (i === 4) textX = xPos + (cols[i]/2) - (boldFont.widthOfTextAtSize(header, 7)/2);

                    currentPage.drawText(header, { x: textX, y: yPosition, size: 7, font: boldFont });
                    xPos += cols[i];
                });

                yPosition -= 15;

                for (const doc of vend.documentos) {
                    checkPageBreak(15);
                    xPos = margin + 5;

                    const isSoles = doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.';

                    const rowData = [
                        formatDateString(doc.Fecha_Emision),
                        formatDateString(doc.Fecha_Vcto),
                        doc.TipoDocumento,
                        `${doc.SerieDoc}-${doc.NumeroDoc}`,
                        doc.Moneda,
                        formatMoney(doc.SumaProvision),
                        formatMoney(doc.SumaAmortizacion),
                        isSoles ? formatMoney(doc.Saldo) : '-',
                        !isSoles ? formatMoney(doc.Saldo) : '-'
                    ];

                    rowData.forEach((text, i) => {
                        let textX = xPos;
                        if (i >= 5) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 7) - 5;
                        if (i === 4) textX = xPos + (cols[i]/2) - (font.widthOfTextAtSize(text, 7)/2);

                        currentPage.drawText(text, { x: textX, y: yPosition, size: 7, font });
                        xPos += cols[i];
                    });

                    currentPage.drawLine({ start: { x: margin, y: yPosition - 4 }, end: { x: pageWidth - margin, y: yPosition - 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
                    yPosition -= 14;
                }
                yPosition -= 10;
            }

            checkPageBreak(40);
            yPosition -= 5;

            currentPage.drawRectangle({ x: margin, y: yPosition - 20, width: contentWidth, height: 25, color: rgb(0.1, 0.4, 0.8) });
            currentPage.drawText("TOTAL CLIENTE:", { x: margin + 10, y: yPosition - 10, size: 9, font: boldFont, color: rgb(1, 1, 1) });

            const txtSoles = `S/ ${formatMoney(data.TotalSoles)}`;
            currentPage.drawText(txtSoles, {
                x: margin + 310,
                y: yPosition - 10,
                size: 9,
                font: boldFont,
                color: rgb(1, 1, 1)
            });

            const txtDolares = `US$ ${formatMoney(data.TotalDolares)}`;
            currentPage.drawText(txtDolares, {
                x: margin + 410,
                y: yPosition - 10,
                size: 9,
                font: boldFont,
                color: rgb(1, 1, 1)
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Saldo_Cobrar_${data.RUC}_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" className="bg-white shadow-sm w-full sm:w-auto text-blue-700 border-blue-200 hover:bg-blue-50" onClick={generatePdf} disabled={loading || disabled}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};