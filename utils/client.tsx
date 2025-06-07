/**
 * Normaliza un código de documento al formato F001-9061.
 * - Si ya está en formato correcto (tiene guion), lo devuelve igual.
 * - Si no tiene guion y tiene 9 caracteres, inserta el guion después del 4to carácter.
 * - También convierte todo a mayúsculas y quita espacios extra.
 *
 * @param input string - El código ingresado por el usuario (ej. 'F0019061' o 'F001-9061')
 * @returns string - Código normalizado en formato F001-9061
 */


import { Invoice } from "@/interface/report/report-interface";


export function calcularTotal(invoices: Invoice[]): number {
  return invoices.reduce((total, invoice) => {
    const value = parseFloat(invoice.saldoDoc ?? "0");
    return total + (isNaN(value) ? 0 : value);
  }, 0);
}


