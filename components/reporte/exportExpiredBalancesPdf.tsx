import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/app/hooks/use-toast";
import { VendedorVencido } from "@/app/types/report-types";

interface ExportPdfProps {
    data: VendedorVencido[];
    disabled?: boolean;
}

export const ExportExpiredBalancesPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    // NUEVA FUNCIÓN: Limpia saltos de línea y retornos de carro que rompen pdf-lib
    const sanitizeText = (text: any): string => {
        if (!text) return '';
        // Reemplaza \r, \n y tabulaciones por un espacio en blanco
        return String(text).replace(/[\r\n\t]+/g, ' ').trim();
    };

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

    const calcDiasVencidos = (fechaVcto: string): number => {
        if (!fechaVcto) return 0
        try {
            const today = new Date()
            const vcto  = new Date(fechaVcto)
            if (isNaN(vcto.getTime())) return 0
            return Math.max(0, Math.floor((today.getTime() - vcto.getTime()) / 86_400_000))
        } catch { return 0 }
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

            // Paleta de colores (Diseño Moderno)
            const colors = {
                primary: rgb(0.12, 0.28, 0.49),
                secondary: rgb(0.93, 0.95, 0.98),
                zebra: rgb(0.97, 0.97, 0.97),
                textDark: rgb(0.15, 0.15, 0.15),
                textMuted: rgb(0.4, 0.4, 0.4),
                border: rgb(0.8, 0.8, 0.8),
                danger: rgb(0.75, 0.1, 0.1)
            };

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
                    const logoWidth = 60;
                    const logoHeight = 25;
                    page.drawImage(logoImage, {
                        x: margin,
                        y: pageHeight - margin - logoHeight + 5,
                        width: logoWidth,
                        height: logoHeight,
                    });
                    titleXPos = margin + logoWidth + 15;
                }

                page.drawText("DROGUERÍA DIFAR", {
                    x: titleXPos,
                    y: pageHeight - margin - 5,
                    size: 14,
                    font: boldFont,
                    color: colors.primary,
                });

                page.drawText("REPORTE DE SALDOS POR COBRAR VENCIDOS", {
                    x: titleXPos,
                    y: pageHeight - margin - 18,
                    size: 9,
                    font,
                    color: colors.textMuted,
                });

                const dateText = `Impreso el: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
                page.drawText(dateText, {
                    x: pageWidth - margin - font.widthOfTextAtSize(dateText, 8),
                    y: pageHeight - margin - 5,
                    size: 8,
                    font,
                    color: colors.textMuted
                });

                yPosition = pageHeight - margin - 40;
                page.drawLine({ start: { x: margin, y: yPosition }, end: { x: pageWidth - margin, y: yPosition }, thickness: 1, color: colors.border });
                yPosition -= 20;
            };

            const checkPageBreak = (needed: number) => {
                if (yPosition - needed < margin + 20) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader(currentPage);
                }
            };

            drawHeader(currentPage);

            const cols = [
                { name: "Emisión",    w: 46, align: 'left'   },
                { name: "Vcto.",      w: 46, align: 'left'   },
                { name: "Días Vcdo.", w: 36, align: 'center' },
                { name: "Doc",        w: 30, align: 'center' },
                { name: "Nro Doc",    w: 70, align: 'left'   },
                { name: "Mon",        w: 22, align: 'center' },
                { name: "Provisión",  w: 61, align: 'right'  },
                { name: "Amortiza",   w: 61, align: 'right'  },
                { name: "Saldo S/.",  w: 72, align: 'right'  },
                { name: "Saldo US$",  w: 71, align: 'right'  },
            ];

            const drawRow = (data: string[], y: number, isHeader = false, isZebra = false) => {
                if (isHeader) {
                    currentPage.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 14, color: colors.secondary });
                } else if (isZebra) {
                    currentPage.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 14, color: colors.zebra });
                }

                let currentX = margin;
                const activeFont = isHeader ? boldFont : font;
                const fontSize = 8;
                const fontColor = isHeader ? colors.primary : colors.textDark;

                data.forEach((text, i) => {
                    const col = cols[i];
                    let textX = currentX + 3;
                    const cleanText = sanitizeText(text); // Limpiamos el texto antes de medirlo/dibujarlo
                    const textWidth = activeFont.widthOfTextAtSize(cleanText, fontSize);

                    if (col.align === 'right') {
                        textX = currentX + col.w - textWidth - 3;
                    } else if (col.align === 'center') {
                        textX = currentX + (col.w - textWidth) / 2;
                    }

                    currentPage.drawText(cleanText, { x: textX, y, size: fontSize, font: activeFont, color: fontColor });
                    currentX += col.w;
                });
            };

            for (const vendedor of data) {
                checkPageBreak(35);

                const vendName  = sanitizeText(`VENDEDOR: ${vendedor.Vendedor.toUpperCase()}`);
                const vendTotal = `S/. ${formatMoney(vendedor.totalSolesVendedor)}`;
                currentPage.drawRectangle({ x: margin, y: yPosition - 5, width: contentWidth, height: 18, color: colors.primary });
                currentPage.drawText(vendName, { x: margin + 8, y: yPosition, size: 10, font: boldFont, color: rgb(1, 1, 1) });
                currentPage.drawText(vendTotal, {
                    x: pageWidth - margin - boldFont.widthOfTextAtSize(vendTotal, 9) - 6,
                    y: yPosition,
                    size: 9, font: boldFont, color: rgb(1, 1, 0.6),
                });
                yPosition -= 25;

                for (const zona of vendedor.zonas) {
                    checkPageBreak(35);

                    const zonaName = sanitizeText(`ZONA: ${zona.NombreZona}`);
                    currentPage.drawText(zonaName, { x: margin + 5, y: yPosition, size: 9, font: boldFont, color: colors.textDark });
                    currentPage.drawLine({ start: { x: margin, y: yPosition - 4 }, end: { x: margin + 200, y: yPosition - 4 }, thickness: 1, color: colors.primary });
                    yPosition -= 20;

                    for (const cliente of zona.clientes) {
                        checkPageBreak(65);

                        const clienteName = sanitizeText(cliente.Cliente);
                        currentPage.drawText(clienteName, { x: margin, y: yPosition, size: 9, font: boldFont, color: colors.textDark });
                        yPosition -= 12;

                        const rawDir = sanitizeText(cliente.Direccion || '-');
                        const dirText = `Dir: ${rawDir.length > 80 ? rawDir.substring(0,80) + '...' : rawDir}`;
                        const telText = sanitizeText(`Tel: ${cliente.Telefono || 'N/A'}`);

                        currentPage.drawText(dirText, { x: margin, y: yPosition, size: 7, font, color: colors.textMuted });
                        currentPage.drawText(telText, {
                            x: pageWidth - margin - font.widthOfTextAtSize(telText, 7), y: yPosition, size: 7, font, color: colors.textMuted
                        });
                        yPosition -= 14;

                        const headers = cols.map(c => c.name);
                        drawRow(headers, yPosition, true);
                        yPosition -= 14;

                        let isZebra = false;
                        for (const doc of cliente.documentos) {
                            checkPageBreak(15);
                            const dias = calcDiasVencidos(doc.Fecha_Vcto);
                            drawRow([
                                formatDateToDDMMYYYY(doc.Fecha_Emision),
                                formatDateToDDMMYYYY(doc.Fecha_Vcto),
                                dias > 0 ? `${dias}d` : '—',
                                sanitizeText(doc.Abreviatura),
                                sanitizeText(doc.Serie_Numero),
                                sanitizeText(doc.Simbolo) === 'S/.' ? 'S/.' : 'US$',
                                formatMoney(doc.Provision),
                                formatMoney(doc.Amortizacion),
                                formatMoney(doc.Saldo_Soles),
                                formatMoney(doc.Saldo_Dolares)
                            ], yPosition, false, isZebra);

                            isZebra = !isZebra;
                            yPosition -= 14;
                        }

                        checkPageBreak(20);
                        yPosition -= 2;
                        // startX apunta al inicio de col "Saldo S/." (índice 8 en la nueva tabla)
                        let startX = margin;
                        for (let ci = 0; ci < 8; ci++) startX += cols[ci].w;

                        currentPage.drawLine({ start: { x: margin + 300, y: yPosition + 10 }, end: { x: pageWidth - margin, y: yPosition + 10 }, thickness: 0.5, color: colors.border });

                        const txtTotalCl = "TOTAL CLIENTE:";
                        const txtSoles   = formatMoney(cliente.totalSolesCliente);
                        const txtDolares = formatMoney(cliente.totalDolaresCliente);

                        currentPage.drawText(txtTotalCl, { x: startX - boldFont.widthOfTextAtSize(txtTotalCl, 8) - 10, y: yPosition, size: 8, font: boldFont });
                        currentPage.drawText(txtSoles,   { x: startX + cols[8].w - boldFont.widthOfTextAtSize(txtSoles, 8) - 3,   y: yPosition, size: 8, font: boldFont, color: colors.danger });
                        currentPage.drawText(txtDolares, { x: startX + cols[8].w + cols[9].w - boldFont.widthOfTextAtSize(txtDolares, 8) - 3, y: yPosition, size: 8, font: boldFont, color: colors.danger });

                        yPosition -= 25;
                    }

                    checkPageBreak(25);
                    const txtTotalZn = sanitizeText(`TOTAL ${zona.NombreZona.toUpperCase()}:`);
                    const txtZonaS   = formatMoney(zona.totalSolesZona);

                    currentPage.drawRectangle({ x: margin + 250, y: yPosition - 4, width: contentWidth - 250, height: 14, color: colors.zebra });

                    // startX apunta al inicio de col "Saldo S/." (índice 8)
                    let stXZona = margin;
                    for (let ci = 0; ci < 8; ci++) stXZona += cols[ci].w;

                    currentPage.drawText(txtTotalZn, { x: stXZona - boldFont.widthOfTextAtSize(txtTotalZn, 9) - 10, y: yPosition, size: 9, font: boldFont, color: colors.primary });
                    currentPage.drawText(txtZonaS,   { x: stXZona + cols[8].w - boldFont.widthOfTextAtSize(txtZonaS, 9) - 3,   y: yPosition, size: 9, font: boldFont, color: colors.primary });

                    yPosition -= 35;
                }

            }

            const pages = pdfDoc.getPages();
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const text = `Página ${i + 1} de ${pages.length}`;
                page.drawText(text, { x: pageWidth / 2 - font.widthOfTextAtSize(text, 8) / 2, y: 20, size: 8, font, color: colors.textMuted });
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
        <Button variant="outline" className="bg-white shadow-sm hover:bg-slate-50 border-slate-200" onClick={generatePdf} disabled={loading || disabled}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {loading ? "Generando PDF..." : "Exportar PDF"}
        </Button>
    );
};