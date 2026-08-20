import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { cargarLogoPdf, dibujarCabeceraPdf } from "@/components/reporte/pdfCabecera";
import { toast } from "@/app/hooks/useToast";
import { formatDocumentoConTipo, formatFechaEmision, TotalesProductos } from "@/components/reporte/detalleLabVendedorShared";
import { capPctCuota, estadoCuota, hexEstado, sinIgv } from "@/app/utils/cuotas-helpers";

interface ProductoAgrupado {
    Codigo_Art: string;
    NombreItem: string;
    AbrevUnidMed: string;
    TotalCantidad: number;
    TotalVentas: number;
    cuotaCant?: number;
    cuotaSoles?: number;
    /** null = no hay cuota contra la cual medir. Distinto de 0. */
    pct?: number | null;
    restante?: number | null;
    sinVentas?: boolean;
}

interface ExportPdfProps {
    data: any;
    viewMode: 'laboratorios' | 'productos';
    productData?: ProductoAgrupado[];
    /** Estado del switch de la pantalla: el archivo tiene que coincidir. */
    quitarIgv?: boolean;
    /** Totales de la vista de productos, calculados en la página. */
    totales?: TotalesProductos;
    disabled?: boolean;
}

export const ExportDetalleLabVendedorPdf: React.FC<ExportPdfProps> = ({
    data,
    viewMode,
    productData = [],
    quitarIgv = false,
    totales,
    disabled = false
}) => {
    const [loading, setLoading] = useState(false);

    // El switch de IGV divide montos, nunca cantidades ni porcentajes.
    const money = (n: number) => quitarIgv ? sinIgv(Number(n)) : Number(n);

    const textoPct = (pct: number | null | undefined): string =>
        pct === null || pct === undefined ? '-' : `${capPctCuota(pct)!.toFixed(2)}%`;

    const colorPct = (pct: number | null | undefined) => {
        const hex = hexEstado[estadoCuota(pct ?? null)];
        const n = parseInt(hex.slice(1), 16);
        return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    };

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

            const logoImage = await cargarLogoPdf(pdfDoc);

            const vendData = data[0];
            const labData = vendData.Laboratorios[0];

            const drawPageHeader = (page: any, isFirst: boolean) => {
                if (isFirst) {
                    // El laboratorio, el periodo y el vendedor eran cuatro
                    // líneas sueltas bajo el título; ahora entran en los huecos
                    // que la cabecera común ya tiene reservados.
                    const titulo = viewMode === 'laboratorios'
                        ? 'Ventas por Vendedor — Detalle por Laboratorio'
                        : 'Ventas por Vendedor — Resumen por Productos';

                    yPosition = dibujarCabeceraPdf({
                        page, font, boldFont, logo: logoImage,
                        pageWidth, pageHeight, margin,
                        subtitulo: titulo,
                        infoDerecha: `${vendData.Mes}, ${vendData.Año}`,
                        filtros: `${labData.Laboratorio}   |   Vendedor: ${vendData.Vendedor}`,
                    });
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
                // Encabezado de columnas para productos.
                // La descripción cede ancho para las cuatro columnas de cuota;
                // el nombre se recorta más corto para compensar.
                const colWidths = [50, 140, 30, 48, 60, 48, 60, 50, 45];
                const colHeaders = ['Cód. Art', 'Descripción', 'U.M.', 'Cant.', 'Total S/.', 'Cuota cant.', 'Cuota S/.', '% Cumpl.', 'Restante'];
                const primeraDerecha = 3;
                let xPos = margin;

                currentPage.drawRectangle({ x: margin, y: yPosition - 2, width: pageWidth - margin * 2, height: 13, color: rgb(0.93, 0.93, 0.95) });
                colHeaders.forEach((h, i) => {
                    const isRight = i >= primeraDerecha;
                    const textW = boldFont.widthOfTextAtSize(h, 7);
                    currentPage.drawText(h, {
                        x: isRight ? xPos + colWidths[i] - textW - 2 : xPos + 2,
                        y: yPosition, size: 7, font: boldFont
                    });
                    xPos += colWidths[i];
                });
                yPosition -= 18;

                for (const prod of productData) {
                    checkPageBreak(14);
                    xPos = margin;
                    const nombre = prod.sinVentas ? `${prod.NombreItem} [sin ventas]` : prod.NombreItem;
                    const desc = nombre.length > 40 ? nombre.substring(0, 40) + '...' : nombre;
                    const rowData = [
                        prod.Codigo_Art,
                        desc,
                        prod.AbrevUnidMed,
                        prod.TotalCantidad.toString(),
                        formatMoney(money(prod.TotalVentas)),
                        Number(prod.cuotaCant || 0) > 0 ? String(prod.cuotaCant) : '-',
                        Number(prod.cuotaSoles || 0) > 0 ? formatMoney(money(Number(prod.cuotaSoles))) : '-',
                        textoPct(prod.pct),
                        prod.restante === null || prod.restante === undefined ? '-' : String(prod.restante),
                    ];

                    rowData.forEach((text, i) => {
                        const isRight = i >= primeraDerecha;
                        const textW = font.widthOfTextAtSize(text, 7);
                        currentPage.drawText(text, {
                            x: isRight ? xPos + colWidths[i] - textW - 2 : xPos + 2,
                            y: yPosition, size: 7, font,
                            color: i === 7 ? colorPct(prod.pct) : rgb(0, 0, 0),
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

                const verde = rgb(0.1, 0.45, 0.1);
                currentPage.drawText('TOTALES:', { x: margin + 2, y: yPosition, size: 8, font: boldFont, color: verde });

                if (totales) {
                    // Cada total alineado al borde derecho de su columna, para
                    // que quede debajo del valor que resume.
                    const celdas: [string, number][] = [
                        [String(totales.cantidad), 3],
                        [formatMoney(money(totales.ventas)), 4],
                        [totales.cuotaCant > 0 ? String(totales.cuotaCant) : '-', 5],
                        [totales.cuotaSoles > 0 ? formatMoney(money(totales.cuotaSoles)) : '-', 6],
                        [textoPct(totales.pct), 7],
                        [String(totales.restante), 8],
                    ];
                    for (const [texto, idx] of celdas) {
                        const bordeDerecho = margin + colWidths.slice(0, idx + 1).reduce((a, c) => a + c, 0);
                        currentPage.drawText(texto, {
                            x: bordeDerecho - boldFont.widthOfTextAtSize(texto, 8) - 2,
                            y: yPosition, size: 8, font: boldFont,
                            color: idx === 7 ? colorPct(totales.pct) : verde,
                        });
                    }
                } else {
                    const tvText = formatMoney(vendData.TotalVendedor);
                    currentPage.drawText(tvText, {
                        x: pageWidth - margin - boldFont.widthOfTextAtSize(tvText, 8),
                        y: yPosition, size: 8, font: boldFont, color: verde
                    });
                }
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
