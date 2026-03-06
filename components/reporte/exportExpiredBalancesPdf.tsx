import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/hooks/use-toast";
import {VendedorVencido} from "@/app/types/report-interface";

interface ExportPdfProps {
    data: VendedorVencido[];
    disabled?: boolean;
}

export const ExportExpiredBalancesPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        } catch {
            return dateString;
        }
    };

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

            const pageWidth = 595.28; // A4
            const pageHeight = 841.89;
            const margin = 40;
            const contentWidth = pageWidth - (margin * 2);

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition = pageHeight - margin;
            let pageNumber = 1;

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

                page.drawText("Documentos Por Cobrar Vencidos", {
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
                    pageNumber++;
                    drawHeader(currentPage);
                }
            };

            drawHeader(currentPage);

            // COLUMNAS DETALLE (Emision, Vencimiento, Documento, Nro Doc, M, Provision, Amortizacion, Saldo S/., Saldo US$)
            const cols = [50, 50, 40, 60, 20, 50, 50, 60, 60];
            const drawRow = (texts: string[], isBold: boolean, y: number, fontToUse: any) => {
                let currentX = margin;
                texts.forEach((text, i) => {
                    const isNumber = i >= 5; // Alinear a la derecha los números
                    let textX = currentX;
                    if (isNumber) textX = currentX + cols[i] - fontToUse.widthOfTextAtSize(text, 8) - 5;
                    currentPage.drawText(text, { x: textX, y, size: 8, font: fontToUse });
                    currentX += cols[i];
                });
            };

            for (const vendedor of data) {
                checkPageBreak(30);

                // TITULO VENDEDOR
                currentPage.drawText(vendedor.Vendedor, { x: margin, y: yPosition, size: 11, font: boldFont, color: rgb(0.1, 0.2, 0.6) });
                yPosition -= 20;

                for (const zona of vendedor.zonas) {
                    checkPageBreak(40);

                    // TITULO ZONA
                    currentPage.drawText(`Zona: ${zona.NombreZona}`, { x: margin, y: yPosition, size: 10, font: boldFont });
                    yPosition -= 15;

                    for (const cliente of zona.clientes) {
                        checkPageBreak(60);

                        // DATOS CLIENTE (Estilo del requerimiento)
                        currentPage.drawText(`Dirección: ${cliente.Direccion || '-'}`, { x: margin, y: yPosition, size: 8, font });
                        yPosition -= 12;
                        currentPage.drawText(`Zona: ${zona.NombreZona}      Telefono: ${cliente.Telefono || ''}`, { x: margin, y: yPosition, size: 8, font });
                        yPosition -= 12;
                        currentPage.drawText(`Cliente: ${cliente.Cliente}`, { x: margin, y: yPosition, size: 8, font: boldFont });
                        yPosition -= 15;

                        // CABECERA DOCUMENTOS
                        drawRow(["Emisión", "Vencimiento", "Doc", "Nro Doc", "M", "Provisión", "Amortiza", "Saldo S/.", "Saldo US$"], true, yPosition, boldFont);
                        yPosition -= 12;

                        // ITERAR DOCUMENTOS
                        for (const doc of cliente.documentos) {
                            checkPageBreak(15);
                            drawRow([
                                formatDateToDDMMYYYY(doc.Fecha_Emision),
                                formatDateToDDMMYYYY(doc.Fecha_Vcto),
                                doc.Abreviatura,
                                doc.Serie_Numero,
                                doc.Simbolo === 'S/.' ? 'S/.' : 'US$',
                                formatMoney(doc.Provision),
                                formatMoney(doc.Amortizacion),
                                formatMoney(doc.Saldo_Soles),
                                formatMoney(doc.Saldo_Dolares)
                            ], false, yPosition, font);
                            yPosition -= 12;
                        }

                        // TOTAL CLIENTE
                        checkPageBreak(15);
                        const txtSoles = formatMoney(cliente.totalSolesCliente);
                        const txtDolares = formatMoney(cliente.totalDolaresCliente);

                        // Dibujar los totales alineados a las últimas dos columnas
                        let startX = margin + cols[0]+cols[1]+cols[2]+cols[3]+cols[4]+cols[5]+cols[6];
                        currentPage.drawText(txtSoles, { x: startX + cols[7] - boldFont.widthOfTextAtSize(txtSoles, 8) - 5, y: yPosition, size: 8, font: boldFont });
                        currentPage.drawText(txtDolares, { x: startX + cols[7] + cols[8] - boldFont.widthOfTextAtSize(txtDolares, 8) - 5, y: yPosition, size: 8, font: boldFont });

                        yPosition -= 15;
                    }

                    // TOTAL ZONA
                    checkPageBreak(20);
                    currentPage.drawText(`TOTAL ZONA ${zona.NombreZona}:`, { x: margin + 150, y: yPosition, size: 9, font: boldFont, color: rgb(0.2, 0.4, 0.2) });
                    const txtZonaS = formatMoney(zona.totalSolesZona);
                    let stXZona = margin + cols[0]+cols[1]+cols[2]+cols[3]+cols[4]+cols[5]+cols[6];
                    currentPage.drawText(txtZonaS, { x: stXZona + cols[7] - boldFont.widthOfTextAtSize(txtZonaS, 9) - 5, y: yPosition, size: 9, font: boldFont, color: rgb(0.2, 0.4, 0.2) });
                    yPosition -= 25;
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Saldos-Vencidos-${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();

        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast({ title: "Error", description: "Ocurrió un error al generar el PDF.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" className="bg-white shadow-sm" onClick={generatePdf} disabled={loading || disabled}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};