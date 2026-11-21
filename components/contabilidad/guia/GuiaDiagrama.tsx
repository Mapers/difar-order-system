"use client"

import { useEffect, useMemo, useState } from "react"
import {
    ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BadgePercent, BarChart3, BookOpen, Boxes, Building2, Calculator, CalendarDays,
    Check, ClipboardList, Cog, Database, FileSpreadsheet, FileText, Landmark, MapPin, MessageSquare, Package, Pause, Play,
    Receipt, RotateCcw, Search, Send, ShieldCheck, ShoppingCart, SlidersHorizontal, Split, Tags, Trash2, Truck, UserRound,
    type LucideIcon,
} from "lucide-react"
import { DiagramaGuia, IconoDiagrama, TonoDiagrama } from "./tipos"

const ICONOS: Record<IconoDiagrama, LucideIcon> = {
    planilla: ClipboardList,
    validar: ShieldCheck,
    enviar: Send,
    caja: Landmark,
    cliente: UserRound,
    libro: BookOpen,
    reporte: BarChart3,
    filtro: SlidersHorizontal,
    buscar: Search,
    sistema: Cog,
    calculo: Calculator,
    archivo: FileSpreadsheet,
    documento: FileText,
    comprobante: Receipt,
    pedido: ShoppingCart,
    almacen: Boxes,
    producto: Package,
    precio: Tags,
    proveedor: Truck,
    sunat: Building2,
    comision: BadgePercent,
    ruta: MapPin,
    calendario: CalendarDays,
    chat: MessageSquare,
}

const TONOS: Record<TonoDiagrama, { borde: string; icono: string; solido: string; color: string }> = {
    indigo: {
        borde: "border-indigo-400 dark:border-indigo-400/70",
        icono: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
        solido: "bg-indigo-600", color: "#6366f1",
    },
    ambar: {
        borde: "border-amber-400 dark:border-amber-400/70",
        icono: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        solido: "bg-amber-600", color: "#d97706",
    },
    celeste: {
        borde: "border-sky-400 dark:border-sky-400/70",
        icono: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
        solido: "bg-sky-600", color: "#0284c7",
    },
    verde: {
        borde: "border-emerald-400 dark:border-emerald-400/70",
        icono: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
        solido: "bg-emerald-600", color: "#059669",
    },
    violeta: {
        borde: "border-violet-400 dark:border-violet-400/70",
        icono: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
        solido: "bg-violet-600", color: "#7c3aed",
    },
}

/** Cada cuánto avanza la animación (ms). */
const PASO_MS = 430
/** Separación entre columnas (px); debe coincidir con gap-x-5. */
const SEPARACION = 20

const ANIMACIONES = `
@keyframes guia-caer { 0% { transform: translateY(-5px); opacity: 0 } 25% { opacity: 1 } 100% { transform: translateY(24px); opacity: 0 } }
@keyframes guia-subir { 0% { transform: translateY(24px); opacity: 0 } 25% { opacity: 1 } 100% { transform: translateY(-5px); opacity: 0 } }
@keyframes guia-llegar { 0% { transform: scale(.94) } 55% { transform: scale(1.03) } 100% { transform: scale(1) } }
@keyframes guia-latir { 0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, .55) } 50% { box-shadow: 0 0 0 7px rgba(99, 102, 241, 0) } }
`

/** Momentos (en pasos) en que ocurre cada cosa del dibujo. */
function lineaDeTiempo(d: DiagramaGuia) {
    const sale: number[] = [], activo: number[] = [], tabla: number[][] = []
    let t = 0
    d.nodos.forEach((n, i) => {
        sale[i] = t
        activo[i] = i === 0 ? t + 1 : t + 2          // el viaje dura ~2 pasos
        tabla[i] = n.tablas.map((_, j) => activo[i] + 2 + j)
        t = activo[i] + 2 + n.tablas.length + 1
    })
    const efecto = (d.efectos ?? []).map((_, k) => t + k)
    const ultimo = t + Math.max(efecto.length - 1, 0) // cuando ya se encendió todo
    return { sale, activo, tabla, efecto, ultimo, fin: ultimo + 9 } // pausa antes de repetir
}

/**
 * Dibujo animado del recorrido de un dato: una ficha viaja por la línea de módulos; en cada uno
 * baja a las tablas que graba (o sube desde las tablas que lee) y al final se reparte a los
 * módulos que usan ese dato.
 */
export function GuiaDiagrama({ diagrama }: { diagrama: DiagramaGuia }) {
    const n = diagrama.nodos.length
    const tiempos = useMemo(() => lineaDeTiempo(diagrama), [diagrama])
    const [paso, setPaso] = useState(0)
    const [pausa, setPausa] = useState(false)

    // Al cambiar de pantalla, el dibujo empieza de nuevo.
    useEffect(() => { setPaso(0); setPausa(false) }, [diagrama])

    // No se mira "reducir movimiento" del sistema: en Windows Server viene activado y la animación
    // es justo lo que se quiere mostrar. Se controla con Pausar / Repetir.
    useEffect(() => {
        if (pausa) return
        const id = setInterval(() => setPaso(p => (p >= tiempos.fin ? 0 : p + 1)), PASO_MS)
        return () => clearInterval(id)
    }, [pausa, tiempos.fin])

    const t = paso
    const posicion = Math.max(0, tiempos.sale.reduce((ult, s, i) => (s <= t ? i : ult), 0))
    const actual = tiempos.activo.reduce((ult, a, i) => (a <= t ? i : ult), -1)
    const nodoActual = diagrama.nodos[Math.max(actual, 0)]
    const terminado = t >= tiempos.ultimo
    const ficha = diagrama.ficha ?? "Dato"

    /** Centro de la columna i dentro de la rejilla. */
    const centro = (i: number) => `calc((100% + ${SEPARACION}px) * ${(i + 0.5) / n} - ${SEPARACION / 2}px)`

    // Los efectos se acomodan debajo de las columnas con una tabla o ninguna, si hay al menos dos seguidas.
    const hueco = useMemo(() => {
        let mejor: [number, number] | null = null, ini = -1
        diagrama.nodos.forEach((nodo, i) => {
            if (nodo.tablas.length <= 1) {
                if (ini < 0) ini = i
                if (!mejor || i - ini > mejor[1] - mejor[0]) mejor = [ini, i]
            } else ini = -1
        })
        const m = mejor as [number, number] | null
        return m && m[1] - m[0] >= 1 ? m : null
    }, [diagrama])

    const boton = "inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"

    return (
        <figure className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950/60">
            <style>{ANIMACIONES}</style>
            <figcaption className="mb-1 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">{diagrama.titulo}</span>
                <span className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => setPausa(p => !p)} className={boton}>
                        {pausa ? <><Play className="h-3 w-3" /> Seguir</> : <><Pause className="h-3 w-3" /> Pausar</>}
                    </button>
                    <button type="button" onClick={() => { setPaso(0); setPausa(false) }} className={boton}>
                        <RotateCcw className="h-3 w-3" /> Repetir
                    </button>
                </span>
            </figcaption>

            {/* La línea por donde viaja la ficha. */}
            <div className="relative h-9" aria-hidden="true">
                <span className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-gray-300 dark:bg-gray-700"
                      style={{ left: centro(0), right: `calc(100% - ${centro(n - 1)})` }} />
                <span className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-gradient-to-r from-indigo-500 to-emerald-500 transition-[width] duration-[800ms] ease-in-out"
                      style={{ left: centro(0), width: `calc(${centro(posicion)} - ${centro(0)})` }} />
                {diagrama.nodos.map((nodo, i) => (
                    <span key={i}
                          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gray-50 transition-colors duration-300 dark:border-gray-950 ${i <= actual ? TONOS[nodo.tono].solido : "bg-gray-300 dark:bg-gray-600"}`}
                          style={{ left: centro(i) }} />
                ))}
                <span className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-lg transition-[left,background-color] duration-[800ms] ease-in-out"
                      style={{ left: centro(posicion), backgroundColor: TONOS[nodoActual.tono].color, animation: pausa ? undefined : "guia-latir 1.4s ease-in-out infinite" }}>
                    {terminado ? <Check className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    {ficha}{actual >= 0 && nodoActual.estado ? ` · ${nodoActual.estado}` : ""}
                </span>
            </div>

            <div className="grid gap-x-5"
                 style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridTemplateRows: "auto auto auto 1fr" }}>
                {/* Módulos. */}
                {diagrama.nodos.map((nodo, i) => {
                    const Icono = ICONOS[nodo.icono]
                    const tono = TONOS[nodo.tono]
                    const visto = i <= actual
                    return (
                        <div key={`m${i}`}
                             className={`relative rounded-lg border-2 bg-white p-2.5 transition-all duration-500 dark:bg-gray-900 ${visto ? tono.borde : "border-gray-200 opacity-45 dark:border-gray-700"} ${i === actual && !terminado ? "shadow-lg" : ""}`}
                             style={{ gridRow: 1, gridColumn: i + 1, animation: i === actual ? "guia-llegar .45s ease-out" : undefined }}>
                            {i < n - 1 && (
                                <ArrowRight aria-hidden="true" strokeWidth={3}
                                            className={`absolute -right-[19px] top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-500 ${i < actual ? "text-indigo-500 dark:text-indigo-400" : "text-gray-300 dark:text-gray-600"}`} />
                            )}
                            <div className="flex items-center gap-2">
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${tono.solido}`}>{i + 1}</span>
                                <span className="text-[10.5px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{nodo.quien}</span>
                                <span className={`ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tono.icono}`}><Icono className="h-4 w-4" /></span>
                            </div>
                            <p className="mt-1.5 text-[13px] font-bold leading-tight">{nodo.modulo}</p>
                            <p className="mt-0.5 text-[11.5px] leading-snug text-gray-600 dark:text-gray-300">{nodo.accion}</p>
                        </div>
                    )
                })}

                {/* Unión con las tablas: la ficha baja a grabar o los datos suben al leer. */}
                {diagrama.nodos.map((nodo, i) => {
                    if (nodo.tablas.length === 0) return null
                    const lee = nodo.modo === "lee"
                    const borra = nodo.modo === "borra"
                    const enMovimiento = t >= tiempos.activo[i] + 1 && t <= tiempos.tabla[i][nodo.tablas.length - 1]
                    const visto = t > tiempos.activo[i]
                    const varias = nodo.tablas.length > 1
                    return (
                        <div key={`b${i}`} aria-hidden="true"
                             className={`relative flex h-8 items-center justify-center transition-colors duration-500 ${visto ? "text-gray-600 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}
                             style={{ gridRow: 2, gridColumn: i + 1 }}>
                            <span className="absolute inset-y-0 left-1/2 border-l-2 border-dashed border-current" />
                            {enMovimiento && (
                                <span className="absolute left-1/2 top-0 -ml-[5px] h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: TONOS[nodo.tono].color, animation: `${lee ? "guia-subir" : "guia-caer"} ${PASO_MS}ms ease-in infinite` }} />
                            )}
                            <span className="relative flex items-center gap-1 bg-gray-50 px-1.5 text-[9.5px] font-bold uppercase tracking-wider dark:bg-[#0b0f1a]">
                                {lee
                                    ? <><ArrowUp className="h-3 w-3" /> {varias ? `trae de ${nodo.tablas.length} tablas` : "trae datos de"}</>
                                    : borra
                                        ? <><Trash2 className="h-3 w-3" /> {varias ? `borra en ${nodo.tablas.length} tablas` : "borra en"}</>
                                        : varias
                                            ? <><Split className="h-3 w-3 rotate-180" /> se reparte en {nodo.tablas.length} tablas</>
                                            : <>graba en <ArrowDown className="h-3 w-3" /></>}
                            </span>
                        </div>
                    )
                })}

                {/* Tablas. */}
                {diagrama.nodos.map((nodo, i) => nodo.tablas.length === 0 ? null : (
                    <ul key={`t${i}`}
                        className="space-y-1 self-start rounded-lg border border-dashed border-gray-300 bg-white/70 p-1.5 dark:border-gray-600 dark:bg-gray-900/60"
                        style={{ gridRow: nodo.tablas.length > 1 ? "3 / span 2" : 3, gridColumn: i + 1 }}>
                        {nodo.tablas.map((tb, j) => {
                            const lleno = t >= tiempos.tabla[i][j]
                            return (
                                <li key={j}
                                    className={`flex items-start gap-1.5 rounded px-1.5 py-1 transition-opacity duration-300 ${lleno ? "opacity-100" : "opacity-30"} ${tb.contable
                                        ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}
                                    style={{ animation: lleno ? "guia-llegar .45s ease-out" : undefined }}>
                                    <Database className={`mt-0.5 h-3 w-3 shrink-0 ${tb.contable ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-mono text-[10.5px] font-semibold leading-tight">
                                            {tb.nombre.split("_").map((parte, k) => <span key={k}>{k > 0 && <>_<wbr /></>}{parte}</span>)}
                                        </span>
                                        {tb.nota && <span className="block text-[10px] leading-tight opacity-75">{tb.nota}</span>}
                                    </span>
                                    {lleno && <Check className={`mt-0.5 h-3 w-3 shrink-0 ${tb.contable ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`} strokeWidth={3} />}
                                </li>
                            )
                        })}
                    </ul>
                ))}

                {/* A dónde llega el dato al final (módulos, reportes, archivos). */}
                {diagrama.efectos && diagrama.efectos.length > 0 && (
                    <div className={`mt-2 self-start rounded-lg border p-1.5 transition-colors duration-500 ${t >= tiempos.efecto[0]
                        ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                        : "border-gray-200 dark:border-gray-700"}`}
                         style={hueco ? { gridRow: 4, gridColumn: `${hueco[0] + 1} / ${hueco[1] + 2}` } : { gridRow: 5, gridColumn: "1 / -1" }}>
                        <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                            <span className="flex-1">{diagrama.tituloEfectos}</span>
                            {hueco && hueco[1] < n - 1 && <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3} />}
                        </p>
                        <ul className={hueco ? "space-y-1" : "grid gap-1"} style={hueco ? undefined : { gridTemplateColumns: `repeat(${Math.min(diagrama.efectos.length, 3)}, minmax(0, 1fr))` }}>
                            {diagrama.efectos.map((e, k) => {
                                const Icono = ICONOS[e.icono]
                                const lleno = t >= tiempos.efecto[k]
                                return (
                                    <li key={k}
                                        className={`flex items-center gap-2 rounded-md bg-white px-2 py-1 transition-opacity duration-300 dark:bg-gray-900 ${lleno ? "opacity-100" : "opacity-30"}`}
                                        style={{ animation: lleno ? "guia-llegar .45s ease-out" : undefined }}>
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><Icono className="h-3 w-3" /></span>
                                        <span className="min-w-0 flex-1 text-[11px] leading-tight">
                                            <b className="text-[12px]">{e.modulo}</b>
                                            <span className="text-gray-600 dark:text-gray-300"> · {e.detalle}</span>
                                        </span>
                                        {e.desde && <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">{e.desde}</span>}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </figure>
    )
}
