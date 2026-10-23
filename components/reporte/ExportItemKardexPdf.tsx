import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { StandardFonts, rgb } from 'pdf-lib';
import { cargarLogoPdf, dibujarCabeceraPdf } from "@/components/reporte/pdfCabecera";
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from "@/components/reporte/pdfOpciones";
import { PdfVistaPreviaDialog } from "@/components/reporte/PdfVistaPreviaDialog";
import { toast } from "@/app/hooks/useToast";

export interface KardexItemData {
    IdArticulo: number;
    Codigo_Art: string;
    NombreItem: string;
    Fecha_Mvto: string;
    SumaDeCantidad_Ing: number;
    SumaDeCantidad_Sal: number;
    SumaDeSaldo: number;
    AbrevUnidMed: string;
    OPERACION: string;
    SerieNumero: string;
    DescripcionTipoExistencia: string;
    Abreviatura: string;
    formula_ab: string | null;
    UndCostos?: string | null;
}

interface ExportPdfProps {
    data: KardexItemData[];
    startDate: Date;
    endDate: Date;
    disabled?: boolean;
}

export const ExportItemKardexPdf: React.FC<ExportPdfProps> = ({ data, startDate, endDate, disabled = false }) => {
    const [abierto, setAbierto] = useState(false);
    const DEFECTO: OpcionesPdfReporte = { titulo: "REGISTRO DE INVENTARIO PERMANENTE EN UNIDADES FISICAS", nota: '', color: '#333333', tamanoLetra: 'normal' };

    const formatNumber = (amount: number) => {
        return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatDate = (date: Date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const abrir = () => {
        if (!data || data.length === 0) {
            toast({ title: "Sin datos", description: "No hay datos para exportar", variant: "warning" });
            return;
        }
        setAbierto(true);
    };

    const generar = async (op: OpcionesPdfReporte): Promise<Uint8Array> => {
        const principal = hexARgb(op.color);
        const pdfDoc = await crearPdfReporte(op.tamanoLetra);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);

        let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let yPosition = pageHeight - margin;

        const logoImage = await cargarLogoPdf(pdfDoc);

        const drawHeader = (page: any) => {
            yPosition = dibujarCabeceraPdf({
                page, font, boldFont, logo: logoImage,
                pageWidth, pageHeight, margin,
                subtitulo: op.titulo,
                filtros: op.nota.trim() || undefined,
            });
        };

        const cols = [45, 30, 45, 140, 45, 70, 70, 70];
        const colHeaders = ["Fecha", "Doc.", "Serie Nro.", "Concepto", "Fórmula", "Cant. Ingreso", "Cant. Salida", "Cant. Saldo"];

        const drawTableHeaders = () => {
            const baseItem = data[0];

            const productTxt = `${baseItem.Codigo_Art} - ${baseItem.NombreItem}`;
            const productWidth = boldFont.widthOfTextAtSize(productTxt, 10);
            currentPage.drawText(productTxt, {
                x: (pageWidth - productWidth) / 2,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: rgb(0.1, 0.1, 0.1),
            });
            yPosition -= 14;

            const fechasTxt = `${formatDate(startDate)} - ${formatDate(endDate)}`;
            const fechasWidth = font.widthOfTextAtSize(fechasTxt, 9);
            currentPage.drawText(fechasTxt, {
                x: (pageWidth - fechasWidth) / 2,
                y: yPosition,
                size: 9,
                font,
                color: rgb(0.4, 0.4, 0.4)
            });
            yPosition -= 25;

            currentPage.drawText(`Tipo de Existencia: ${baseItem.DescripcionTipoExistencia || 'Mercadería'}`, { x: margin, y: yPosition, size: 8, font });
            currentPage.drawText(`U.M.: ${baseItem.AbrevUnidMed || 'UND'}`, { x: pageWidth - margin - 80, y: yPosition, size: 8, font });
            yPosition -= 20;

            currentPage.drawText("Unidad de Costos", {
                x: margin,
                y: yPosition,
                size: 8,
                font: boldFont,
                color: rgb(0.3, 0.3, 0.3)
            });
            yPosition -= 14;

            let xPos = margin;
            currentPage.drawRectangle({
                x: margin, y: yPosition - 4, width: contentWidth, height: 16, color: aclarar(principal, 0.88)
            });

            colHeaders.forEach((header, i) => {
                let textX = xPos + 2;
                if (i >= 5) textX = xPos + cols[i] - boldFont.widthOfTextAtSize(header, 8) - 2;
                currentPage.drawText(header, { x: textX, y: yPosition, size: 8, font: boldFont });
                xPos += cols[i];
            });
            yPosition -= 15;
        };

        const checkPageBreak = (needed: number) => {
            if (yPosition - needed < margin) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader(currentPage);
                drawTableHeaders();
            }
        };

        drawHeader(currentPage);
        drawTableHeaders();

        let totalIngreso = 0;
        let totalSalida = 0;

        for (const row of data) {
            checkPageBreak(15);
            let xPos = margin;

            totalIngreso += Number(row.SumaDeCantidad_Ing) || 0;
            totalSalida += Number(row.SumaDeCantidad_Sal) || 0;

            const fechaFormateada = row.Fecha_Mvto ? row.Fecha_Mvto.substring(0, 10) : '-';

            const rowData = [
                fechaFormateada.split('-').reverse().join('/'),
                row.Abreviatura || '-',
                row.SerieNumero || '-',
                row.OPERACION || '-',
                row.formula_ab || '-',
                formatNumber(row.SumaDeCantidad_Ing),
                formatNumber(row.SumaDeCantidad_Sal),
                formatNumber(row.SumaDeSaldo)
            ];

            rowData.forEach((text, i) => {
                let textX = xPos + 2;
                if (i >= 5) textX = xPos + cols[i] - font.widthOfTextAtSize(text, 7) - 2;

                let displayText = text;
                if (i === 3) {
                    const maxW = cols[i] - 4;
                    if (font.widthOfTextAtSize(displayText, 7) > maxW) {
                        displayText = displayText.substring(0, 32) + "...";
                    }
                }

                currentPage.drawText(displayText, { x: textX, y: yPosition, size: 7, font });
                xPos += cols[i];
            });

            currentPage.drawLine({
                start: { x: margin, y: yPosition - 5 },
                end: { x: pageWidth - margin, y: yPosition - 5 },
                thickness: 0.5, color: rgb(0.9, 0.9, 0.9)
            });

            yPosition -= 12;
        }

        checkPageBreak(25);
        yPosition -= 5;
        currentPage.drawRectangle({
            x: margin, y: yPosition - 4, width: contentWidth, height: 16, color: aclarar(principal, 0.94)
        });

        const lblTotal = "TOTAL ARTICULO:";
        const xOffsetTotales = margin + cols[0] + cols[1] + cols[2] + cols[3] + cols[4];

        currentPage.drawText(lblTotal, { x: xOffsetTotales - boldFont.widthOfTextAtSize(lblTotal, 8) - 10, y: yPosition, size: 8, font: boldFont, color: rgb(0.1, 0.5, 0.1) });

        const txtTotIng = formatNumber(totalIngreso);
        const txtTotSal = formatNumber(totalSalida);

        currentPage.drawText(txtTotIng, { x: xOffsetTotales + cols[5] - boldFont.widthOfTextAtSize(txtTotIng, 8) - 2, y: yPosition, size: 8, font: boldFont, color: rgb(0.1, 0.5, 0.1) });
        currentPage.drawText(txtTotSal, { x: xOffsetTotales + cols[5] + cols[6] - boldFont.widthOfTextAtSize(txtTotSal, 8) - 2, y: yPosition, size: 8, font: boldFont, color: rgb(0.1, 0.5, 0.1) });

        return pdfDoc.save();
    };

    return (
        <>
            <Button variant="outline" className="bg-background shadow-sm w-full sm:w-auto" onClick={abrir} disabled={disabled}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
            </Button>
            <PdfVistaPreviaDialog
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo="Kardex del ítem"
                defecto={DEFECTO}
                archivoDefecto={`Kardex-${data?.[0]?.Codigo_Art ?? ""}-${new Date().toISOString().split("T")[0]}`}
                generar={generar}
            />
        </>
    );
};