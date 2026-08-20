import { rgb } from 'pdf-lib';

export const EMPRESA = {
    nombre: 'DROGUERÍA DIFAR',
    ruc:    '20481321892',
};

export const sanitizarPdf = (texto: string): string =>
    String(texto ?? '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

export const truncarPdf = (texto: string, ancho: number, size: number, f: any): string => {
    const limpio = sanitizarPdf(texto);
    if (f.widthOfTextAtSize(limpio, size) <= ancho) return limpio;
    let corte = limpio;
    while (corte.length > 1 && f.widthOfTextAtSize(corte + '…', size) > ancho) {
        corte = corte.slice(0, -1);
    }
    return corte + '…';
};

export const cargarLogoPdf = async (pdfDoc: any): Promise<any> => {
    try {
        const bytes = await fetch('/difar-logo.png').then((res) => {
            if (!res.ok) throw new Error('No se pudo cargar la imagen');
            return res.arrayBuffer();
        });
        return await pdfDoc.embedPng(bytes);
    } catch (error) {
        console.warn('No se pudo cargar el logotipo para el PDF:', error);
        return null;
    }
};

export interface CabeceraPdfOpts {
    page:       any;
    font:       any;
    boldFont:   any;
    logo:       any | null;
    pageWidth:  number;
    pageHeight: number;
    margin:     number;
    subtitulo:  string;
    infoDerecha?: string;
    infoDerechaSec?: string;
    filtros?: string;
    razonSocial?: string;
    ruc?: string;
}

export function dibujarCabeceraPdf(opts: CabeceraPdfOpts): number {
    const {
        page, font, boldFont, logo,
        pageWidth, pageHeight, margin,
        subtitulo, infoDerecha, infoDerechaSec, filtros,
        razonSocial, ruc,
    } = opts;

    const arriba = pageHeight - margin;
    let xTitulo = margin;

    if (logo) {
        page.drawImage(logo, { x: margin, y: arriba - 15, width: 50, height: 30 });
        xTitulo = margin + 60;
    }

    const textoDerecha = infoDerecha ?? '';
    const anchoDerecha = textoDerecha ? boldFont.widthOfTextAtSize(sanitizarPdf(textoDerecha), 9) : 0;
    const anchoTitulo  = pageWidth - margin - anchoDerecha - 12 - xTitulo;

    const nombre = sanitizarPdf(razonSocial || EMPRESA.nombre);
    let sizeNombre = 12;
    while (sizeNombre > 8 && boldFont.widthOfTextAtSize(nombre, sizeNombre) > anchoTitulo) {
        sizeNombre -= 0.5;
    }

    page.drawText(truncarPdf(nombre, anchoTitulo, sizeNombre, boldFont), {
        x: xTitulo, y: arriba, size: sizeNombre, font: boldFont,
    });

    page.drawText(`RUC: ${sanitizarPdf(ruc || EMPRESA.ruc)}`, {
        x: xTitulo, y: arriba - 13, size: 9, font, color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(truncarPdf(subtitulo, anchoTitulo, 10, font), {
        x: xTitulo, y: arriba - 25, size: 10, font, color: rgb(0.3, 0.3, 0.3),
    });

    if (textoDerecha) {
        page.drawText(sanitizarPdf(textoDerecha), {
            x: pageWidth - margin - anchoDerecha, y: arriba, size: 9, font: boldFont,
        });
    }

    const sec = infoDerechaSec ?? `Generado: ${new Date().toLocaleDateString()}`;
    page.drawText(sanitizarPdf(sec), {
        x: pageWidth - margin - font.widthOfTextAtSize(sanitizarPdf(sec), 8),
        y: arriba - 13, size: 8, font, color: rgb(0.3, 0.3, 0.3),
    });

    let y = arriba - 40;

    if (filtros) {
        page.drawText(truncarPdf(filtros, pageWidth - margin * 2, 8, font), {
            x: margin, y, size: 8, font, color: rgb(0.45, 0.45, 0.45),
        });
        y -= 10;
    }

    page.drawLine({
        start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1,
    });

    return y - 20;
}
