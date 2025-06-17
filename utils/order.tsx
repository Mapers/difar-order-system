import { PROMOCIONES } from "@/constants";
import { IProduct } from "@/interface/order/product-interface";


/**
 * Evalúa si un producto tiene escalas, bonificaciones, ambos o ninguno.
 *
 * @param producto - Objeto de producto a evaluar.
 * @returns Una cadena indicando el estado del producto respecto a escalas y bonificaciones.
 */
export function evaluarPromociones(producto: IProduct): string {
  const tieneEscala = producto.tieneEscala === 1;
  const tieneBonificado = producto.tieneBonificado === 1;

  if (tieneEscala && tieneBonificado) return PROMOCIONES.ESCALA_BONIFICADO;
  if (tieneEscala) return PROMOCIONES.ESCALA;
  if (tieneBonificado) return PROMOCIONES.BONIFICADO;
  return PROMOCIONES.NO_ESCALA_BONIFICADO;
}


