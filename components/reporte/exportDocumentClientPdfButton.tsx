import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toast } from "@/hooks/use-toast";
import { Zone } from '@/interface/report/report-interface';
import { calcularTotalWithAmortizacion } from '@/utils/client';

interface ExportPdfProps {
    data: Zone[];
    disabled?: boolean;
}

const ExportDocumentClientPdfButton: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const day = date.getUTCDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
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

            // Formato Vertical A4
            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const margin = 40;
            const contentWidth = pageWidth - (margin * 2);

            let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            let yPosition = pageHeight - margin;
            let pageNumber = 1;

            // Logo
            let logoImage = null;
            try {
                const logoUrl = '/difar-logo.png'; // <- Ajusta la ruta a tu logo
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

                page.drawText("REPORTE DE DOCUMENTOS POR CLIENTE", {
                    x: titleXPos,
                    y: pageHeight - margin - 15,
                    size: 10,
                    font,
                    color: rgb(0.3, 0.3, 0.3),
                });

                const now = new Date();
                const dateText = `Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
                const pageText = `Página: ${pageNumber}`;

                page.drawText(dateText, {
                    x: pageWidth - margin - font.widthOfTextAtSize(dateText, 8),
                    y: pageHeight - margin,
                    size: 8,
                    font,
                });

                page.drawText(pageText, {
                    x: pageWidth - margin - font.widthOfTextAtSize(pageText, 8),
                    y: pageHeight - margin - 12,
                    size: 8,
                    font,
                });

                yPosition = pageHeight - margin - 40;

                page.drawLine({
                    start: { x: margin, y: yPosition },
                    end: { x: pageWidth - margin, y: yPosition },
                    thickness: 1,
                    color: rgb(0, 0, 0),
                });

                yPosition -= 20;
            };

            const checkPageBreak = (neededHeight: number) => {
                if (yPosition - neededHeight < margin) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    pageNumber++;
                    drawHeader(currentPage);
                    return true;
                }
                return false;
            };

            drawHeader(currentPage);

            for (const zone of data) {
                checkPageBreak(30);

                currentPage.drawRectangle({
                    x: margin,
                    y: yPosition - 10,
                    width: contentWidth,
                    height: 20,
                    color: rgb(0.3, 0.3, 0.8),
                });

                currentPage.drawText(`Vendedor: ${zone.CodVend} - ${zone.nomVend}`, {
                    x: margin + 5,
                    y: yPosition - 5,
                    size: 10,
                    font: boldFont,
                    color: rgb(1, 1, 1),
                });

                yPosition -= 30;

                if (!zone.document_dislab || zone.document_dislab.length === 0) {
                    currentPage.drawText("No hay registros en esta zona", {
                        x: margin + 10,
                        y: yPosition,
                        size: 9,
                        font,
                        color: rgb(0.5, 0.5, 0.5),
                    });
                    yPosition -= 20;
                    continue;
                }

                for (const client of zone.document_dislab) {
                    checkPageBreak(40);

                    const totalClient = calcularTotalWithAmortizacion(client.boddy);

                    // Nombre Cliente
                    currentPage.drawText(String(client.head.NombreComercial || client.head.Cod_Clie), {
                        x: margin,
                        y: yPosition,
                        size: 9,
                        font: boldFont,
                    });

                    // Zona del Cliente
                    currentPage.drawText(`Zona: ${client.head.Nombre}`, {
                        x: margin,
                        y: yPosition - 10,
                        size: 8,
                        font,
                        color: rgb(0.4, 0.4, 0.4),
                    });

                    // Total
                    const totalText = `Saldo Total: S/ ${totalClient.toFixed(2)}`;
                    currentPage.drawText(totalText, {
                        x: pageWidth - margin - boldFont.widthOfTextAtSize(totalText, 9),
                        y: yPosition,
                        size: 9,
                        font: boldFont,
                        color: rgb(0.1, 0.5, 0.1),
                    });

                    yPosition -= 25;

                    if (client.boddy && client.boddy.length > 0) {
                        checkPageBreak(30);

                        // Anchos de columnas ajustados (Suman ~515)
                        const colWidths = [55, 55, 55, 35, 45, 65, 40, 80, 80];
                        const colHeaders = ["F. Emisión", "F. Vcto", "F. Amort.", "Abre", "Serie", "Nro. Doc", "Mon.", "Provisión", "Amortización"];

                        let xPos = margin + 5;

                        currentPage.drawRectangle({
                            x: margin + 2,
                            y: yPosition - 2,
                            width: contentWidth - 4,
                            height: 12,
                            color: rgb(0.95, 0.95, 0.95),
                        });

                        colHeaders.forEach((header, i) => {
                            // Alinear a la derecha Provisión(7) y Amortización(8)
                            const isRightAligned = i === 7 || i === 8;
                            let textX = xPos;

                            if (isRightAligned) {
                                textX = xPos + colWidths[i] - boldFont.widthOfTextAtSize(header, 6.5) - 5;
                            }

                            currentPage.drawText(header, {
                                x: textX,
                                y: yPosition,
                                size: 6.5,
                                font: boldFont,
                            });
                            xPos += colWidths[i];
                        });

                        yPosition -= 15;

                        for (const invoice of client.boddy) {
                            checkPageBreak(15);
                            xPos = margin + 5;

                            const rowData = [
                                formatDateToDDMMYYYY(invoice.Fecha_Emision),
                                formatDateToDDMMYYYY(invoice.Fecha_Vcto),
                                invoice.Date_Amortizacion || "-",
                                invoice.Abre_Doc || "-",
                                invoice.SerieDoc || "-",
                                invoice.NumeroDoc || "-",
                                invoice.Tipo_Moneda || "-",
                                invoice.Provision ? Number(invoice.Provision).toFixed(2) : "-",
                                invoice.Amortizacion ? Number(invoice.Amortizacion).toFixed(2) : "-"
                            ];

                            rowData.forEach((text, i) => {
                                const isRightAligned = i === 7 || i === 8;
                                let textX = xPos;

                                if (isRightAligned && text !== "-") {
                                    textX = xPos + colWidths[i] - font.widthOfTextAtSize(String(text), 6.5) - 5;
                                }

                                currentPage.drawText(String(text), {
                                    x: textX,
                                    y: yPosition,
                                    size: 6.5,
                                    font,
                                });
                                xPos += colWidths[i];
                            });

                            currentPage.drawLine({
                                start: { x: margin + 5, y: yPosition - 5 },
                                end: { x: pageWidth - margin - 5, y: yPosition - 5 },
                                thickness: 0.5,
                                color: rgb(0.9, 0.9, 0.9),
                            });

                            yPosition -= 15;
                        }
                    }

                    yPosition -= 10;
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Doc-Clientes-${new Date().toISOString().split('T')[0]}.pdf`;
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
            variant="outline"
            className="w-full sm:w-auto bg-transparent"
            onClick={generatePdf}
            disabled={loading || disabled}
        >
            <Download className="mr-2 h-4 w-4" />
            {loading ? "Generando..." : "Exportar PDF"}
        </Button>
    );
};

export default ExportDocumentClientPdfButton;