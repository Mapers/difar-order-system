import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { StandardFonts, rgb } from 'pdf-lib';
import { cargarLogoPdf, dibujarCabeceraPdf } from "@/components/reporte/pdfCabecera";
import { aclarar, crearPdfReporte, hexARgb, OpcionesPdfReporte } from "@/components/reporte/pdfOpciones";
import { PdfVistaPreviaDialog } from "@/components/reporte/PdfVistaPreviaDialog";
import { toast } from "@/app/hooks/useToast";
import { agruparPorVendedor, esSoles } from "@/app/dashboard/reportes/saldos-cliente/agrupar";

interface ExportPdfProps {
    data: any;
    dateCorte?: Date;
    mes?: number;
    anio?: number;
    disabled?: boolean;
}

export const ExportSaldoCobrarPdf: React.FC<ExportPdfProps> = ({ data, dateCorte, mes, anio, disabled = false }) => {
    const PDF_MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const [abierto, setAbierto] = useState(false);

    const DEFECTO: OpcionesPdfReporte = { titulo: 'SALDO DE DOCUMENTOS POR COBRAR', nota: '', color: '#1a66cc', tamanoLetra: 'normal' };

    const formatMoney = (amount: number) => {
        return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateString = (dateStr: string) => {
        if (!dateStr) return '-';
        // Si ya viene con barras
        if (dateStr.includes('/')) return dateStr;

        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    const abrir = () => {
        if (!data || !data.Clientes || data.Clientes.length === 0) {
            toast({ title: "Sin datos", description: "No hay documentos para exportar.", variant: "warning" });
            return;
        }
        setAbierto(true);
    };

    const generar = async (op: OpcionesPdfReporte): Promise<Uint8Array> => {
        const principal = hexARgb(op.color);
        const pdfDoc = await crearPdfReporte(op.tamanoLetra);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pageWidth = 595.28; // A4
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
                infoDerechaSec: `Impreso: ${new Date().toLocaleDateString('es-PE')}`,
            });
        };

        // Si un vendedor sigue en la página siguiente, se repite su franja
        // marcada como continuación para saber de quién son las zonas.
        let alSaltarPagina: (() => void) | null = null;

        const checkPageBreak = (needed: number) => {
            if (yPosition - needed < margin) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                drawHeader(currentPage);
                alSaltarPagina?.();
            }
        };

        drawHeader(currentPage);

        const cols = [50, 50, 40, 60, 20, 65, 65, 80, 80];
        const colHeaders = ["Emisión", "Vcto.", "Doc.", "Nro Doc", "M", "Provisión", "Amortiz.", "Saldo S/.", "Saldo US$"];

        const fCorteLabel = (mes && anio) ? 'MES:' : 'FECHA CORTE:';
        const fCorte = (mes && anio)
            ? `${PDF_MONTHS[mes - 1]} ${anio}`
            : (dateCorte ? dateCorte.toLocaleDateString('es-PE') : new Date().toLocaleDateString('es-PE'));

        const textoDerecha = (texto: string, xFin: number, y: number, size: number, f: any, color = rgb(0, 0, 0)) =>
            currentPage.drawText(texto, { x: xFin - f.widthOfTextAtSize(texto, size), y, size, font: f, color });

        const dibujarDocumentos = (documentos: any[]) => {
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

            for (const doc of documentos) {
                checkPageBreak(15);
                xPos = margin + 5;

                const isSoles = esSoles(doc);

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
                    if (i >= 5) textX = xPos + cols[i] - font.widthOfTextAtSize(String(text), 7) - 5;
                    if (i === 4) textX = xPos + (cols[i]/2) - (font.widthOfTextAtSize(String(text), 7)/2);

                    currentPage.drawText(String(text), { x: textX, y: yPosition, size: 7, font });
                    xPos += cols[i];
                });

                currentPage.drawLine({ start: { x: margin, y: yPosition - 4 }, end: { x: pageWidth - margin, y: yPosition - 4 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
                yPosition -= 14;
            }
        };

        // --- MISMA ORGANIZACIÓN QUE LA PANTALLA: VENDEDOR -> ZONA -> CLIENTE ---
        for (const vend of agruparPorVendedor(data)) {
            alSaltarPagina = null;
            checkPageBreak(120);

            // Cabecera del vendedor, con su saldo total.
            const dibujarVendedor = (continuacion: boolean) => {
                currentPage.drawRectangle({ x: margin, y: yPosition - 14, width: contentWidth, height: 20, color: rgb(0.2, 0.2, 0.2) });
                currentPage.drawText(`Vendedor: ${vend.codigo ? `${vend.codigo} ` : ''}${vend.nombre}${continuacion ? '  (continuación)' : ''}`, {
                    x: margin + 5, y: yPosition - 8, size: 9, font: boldFont, color: rgb(1, 1, 1)
                });
                textoDerecha(`S/ ${formatMoney(vend.soles)}    US$ ${formatMoney(vend.dolares)}`,
                    pageWidth - margin - 5, yPosition - 8, 8, boldFont, rgb(1, 1, 1));
                yPosition -= 30;
            };
            dibujarVendedor(false);
            alSaltarPagina = () => dibujarVendedor(true);

            for (const zona of vend.zonas) {
                checkPageBreak(100);

                // Franja de la zona, con su subtotal.
                currentPage.drawRectangle({
                    x: margin, y: yPosition - 12, width: contentWidth, height: 16,
                    color: aclarar(principal, 0.9), borderColor: aclarar(principal, 0.7), borderWidth: 0.8,
                });
                currentPage.drawText(`Zona: ${zona.nombre}   (${zona.clientes.length} cliente${zona.clientes.length !== 1 ? 's' : ''})`, {
                    x: margin + 5, y: yPosition - 8, size: 8, font: boldFont, color: principal
                });
                textoDerecha(`S/ ${formatMoney(zona.soles)}${zona.dolares ? `    US$ ${formatMoney(zona.dolares)}` : ''}`,
                    pageWidth - margin - 5, yPosition - 8, 8, boldFont, principal);
                yPosition -= 24;

                for (const { cliente, documentos } of zona.clientes) {
                    checkPageBreak(80); // Espacio requerido para la cabecera del cliente

                    // --- CUADRO DEL CLIENTE ---
                    currentPage.drawRectangle({
                        x: margin,
                        y: yPosition - 50,
                        width: contentWidth,
                        height: 55,
                        color: rgb(0.96, 0.96, 0.96),
                        borderColor: rgb(0.8, 0.8, 0.8),
                        borderWidth: 1
                    });

                    const direccionCorta = cliente.Direccion && cliente.Direccion.length > 85
                        ? cliente.Direccion.substring(0, 85) + "..."
                        : cliente.Direccion || '-';

                    currentPage.drawText(`CLIENTE: ${cliente.Cliente}`, { x: margin + 10, y: yPosition - 15, size: 8, font: boldFont });
                    currentPage.drawText(`DOCUMENTO: ${cliente.RUC}`, { x: margin + 350, y: yPosition - 15, size: 8, font: boldFont });
                    currentPage.drawText(`DIRECCIÓN: ${direccionCorta}`, { x: margin + 10, y: yPosition - 30, size: 8, font });
                    currentPage.drawText(`${fCorteLabel} ${fCorte}`, { x: margin + 10, y: yPosition - 45, size: 8, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
                    currentPage.drawText(`TELÉFONO: ${cliente.Telefono || '-'}`, { x: margin + 350, y: yPosition - 45, size: 8, font });

                    yPosition -= 65;

                    dibujarDocumentos(documentos);
                    yPosition -= 12;
                }
                yPosition -= 4;
            }
            yPosition -= 10;
        }
        alSaltarPagina = null;

        // --- CUADRO FINAL GLOBAL ---
        checkPageBreak(40);
        yPosition -= 5;

        currentPage.drawRectangle({ x: margin, y: yPosition - 20, width: contentWidth, height: 25, color: principal });
        currentPage.drawText("TOTAL GENERAL:", { x: margin + 10, y: yPosition - 10, size: 9, font: boldFont, color: rgb(1, 1, 1) });

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

        return pdfDoc.save();
    };

    return (
        <>
            <Button variant="outline" className="bg-background shadow-sm w-full sm:w-auto text-blue-700 border-blue-200 hover:bg-blue-50" onClick={abrir} disabled={disabled}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
            </Button>
            <PdfVistaPreviaDialog
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo="Saldo de documentos por cobrar"
                defecto={DEFECTO}
                archivoDefecto={`Saldo_Cobrar_${new Date().toISOString().split('T')[0]}`}
                generar={generar}
            />
        </>
    );
};