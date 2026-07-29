/**
 * Cuotas y semáforo del reporte "Ventas por Vendedor".
 *
 * Vive aparte de metas-helpers.ts a propósito, aunque se parezcan: los
 * umbrales son distintos. Metas usa 80/50 para el avance del ciclo, este
 * reporte usa 100/70. Compartir el archivo invita a unificarlos por error.
 */

/** Umbrales del semáforo. Fijos por decisión de negocio (R1.3 / R2.6). */
export const UMBRAL_VERDE = 100
export const UMBRAL_AMBAR = 70

/**
 * El kardex guarda Vta_Tot con IGV. Verificado sobre julio 2026: 269
 * comprobantes con total_exonerada y total_inafecta en 0.00, o sea todo
 * gravado. Si algún día entran productos exonerados, este divisor plano
 * deja de servir y hay que sacar el IGV por línea.
 */
export const IGV_FACTOR = 1.18

export type EstadoCuota = 'verde' | 'ambar' | 'rojo' | 'sin-cuota'

/**
 * pct = ROUND(ventas / NULLIF(cuota, 0) * 100, 2)
 *
 * Devuelve null cuando no hay cuota, no 0. Son cosas distintas: 0% es
 * "tiene meta y no vendió nada", null es "no hay meta contra la cual medir".
 * La UI muestra "—" para null.
 */
export const calcPctCuota = (ventas: number, cuota: number): number | null => {
    const c = Number(cuota) || 0
    if (c === 0) return null
    return Math.round((Number(ventas) / c) * 10000) / 100
}

/**
 * Topa el porcentaje a 100 para mostrarlo: una cuota superada se lee "100%",
 * no "1018%". Mismo criterio que capPct de metas-helpers.
 *
 * Es SOLO para mostrar. El semáforo se decide con el porcentaje real, aunque
 * dé igual: cualquier valor sobre 100 ya es verde.
 */
export const capPctCuota = (pct: number | null): number | null =>
    pct === null ? null : Math.max(0, Math.min(pct, 100))

export const estadoCuota = (pct: number | null): EstadoCuota => {
    if (pct === null) return 'sin-cuota'
    if (pct >= UMBRAL_VERDE) return 'verde'
    if (pct >= UMBRAL_AMBAR) return 'ambar'
    return 'rojo'
}

/** Clases de color por estado, para tabla, barra y chip. */
export const coloresEstado: Record<EstadoCuota, { texto: string; barra: string; chip: string }> = {
    verde:       { texto: 'text-emerald-700',      barra: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-800' },
    ambar:       { texto: 'text-amber-700',        barra: 'bg-amber-500',   chip: 'bg-amber-100 text-amber-800' },
    rojo:        { texto: 'text-red-700',          barra: 'bg-red-500',     chip: 'bg-red-100 text-red-800' },
    'sin-cuota': { texto: 'text-muted-foreground', barra: 'bg-muted',       chip: 'bg-muted text-muted-foreground border border-dashed' },
}

/** Hex equivalentes, para los exportadores a PDF y Excel. */
export const hexEstado: Record<EstadoCuota, string> = {
    verde:       '#059669',
    ambar:       '#d97706',
    rojo:        '#dc2626',
    'sin-cuota': '#9ca3af',
}

/**
 * Restante = cuota − real (R2.4), topado en 0.
 *
 * Responde "cuántas unidades faltan vender". Cubierta o superada es cero:
 * no falta nada. Por eso no se muestran negativos.
 *
 * Devuelve null solo cuando no hay ni cuota ni venta: ahí la columna no
 * aplica y la UI muestra "—".
 */
export const restanteCuota = (cuotaCant: number, cantReal: number): number | null => {
    const c = Number(cuotaCant) || 0
    const r = Number(cantReal) || 0
    if (c === 0 && r === 0) return null
    return Math.max(0, c - r)
}

/*
 * NOTA sobre la cuota en soles (R2.2).
 *
 * Se usa el meta_monto configurado en pbl_meta_laboratorio_vendedor_item, tal
 * cual. No se revaloriza al precio real de venta.
 *
 * La alternativa —cuota_cant × (Total S/. ÷ Cant. total)— hacía que el % en
 * soles fuera idéntico al % en unidades, pero producía un total de cuota
 * distinto al de la vista por vendedor, que lee el mismo meta_monto. Para
 * C009 en BIOS eran 12,631.77 contra 18,517.09: el mismo concepto con dos
 * números en dos pantallas. Se priorizó que ambas vistas cuadren.
 */

/**
 * R2.5: el switch divide montos, nunca porcentajes ni cantidades.
 * El % no cambia porque el factor se cancela entre numerador y denominador.
 */
export const sinIgv = (monto: number): number => Number(monto) / IGV_FACTOR
