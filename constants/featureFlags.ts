// Flags de desarrollo para features en validación (no vienen del backend).
// Se activan a mano (hardcodeado) para probar en dev y se apagan antes de
// llevarlas a producción.

// Menú "Tomar Pedido Alpha": flujo de 2 pasos (Cliente / Productos+Resumen)
// en prueba, sin tocar el módulo "Tomar Pedido" original.
export const SHOW_TOMAR_PEDIDO_ALPHA = false

// Menú "Tomar Pedido Hoja en Blanco": formulario de Registro de Ventas
// migrado del formulario "Facturas" de Access (sieContable0623.accdb), en
// validacion. No reemplaza "Hoja en Blanco" (reporte de despachos serie
// 0800 ya existente en Reportes) - son cosas distintas.
export const SHOW_TOMAR_PEDIDO_HOJA_BLANCO = true
