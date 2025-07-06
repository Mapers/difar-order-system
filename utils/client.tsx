import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

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



export function calcularTotalWithAmortizacion(invoices: Invoice[]): number {
  return invoices.reduce((total, invoice) => {
    const provision = parseFloat(invoice?.Provision ?? "0");
    const amortizacion = parseFloat(invoice?.Amortizacion ?? "0");
    const value = provision - amortizacion;
    return total + (isNaN(value) ? 0 : value);
  }, 0);
}




/**
 * Devuelve el ícono, los colores de Tailwind y la etiqueta
 * legible según el estado recibido.
 *
 * @param estado Valor devuelto por la API (p. ej. "APROBADO")
 */
export const getEstadoVisual = (
  estado: string | null | undefined
): { icon: React.FC<any>; color: string; label: string } => {
  switch ((estado ?? "PENDIENTE").toUpperCase()) {
    case "APROBADO":
      return {
        icon: CheckCircle,
        color: "text-green-700 bg-green-100",
        label: "APROBADO",
      };
    case "RECHAZADO":
      return {
        icon: XCircle,
        color: "text-red-700 bg-red-100",
        label: "RECHAZADO",
      };
    case "PENDIENTE":
    default:
      return {
        icon: AlertCircle,
        color: "text-yellow-700 bg-yellow-100",
        label: "PENDIENTE",
      };
  }
};
