import { ISelectedProduct } from "@/app/types/order/product-interface"

export const calcularSubtotal = (productos: ISelectedProduct[]): number => {
    return productos.reduce((sum, item) => {
        const precioUnitario = item.isBonification
            ? 0
            : item.appliedScale?.precio_escala ?? item.finalPrice
        return sum + precioUnitario * item.quantity
    }, 0)
}

export const calcularIGV = (productos: ISelectedProduct[]): number => {
    return calcularSubtotal(productos) * 0.18
}

export const calcularTotal = (productos: ISelectedProduct[]): number => {
    return calcularSubtotal(productos)
}

export const formatCurrency = (value: number | string): string => {
    if (value === 0 || value === '') return '';
    const numberValue = typeof value === 'string'
        ? parseFloat(value.replace(/[^\d.]/g, ''))
        : value;

    return numberValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export const getCurrencySymbol = (currencyValue?: string): string => {
    return currencyValue === "PEN" ? "S/." : "$"
}

export const parseLoteString = (loteValue: string) => {
    const split = (loteValue || '||').split('|');
    return { cod: split[0], fec: split[1], stk: split[2] }
}