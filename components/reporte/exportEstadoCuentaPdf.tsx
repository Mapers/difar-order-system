import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { StandardFonts, rgb } from 'pdf-lib';
import { cargarLogoPdf, dibujarCabeceraPdf, truncarPdf } from "@/components/reporte/pdfCabecera";
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from "@/components/reporte/pdfOpciones";
import { PdfVistaPreviaDialog } from "@/components/reporte/PdfVistaPreviaDialog";
import { toast } from "@/app/hooks/useToast";

interface ExportPdfProps {
    data: any;
    disabled?: boolean;
}

export const ExportEstadoCuentaPdf: React.FC<ExportPdfProps> = ({ data, disabled = false }) => {
    const [abierto, setAbierto] = useState(false);
    const DEFECTO: OpcionesPdfReporte = { titulo: "ESTADO DE CUENTA CLIENTE", nota: '', color: '#163161', tamanoLetra: 'normal' };

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatDateStr = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
    };

    const abrir = () => {
        if (!data) return;
        setAbierto(true);
    };

    const generar = async (op: OpcionesPdfReporte): Promise<Uint8Array> => {
        const principal = hexARgb(op.color);
        const suave     = aclarar(principal, 0.9);
        const cebra     = aclarar(principal, 0.96);
        const ROJO      = rgb(0.75, 0.1, 0.1);
        const VERDE     = rgb(0.02, 0.47, 0.34);
        const GRIS      = rgb(0.42, 0.45, 0.5);
        const TEXTO     = rgb(0.12, 0.14, 0.2);
        const BLANCO    = rgb(1, 1, 1);

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

        // Anchos de las siete columnas del detalle (suman el ancho útil).
        const cols = [52, 176, 42, 62, 66, 59, 58];
        const finCol = (i: number) => margin + cols.slice(0, i + 1).reduce((a, b) => a + b, 0);
        const derecha = (texto: string, i: number, y: number, size: number, f: any, color = TEXTO) =>
            currentPage.drawText(texto, { x: finCol(i) - f.widthOfTextAtSize(texto, size) - 5, y, size, font: f, color });
        const centro = (texto: string, i: number, y: number, size: number, f: any, color = TEXTO) =>
            currentPage.drawText(texto, { x: finCol(i) - cols[i] / 2 - f.widthOfTextAtSize(texto, size) / 2, y, size, font: f, color });

        const encabezadoColumnas = () => {
            currentPage.drawRectangle({ x: margin, y: yPosition - 5, width: contentWidth, height: 16, color: principal });
            ["Fecha", "Descripción", "Moneda", "Provisión", "Amortización", "Saldo S/.", "Saldo US$"].forEach((h, i) => {
                if (i >= 3) derecha(h, i, yPosition, 7.5, boldFont, BLANCO);
                else if (i === 2) centro(h, i, yPosition, 7.5, boldFont, BLANCO);
                else currentPage.drawText(h, { x: finCol(i) - cols[i] + 5, y: yPosition, size: 7.5, font: boldFont, color: BLANCO });
            });
            yPosition -= 20;
        };

        const drawHeader = (page: any, isFirstPage: boolean) => {
            yPosition = dibujarCabeceraPdf({
                page, font, boldFont, logo: logoImage,
                pageWidth, pageHeight, margin,
                subtitulo: op.titulo,
                filtros: op.nota.trim() || undefined,
                infoDerecha: `Corte: ${formatDateStr(data.FechaCorte)}`,
                infoDerechaSec: `Impreso: ${new Date().toLocaleDateString('es-PE')}`,
            });

            // Los datos del cliente solo en la primera página: en las
            // siguientes serían ruido que le quita sitio al detalle.
            if (isFirstPage) {
                const alto = 96;
                page.drawRectangle({ x: margin, y: yPosition - alto, width: contentWidth, height: alto, color: aclarar(principal, 0.95), borderColor: aclarar(principal, 0.75), borderWidth: 0.8 });
                page.drawRectangle({ x: margin, y: yPosition - alto, width: 4, height: alto, color: principal });

                const xIzq = margin + 14;
                const xDer = margin + 330;
                const anchoIzq = xDer - xIzq - 10;
                const anchoDer = pageWidth - margin - xDer - 10;

                page.drawText(truncarPdf(data.NombreComercial || data.Cliente || '', anchoIzq + anchoDer, 11, boldFont), {
                    x: xIzq, y: yPosition - 17, size: 11, font: boldFont, color: principal,
                });
                const campo = (etq: string, val: string, x: number, y: number, ancho: number) => {
                    page.drawText(etq, { x, y, size: 6.5, font, color: GRIS });
                    page.drawText(truncarPdf(val || '-', ancho, 8, boldFont), { x, y: y - 10, size: 8, font: boldFont, color: TEXTO });
                };
                campo('RAZÓN SOCIAL', data.Cliente, xIzq, yPosition - 32, anchoIzq);
                campo('RUC / DOCUMENTO', data.RUC, xDer, yPosition - 32, anchoDer);
                campo('DIRECCIÓN', [data.Direccion, data.Distrito].filter(Boolean).join(' - '), xIzq, yPosition - 56, anchoIzq);
                campo('TELÉFONO', data.Telefono, xDer, yPosition - 56, anchoDer);
                campo('VENDEDOR', data.Vendedor, xIzq, yPosition - 80, anchoIzq);
                campo('CORREO', data.Correo, xDer, yPosition - 80, anchoDer);

                yPosition -= alto + 16;
            }

            encabezadoColumnas();
        };

        const checkPageBreak = (needed: number) => {
            if (yPosition - needed < margin + 20) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
                drawHeader(currentPage, false);
            }
        };

        drawHeader(currentPage, true);

        for (const doc of data.Documentos) {
            checkPageBreak(50);

            // Franja del documento
            currentPage.drawRectangle({ x: margin, y: yPosition - 5, width: contentWidth, height: 16, color: suave });
            currentPage.drawText(`${doc.Abreviatura}  ${doc.SerieNumero}`, { x: margin + 5, y: yPosition, size: 8.5, font: boldFont, color: principal });
            const fechas = `Emisión: ${formatDateStr(doc.Emision)}`;
            currentPage.drawText(fechas, { x: margin + 190, y: yPosition, size: 7.5, font, color: TEXTO });
            currentPage.drawText(`Vence: ${formatDateStr(doc.Vencimiento)}`, { x: margin + 300, y: yPosition, size: 7.5, font: boldFont, color: ROJO });
            const saldoDoc = `Saldo: S/ ${formatMoney(doc.SaldoFinalSoles || 0)}`;
            currentPage.drawText(saldoDoc, { x: pageWidth - margin - 5 - boldFont.widthOfTextAtSize(saldoDoc, 7.5), y: yPosition, size: 7.5, font: boldFont, color: principal });
            yPosition -= 16;

            let sumProvision = 0;
            let sumAmortizacion = 0;

            doc.Movimientos.forEach((mov: any, m: number) => {
                checkPageBreak(15);

                sumProvision    += mov.Provision;
                sumAmortizacion += mov.Amortizacion;

                if (m % 2 === 1) {
                    currentPage.drawRectangle({ x: margin, y: yPosition - 4, width: contentWidth, height: 13, color: cebra });
                }
                const isSoles = mov.Moneda === 'S/.' || mov.Moneda === 'NSO';
                currentPage.drawText(formatDateStr(mov.Fecha), { x: margin + 5, y: yPosition, size: 7.5, font, color: TEXTO });
                currentPage.drawText(truncarPdf(mov.Descripcion || '', cols[1] - 10, 7.5, font), { x: finCol(0) + 5, y: yPosition, size: 7.5, font, color: TEXTO });
                centro(String(mov.Moneda ?? ''), 2, yPosition, 7.5, font);
                derecha(formatMoney(mov.Provision), 3, yPosition, 7.5, font);
                derecha(formatMoney(mov.Amortizacion), 4, yPosition, 7.5, font);
                derecha(isSoles ? formatMoney(mov.SaldoSoles) : '0.00', 5, yPosition, 7.5, font);
                derecha(!isSoles ? formatMoney(mov.SaldoDolares) : '0.00', 6, yPosition, 7.5, font);

                yPosition -= 13;
            });

            checkPageBreak(18);

            // Subtotal del documento
            currentPage.drawLine({ start: { x: finCol(2), y: yPosition + 9 }, end: { x: pageWidth - margin, y: yPosition + 9 }, thickness: 0.6, color: aclarar(principal, 0.5) });
            const subTitle = `Saldo ${doc.Abreviatura} ${doc.SerieNumero}`;
            currentPage.drawText(subTitle, { x: finCol(2) - boldFont.widthOfTextAtSize(subTitle, 7.5) - 5, y: yPosition, size: 7.5, font: boldFont, color: TEXTO });
            derecha(formatMoney(sumProvision), 3, yPosition, 7.5, boldFont);
            derecha(formatMoney(sumAmortizacion), 4, yPosition, 7.5, boldFont);
            derecha(formatMoney(doc.SaldoFinalSoles || 0), 5, yPosition, 7.5, boldFont, principal);
            derecha(formatMoney(doc.SaldoFinalDolares || 0), 6, yPosition, 7.5, boldFont, VERDE);

            yPosition -= 22;
        }

        // Saldo del cliente
        checkPageBreak(30);
        currentPage.drawRectangle({ x: margin, y: yPosition - 9, width: contentWidth, height: 22, color: principal });
        currentPage.drawText("SALDO DEL CLIENTE", { x: margin + 8, y: yPosition - 1, size: 9, font: boldFont, color: BLANCO });
        derecha(`S/ ${formatMoney(data.TotalSoles)}`, 5, yPosition - 1, 9, boldFont, BLANCO);
        derecha(`US$ ${formatMoney(data.TotalDolares)}`, 6, yPosition - 1, 9, boldFont, BLANCO);

        const altoCierre = 170;

        if (yPosition - altoCierre < margin + 20) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = dibujarCabeceraPdf({
                page: currentPage, font, boldFont, logo: logoImage,
                pageWidth, pageHeight, margin,
                subtitulo: op.titulo,
                filtros: op.nota.trim() || undefined,
                infoDerechaSec: `Impreso: ${new Date().toLocaleDateString('es-PE')}`,
            });
        } else {
            yPosition -= 40;
        }

        currentPage.drawText("OBSERVACIONES:", {
            x: margin, y: yPosition, size: 8, font: boldFont, color: principal,
        });
        yPosition -= 18;

        for (let i = 0; i < 3; i++) {
            currentPage.drawLine({
                start: { x: margin, y: yPosition },
                end:   { x: pageWidth - margin, y: yPosition },
                thickness: 0.5,
                color: rgb(0.45, 0.45, 0.45),
                dashArray: [1.5, 2],
            });
            yPosition -= 18;
        }

        yPosition -= 22;

        const anchoFirma = 220;
        const altoFirma  = 70;
        const xFirma     = pageWidth - margin - anchoFirma;

        currentPage.drawRectangle({
            x: xFirma, y: yPosition - altoFirma, width: anchoFirma, height: altoFirma,
            borderColor: aclarar(principal, 0.5), borderWidth: 0.6,
        });

        const pieFirma = "FIRMA Y SELLO DEL CLIENTE";
        currentPage.drawText(pieFirma, {
            x: xFirma + (anchoFirma - font.widthOfTextAtSize(pieFirma, 7)) / 2,
            y: yPosition - altoFirma - 12,
            size: 7, font, color: rgb(0.35, 0.35, 0.35),
        });

        const pages = pdfDoc.getPages();
        pages.forEach((page, idx) => {
            const pageNum = `Página ${idx + 1} de ${pages.length}`;
            page.drawText(pageNum, { x: pageWidth - margin - font.widthOfTextAtSize(pageNum, 8), y: margin / 2, size: 8, font, color: GRIS });
            page.drawText(`Estado de cuenta · ${data.RUC ?? ''}`, { x: margin, y: margin / 2, size: 8, font, color: GRIS });
        });

        return pdfDoc.save();
    };

    return (
        <>
            <Button variant="outline" className="bg-background shadow-sm w-full sm:w-auto text-blue-700 border-blue-200 hover:bg-blue-50" onClick={abrir} disabled={disabled}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
            </Button>
            <PdfVistaPreviaDialog
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo="Estado de cuenta cliente"
                defecto={DEFECTO}
                archivoDefecto={`Estado_Cuenta_${data?.RUC ?? ""}_${new Date().toISOString().split('T')[0]}`}
                generar={generar}
            />
        </>
    );
};