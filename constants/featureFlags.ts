// Flags de desarrollo para features en validación (no vienen del backend).
// Se activan a mano (hardcodeado) para probar en dev y se apagan antes de
// llevarlas a producción.

// Menú "Tomar Pedido Alpha": flujo de 2 pasos (Cliente / Productos+Resumen)
// en prueba, sin tocar el módulo "Tomar Pedido" original.
export const SHOW_TOMAR_PEDIDO_ALPHA = false
