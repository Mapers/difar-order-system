import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { cargarLogoPdf, dibujarCabeceraPdf } from "@/components/reporte/pdfCabecera";
import { toast } from "@/app/hooks/useToast";
import { Zone } from '@/app/types/report/report-interface';
import { calcularTotal } from '@/app/utils/client';

interface ExportPdfProps {
    data: Zone[];
    disabled?: boolean;
}

const ExportCollectClientPdfButton: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [loading, setLoading] = useState(false);

    // Funciones de formateo
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

            // Logo
            const logoImage = await cargarLogoPdf(pdfDoc);

            const drawHeader = (page: any) => {
                yPosition = dibujarCabeceraPdf({
                    page, font, boldFont, logo: logoImage,
                    pageWidth, pageHeight, margin,
                    subtitulo: "REPORTE DE COBRANZAS POR CLIENTE",
                });
            };

            const checkPageBreak = (neededHeight: number) => {
                if (yPosition - neededHeight < margin) {
                    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                    drawHeader(currentPage);
                    return true;
                }
                return false;
            };

            drawHeader(currentPage);

            // --- ITERACIÓN PRINCIPAL ---
            for (const zone of data) {
                checkPageBreak(30);

                // Header Vendedor/Zona
                currentPage.drawRectangle({
                    x: margin,
                    y: yPosition - 10,
                    width: contentWidth,
                    height: 20,
                    color: rgb(0.3, 0.3, 0.8), // Indigo similar a tu UI
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
                    currentPage.drawText("No hay cliente-cobranza en esta zona", {
                        x: margin + 10,
                        y: yPosition,
                        size: 9,
                        font,
                        color: rgb(0.5, 0.5, 0.5),
                    });
                    yPosition -= 20;
                    continue;
                }

                // Iterar Clientes de la zona
                for (const client of zone.document_dislab) {
                    checkPageBreak(40);

                    const totalClient = calcularTotal(client.boddy);

                    // Nombre del Cliente
                    currentPage.drawText(client.head.NombreComercial || client.head.Nombre, {
                        x: margin,
                        y: yPosition,
                        size: 9,
                        font: boldFont,
                    });

                    // Razón Social
                    currentPage.drawText(`Cliente: ${client.head.Nombre}`, {
                        x: margin,
                        y: yPosition - 10,
                        size: 8,
                        font,
                        color: rgb(0.4, 0.4, 0.4),
                    });

                    // Total Cliente
                    const totalText = `Saldo Total: S/ ${totalClient.toFixed(2)}`;
                    currentPage.drawText(totalText, {
                        x: pageWidth - margin - boldFont.widthOfTextAtSize(totalText, 9),
                        y: yPosition,
                        size: 9,
                        font: boldFont,
                        color: rgb(0.1, 0.5, 0.1), // Verde
                    });

                    yPosition -= 25;

                    // Si hay facturas, dibujar tabla
                    if (client.boddy && client.boddy.length > 0) {
                        checkPageBreak(30); // Espacio para cabecera de tabla

                        // Anchos de columnas de facturas (Total: contentWidth = ~515)
                        const colWidths = [60, 60, 50, 60, 80, 50, 70];
                        const colHeaders = ["F. Emisión", "F. Vcto", "Abre", "Serie", "Nro. Doc", "Moneda", "Saldo"];

                        let xPos = margin + 10; // Un poco indentado

                        // Dibujar fondo cabecera tabla
                        currentPage.drawRectangle({
                            x: margin + 8,
                            y: yPosition - 2,
                            width: contentWidth - 16,
                            height: 12,
                            color: rgb(0.95, 0.95, 0.95),
                        });

                        // Textos Cabecera tabla
                        colHeaders.forEach((header, i) => {
                            // Alinear Saldo a la derecha
                            const isRightAligned = i === 6;
                            let textX = xPos;

                            if (isRightAligned) {
                                textX = xPos + colWidths[i] - boldFont.widthOfTextAtSize(header, 7) - 5;
                            }

                            currentPage.drawText(header, {
                                x: textX,
                                y: yPosition,
                                size: 7,
                                font: boldFont,
                            });
                            xPos += colWidths[i];
                        });

                        yPosition -= 15;

                        // Filas de Facturas
                        for (const invoice of client.boddy) {
                            checkPageBreak(15);
                            xPos = margin + 10;

                            const rowData = [
                                formatDateToDDMMYYYY(invoice.Fecha_Emision),
                                formatDateToDDMMYYYY(invoice.Fecha_Vcto),
                                invoice.Abre_Doc || "-",
                                invoice.SerieDoc || "-",
                                invoice.NumeroDoc || "-",
                                invoice.Tipo_Moneda || "-",
                                invoice.saldoDoc ? Number(invoice.saldoDoc).toFixed(2) : "-"
                            ];

                            rowData.forEach((text, i) => {
                                const isRightAligned = i === 6;
                                let textX = xPos;

                                if (isRightAligned) {
                                    textX = xPos + colWidths[i] - font.widthOfTextAtSize(String(text), 7) - 5;
                                }

                                currentPage.drawText(String(text), {
                                    x: textX,
                                    y: yPosition,
                                    size: 7,
                                    font,
                                });
                                xPos += colWidths[i];
                            });

                            // Línea separadora de facturas
                            currentPage.drawLine({
                                start: { x: margin + 10, y: yPosition - 5 },
                                end: { x: pageWidth - margin - 10, y: yPosition - 5 },
                                thickness: 0.5,
                                color: rgb(0.9, 0.9, 0.9),
                            });

                            yPosition -= 15;
                        }
                    }

                    yPosition -= 10; // Espacio extra entre cliente-cobranza
                }
            }

            // Numeración al pie. Antes iba en la cabecera de cada página; al
            // unificar la cabecera se movió acá, que es donde la ponen los
            // demás reportes.
            const paginas = pdfDoc.getPages();
            paginas.forEach((pg, idx) => {
                const txt = `Página ${idx + 1} de ${paginas.length}`;
                pg.drawText(txt, {
                    x: pageWidth - margin - font.widthOfTextAtSize(txt, 8),
                    y: margin / 2, size: 8, font, color: rgb(0.5, 0.5, 0.5),
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = `Reporte-Cobranzas-${new Date().toISOString().split('T')[0]}.pdf`;
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

export default ExportCollectClientPdfButton;