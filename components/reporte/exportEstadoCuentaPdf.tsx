import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/useToast";

interface ExportPdfProps {
    data: any;
    disabled?: boolean;
}

export const ExportEstadoCuentaPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
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

                page.drawText("ESTADO DE CUENTA CLIENTE", {
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
                        y: yPosition - 55,
                        width: contentWidth,
                        height: 60,
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
                    page.drawText(`${formatDateStr(data.FechaCorte)}`, { x: margin + 10, y: yPosition - 45, size: 8, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
                    page.drawText(`TELÉFONO: ${data.Telefono || '-'}`, { x: margin + 350, y: yPosition - 45, size: 8, font });

                    yPosition -= 75;
                } else {
                    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1 });
                    yPosition -= 15;
                }

                const cols = [50, 185, 40, 60, 60, 60, 60];
                const colHeaders = ["Fecha", "Descripción", "Moneda", "Provisión", "Amortización", "Saldo S/.", "Saldo US$"];

                let xPos = margin;
                colHeaders.forEach((header, i) => {
                    let textX = xPos;
                    if (i >= 3) textX = xPos + cols[i] - boldFont.widthOfTextAtSize(header, 8) - 5;
                    if (i === 2) textX = xPos + (cols[i]/2) - (boldFont.widthOfTextAtSize(header, 8)/2);

                    page.drawText(header, { x: textX, y: yPosition, size: 8, font: boldFont });
                    xPos += cols[i];
                });

                page.drawLine({ start: { x: margin, y: yPosition - 4 }, end: { x: pageWidth - margin, y: yPosition - 4 }, thickness: 1 });
                yPosition -= 16;
            };

            const checkPageBreak = (needed: number) => {
                if (yPosition - needed < margin + 20) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    yPosition = pageHeight - margin;
                    drawHeader(currentPage, false);
                }
            };

            drawHeader(currentPage, true);

            const cols = [50, 185, 40, 60, 60, 60, 60];

            for (const doc of data.Documentos) {
                checkPageBreak(30);

                currentPage.drawText(`Documento: ${doc.Abreviatura}`, { x: margin, y: yPosition, size: 8, font: boldFont });
                currentPage.drawText(`${doc.SerieNumero}`, { x: margin + 80, y: yPosition, size: 8, font: boldFont });
                currentPage.drawText(`Emisión:`, { x: margin + 180, y: yPosition, size: 8, font });
                currentPage.drawText(`${formatDateStr(doc.Emision)}`, { x: margin + 220, y: yPosition, size: 8, font: boldFont });
                currentPage.drawText(`Vencimiento:`, { x: margin + 300, y: yPosition, size: 8, font });
                currentPage.drawText(`${formatDateStr(doc.Vencimiento)}`, { x: margin + 360, y: yPosition, size: 8, font: boldFont, color: rgb(0.8, 0, 0) });

                yPosition -= 14;

                let sumProvision = 0;
                let sumAmortizacion = 0;

                for (const mov of doc.Movimientos) {
                    checkPageBreak(15);

                    sumProvision += mov.Provision;
                    sumAmortizacion += mov.Amortizacion;

                    let xPos = margin;
                    const isSoles = mov.Moneda === 'S/.' || mov.Moneda === 'NSO';

                    const desc = mov.Descripcion.length > 42 ? mov.Descripcion.substring(0, 42) + "..." : mov.Descripcion;

                    const rowData = [
                        formatDateStr(mov.Fecha),
                        desc,
                        mov.Moneda,
                        formatMoney(mov.Provision),
                        formatMoney(mov.Amortizacion),
                        isSoles ? formatMoney(mov.SaldoSoles) : '0.00',
                        !isSoles ? formatMoney(mov.SaldoDolares) : '0.00'
                    ];

                    rowData.forEach((text, i) => {
                        let textX = xPos;
                        if (i >= 3) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 8) - 5;
                        if (i === 2) textX = xPos + (cols[i]/2) - (font.widthOfTextAtSize(text, 8)/2);

                        currentPage.drawText(text, { x: textX, y: yPosition, size: 8, font });
                        xPos += cols[i];
                    });

                    yPosition -= 12;
                }

                checkPageBreak(15);

                const subTitle = `SALDO: ${doc.Abreviatura} Nro. ${doc.SerieNumero}`;
                const subTitleWidth = boldFont.widthOfTextAtSize(subTitle, 8);
                currentPage.drawText(subTitle, { x: margin + cols[0] + cols[1] - subTitleWidth - 10, y: yPosition, size: 8, font: boldFont });

                currentPage.drawText(formatMoney(sumProvision), { x: margin + cols[0] + cols[1] + cols[2] + cols[3] - boldFont.widthOfTextAtSize(formatMoney(sumProvision), 8) - 5, y: yPosition, size: 8, font: boldFont });
                currentPage.drawText(formatMoney(sumAmortizacion), { x: margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] - boldFont.widthOfTextAtSize(formatMoney(sumAmortizacion), 8) - 5, y: yPosition, size: 8, font: boldFont });

                const saldoFinalSoles = formatMoney(doc.SaldoFinalSoles || 0);
                const saldoFinalDolares = formatMoney(doc.SaldoFinalDolares || 0);

                currentPage.drawText(saldoFinalSoles, { x: margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] - boldFont.widthOfTextAtSize(saldoFinalSoles, 8) - 5, y: yPosition, size: 8, font: boldFont, color: rgb(0, 0.2, 0.8) });
                currentPage.drawText(saldoFinalDolares, { x: margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] + cols[6] - boldFont.widthOfTextAtSize(saldoFinalDolares, 8) - 5, y: yPosition, size: 8, font: boldFont, color: rgb(0, 0.5, 0) });

                yPosition -= 20;
            }

            checkPageBreak(20);
            const totalTitle = "SALDO CLIENTE:";
            const totalTitleWidth = boldFont.widthOfTextAtSize(totalTitle, 9);
            currentPage.drawText(totalTitle, { x: margin + cols[0] + cols[1] - totalTitleWidth - 10, y: yPosition, size: 9, font: boldFont });

            const txtTotalSoles = formatMoney(data.TotalSoles);
            currentPage.drawText(txtTotalSoles, { x: margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] - boldFont.widthOfTextAtSize(txtTotalSoles, 9) - 5, y: yPosition, size: 9, font: boldFont, color: rgb(0, 0, 0) });

            const txtTotalDolares = formatMoney(data.TotalDolares);
            currentPage.drawText(txtTotalDolares, { x: margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4] + cols[5] + cols[6] - boldFont.widthOfTextAtSize(txtTotalDolares, 9) - 5, y: yPosition, size: 9, font: boldFont, color: rgb(0, 0, 0) });

            const pages = pdfDoc.getPages();
            pages.forEach((page, idx) => {
                const pageNum = `Página ${idx + 1} de ${pages.length}`;
                page.drawText(pageNum, { x: pageWidth - margin - font.widthOfTextAtSize(pageNum, 8), y: margin / 2, size: 8, font });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Estado_Cuenta_${data.RUC}_${new Date().toISOString().split('T')[0]}.pdf`;
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
            <FileText className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};