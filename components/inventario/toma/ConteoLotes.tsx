'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Camera, CheckCircle2, Loader2, Plus, Sparkles, X } from "lucide-react"
import { ModalCamaraLotes } from "./ModalCamaraLotes"
import { TomaInventarioService } from "@/app/services/inventario/TomaInventarioService"
import { TomaLoteBuscado, TomaLoteRef } from "@/app/types/toma-inventario-types"
import { fechaDMY } from "@/components/contabilidad/comisiones/ui"

/**
 * Conteo por lote de la toma de inventario: por artículo, una o varias filas cantidad + lote + vencimiento.
 * Al costado se ve el nuevo saldo (lo contado), el saldo del sistema y la diferencia.
 * Si el lote no existe en el kardex se marca "Lote nuevo" y se exige un vencimiento válido.
 */

export interface FilaLote { k: string; cantidad: string; lote: string; vencimiento: string }

const RE_LOTE = /^[A-Z0-9][A-Z0-9\-/.]{0,49}$/
const RE_CANT = /^\d+([.,]\d{1,2})?$/
const LOTE_ENVIO = 200
const AUTOGUARDADO_MS = 2000
let secuencia = 0
export const filaVacia = (lote = '', vencimiento = ''): FilaLote => ({ k: `f${++secuencia}`, cantidad: '', lote, vencimiento })

export const normLote = (v: string) => v.trim().toUpperCase().replace(/\s+/g, '')
const num = (v: string) => Number(v.trim().replace(',', '.'))
const enBlanco = (f: FilaLote) => !f.cantidad.trim() && !f.lote.trim() && !f.vencimiento
const fechaOk = (v: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(`${v}T00:00:00Z`)
    const anio = Number(v.slice(0, 4))
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && anio >= 2000 && anio <= 2100
}
const fmt = (v: number) => v.toLocaleString('es-PE', { maximumFractionDigits: 2 })

/** Primer error que impide guardar la línea ('' si está bien). */
export function errorLinea(filas: FilaLote[]): string {
    const vistos = new Set<string>()
    for (const f of filas) {
        if (enBlanco(f)) continue
        const lote = normLote(f.lote)
        const nombre = lote ? `Lote ${lote}` : 'Fila sin lote'
        if (!f.cantidad.trim()) return `${nombre}: falta la cantidad.`
        if (!RE_CANT.test(f.cantidad.trim())) return `${nombre}: cantidad con hasta 2 decimales, sin negativos.`
        if (lote && !RE_LOTE.test(lote)) return `Lote "${f.lote.trim()}": solo letras, números, guion, punto o barra.`
        if (vistos.has(lote)) return lote ? `El lote ${lote} está repetido.` : 'Hay dos filas sin lote.'
        vistos.add(lote)
        if (f.vencimiento && !fechaOk(f.vencimiento)) return `${nombre}: vencimiento inválido.`
        if (lote && !f.vencimiento) return `${nombre}: indica el vencimiento.`
    }
    return ''
}

const aEnvio = (filas: FilaLote[]) => filas.filter(f => !enBlanco(f)).map(f => ({
    lote: normLote(f.lote), vencimiento: f.vencimiento || null, cantidad: f.cantidad.trim().replace(',', '.'),
}))
const firma = (filas: FilaLote[] | undefined) => JSON.stringify(aEnvio(filas ?? []).map(x => ({ ...x, cantidad: String(Number(x.cantidad)) })))

/** Total contado de la línea (solo filas con cantidad válida). */
export const totalContado = (filas: FilaLote[] | undefined) =>
    (filas ?? []).reduce((s, f) => s + (RE_CANT.test(f.cantidad.trim()) ? num(f.cantidad) : 0), 0)
export const lineaContada = (filas: FilaLote[] | undefined) => (filas ?? []).some(f => RE_CANT.test(f.cantidad.trim()))

/** Texto para PDF: "JK2504 x 12 (30/10/2028); S/L x 3". */
export const resumenLinea = (filas: FilaLote[] | undefined) => (filas ?? []).filter(f => !enBlanco(f) && f.cantidad.trim())
    .map(f => `${normLote(f.lote) || 'S/L'} x ${f.cantidad.trim()}${f.vencimiento ? ` (${fechaDMY(f.vencimiento)})` : ''}`).join('; ')

/**
 * Estado del conteo por lote de una toma. Las líneas se identifican con una clave (IdLinea en el editor,
 * código de artículo en el listado); `idDe` la traduce al IdLinea al guardar. Se guarda solo.
 */
export function useConteoLotes({ idToma, editable, claveDe, idDe, alGuardarError }: {
    idToma: number | null
    editable: boolean
    claveDe: (idLinea: number) => string | undefined
    idDe: (clave: string) => number | undefined
    alGuardarError?: (mensaje: string) => void
}) {
    const [filas, setFilas] = useState<Record<string, FilaLote[]>>({})
    const [guardadas, setGuardadas] = useState<Record<string, string>>({})
    const [cargando, setCargando] = useState(false)
    const [guardando, setGuardando] = useState(false)
    const [ultimo, setUltimo] = useState<Date | null>(null)
    const [errorGuardar, setErrorGuardar] = useState('')
    const guardandoRef = useRef(false)

    // Cargar lo ya contado de la toma
    useEffect(() => {
        if (!idToma) return
        let vivo = true
        setCargando(true)
        TomaInventarioService.obtenerLotes(idToma).then(rows => {
            if (!vivo) return
            const f: Record<string, FilaLote[]> = {}
            for (const r of rows) {
                const k = claveDe(r.IdLinea)
                if (!k) continue
                ;(f[k] ??= []).push({ ...filaVacia(r.Lote, r.Vencimiento ?? ''), cantidad: String(r.Cantidad) })
            }
            const g: Record<string, string> = {}
            for (const [k, v] of Object.entries(f)) g[k] = firma(v)
            // Lo que el usuario ya escribió mientras se creaba la toma se conserva
            setFilas(prev => ({ ...f, ...prev }))
            setGuardadas(g)
        }).catch(() => { /* sin conteo previo */ }).finally(() => vivo && setCargando(false))
        return () => { vivo = false }
    }, [idToma]) // eslint-disable-line react-hooks/exhaustive-deps

    const errores = useMemo(() => {
        const e: Record<string, string> = {}
        for (const [k, v] of Object.entries(filas)) { const m = errorLinea(v); if (m) e[k] = m }
        return e
    }, [filas])

    const pendientes = useMemo(() => Object.keys(filas).filter(k => firma(filas[k]) !== (guardadas[k] ?? '[]')), [filas, guardadas])
    const porGuardar = useMemo(() => pendientes.filter(k => !errores[k] && idDe(k)), [pendientes, errores, idDe])

    const guardar = useCallback(async () => {
        if (!idToma || !editable || guardandoRef.current || !porGuardar.length) return true
        guardandoRef.current = true
        setGuardando(true)
        try {
            for (let i = 0; i < porGuardar.length; i += LOTE_ENVIO) {
                const bloque = porGuardar.slice(i, i + LOTE_ENVIO)
                const firmas = Object.fromEntries(bloque.map(k => [k, firma(filas[k])]))
                await TomaInventarioService.guardarLotes(idToma, bloque.map(k => ({ id: idDe(k)!, lotes: aEnvio(filas[k]) })))
                setGuardadas(g => ({ ...g, ...firmas }))
            }
            setUltimo(new Date())
            setErrorGuardar('')
            return true
        } catch (e: any) {
            const m = e?.response?.data?.message || 'No se pudo guardar el conteo. Revisa tu conexión.'
            setErrorGuardar(m)
            alGuardarError?.(m)
            return false
        } finally {
            guardandoRef.current = false
            setGuardando(false)
        }
    }, [idToma, editable, porGuardar, filas, idDe, alGuardarError])

    useEffect(() => {
        if (!editable || !idToma || !porGuardar.length) return
        const t = setTimeout(() => { guardar() }, AUTOGUARDADO_MS)
        return () => clearTimeout(t)
    }, [filas, editable, idToma, porGuardar.length, guardar])

    useEffect(() => {
        if (!pendientes.length) return
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
        window.addEventListener('beforeunload', h)
        return () => window.removeEventListener('beforeunload', h)
    }, [pendientes.length])

    const cambiar = useCallback((clave: string, nuevas: FilaLote[]) => setFilas(f => ({ ...f, [clave]: nuevas })), [])

    // Lotes consultados al kardex (¿existe? vencimiento y saldo)
    const [buscados, setBuscados] = useState<Record<string, TomaLoteBuscado | 'buscando' | 'error'>>({})
    const buscarLote = useCallback(async (codigo: string, lote: string) => {
        const l = normLote(lote)
        if (!l || !RE_LOTE.test(l)) return undefined
        const k = `${codigo}|${l}`
        if (buscados[k] && buscados[k] !== 'error') return buscados[k] === 'buscando' ? undefined : buscados[k] as TomaLoteBuscado
        setBuscados(b => ({ ...b, [k]: 'buscando' }))
        try {
            const r = await TomaInventarioService.buscarLote(codigo, l)
            setBuscados(b => ({ ...b, [k]: r }))
            return r
        } catch {
            setBuscados(b => ({ ...b, [k]: 'error' }))
            return undefined
        }
    }, [buscados])

    return {
        filas, cambiar, errores, cargando, guardando, ultimo, errorGuardar, guardar, buscados, buscarLote,
        sinGuardar: pendientes.length, conError: Object.keys(errores).length,
    }
}

export type ConteoLotes = ReturnType<typeof useConteoLotes>

/** Pasa el foco al siguiente campo de conteo visible (Enter). */
function enfocarSiguiente(el: HTMLElement) {
    const todos = Array.from(document.querySelectorAll<HTMLInputElement>('input[data-conteo-lote]')).filter(x => x.offsetParent !== null && !x.disabled)
    const sig = todos[todos.indexOf(el as HTMLInputElement) + 1]
    if (sig) { sig.focus(); sig.select?.() }
}

/**
 * Celda "Inventario": filas cantidad + lote + vencimiento y, al costado, el nuevo saldo.
 * `lotesRef` son los lotes con saldo del artículo (para completar el vencimiento y comparar).
 */
type PropsCelda = Parameters<typeof CeldaConteoLotesBase>[0]
const mismosLotes = (a: TomaLoteRef[], b: TomaLoteRef[]) => a === b || (a.length === b.length && a.every((x, i) => x.lote === b[i].lote && x.vencimiento === b[i].vencimiento && x.saldo === b[i].saldo))
/**
 * Con 2 000+ artículos en pantalla, volver a dibujar todas las celdas por cada tecla volvía lenta la página
 * (sobre todo en celular). Cada celda se redibuja solo si cambia su conteo, su error, los lotes verificados o sus props.
 */
export const CeldaConteoLotes = memo(CeldaConteoLotesBase, (a: PropsCelda, b: PropsCelda) =>
    a.clave === b.clave && a.codigo === b.codigo && a.producto === b.producto && a.unidad === b.unidad && a.corte === b.corte
    && a.editable === b.editable && a.deshabilitado === b.deshabilitado && a.conteoAnterior === b.conteoAnterior && a.alEditar === b.alEditar
    && mismosLotes(a.lotesRef, b.lotesRef)
    && a.conteo.filas[a.clave] === b.conteo.filas[b.clave] && a.conteo.errores[a.clave] === b.conteo.errores[b.clave]
    && a.conteo.buscados === b.conteo.buscados && a.conteo.cambiar === b.conteo.cambiar)

function CeldaConteoLotesBase({ clave, codigo, producto, unidad, conteo, lotesRef, corte, editable, deshabilitado, conteoAnterior, alEditar }: {
    clave: string
    codigo: string
    producto?: string | null
    unidad?: string | null
    conteo: ConteoLotes
    lotesRef: TomaLoteRef[]
    corte: string
    editable: boolean
    deshabilitado?: string
    conteoAnterior?: string | null
    alEditar?: () => void
}) {
    const vacia = useMemo(() => filaVacia(), [clave])
    const filas = conteo.filas[clave]?.length ? conteo.filas[clave] : [vacia]
    const error = conteo.errores[clave]
    const refPorLote = useMemo(() => new Map(lotesRef.filter(l => l.lote).map(l => [normLote(l.lote!), l])), [lotesRef])
    const conSaldo = lotesRef.some(l => typeof l.saldo === 'number')
    const sistema = lotesRef.reduce((s, l) => s + (typeof l.saldo === 'number' ? l.saldo : 0), 0)
    const contado = totalContado(conteo.filas[clave])
    const hayConteo = lineaContada(conteo.filas[clave])
    const dif = Math.round((contado - sistema) * 100) / 100
    const bloqueado = !editable || !!deshabilitado
    const idLista = `lotes-${clave}`

    const set = (k: string, cambio: Partial<FilaLote>) => {
        alEditar?.()
        conteo.cambiar(clave, filas.map(f => f.k === k ? { ...f, ...cambio } : f))
    }
    const quitar = (k: string) => {
        alEditar?.()
        const resto = filas.filter(f => f.k !== k)
        conteo.cambiar(clave, resto.length ? resto : [filaVacia()])
    }
    const agregar = () => { alEditar?.(); conteo.cambiar(clave, [...filas, filaVacia()]) }
    const [camara, setCamara] = useState(false)

    /** Lo contado con la cámara se suma a las filas: mismo lote = suma la cantidad; lote nuevo = fila nueva. */
    const aplicarCamara = (leidas: { lote: string; vencimiento: string; cantidad: number }[]) => {
        alEditar?.()
        let nuevas = filas.filter(f => !enBlanco(f))
        for (const x of leidas) {
            const i = nuevas.findIndex(f => normLote(f.lote) === x.lote)
            if (i >= 0) {
                const f = nuevas[i]
                const suma = Math.round(((RE_CANT.test(f.cantidad.trim()) ? num(f.cantidad) : 0) + x.cantidad) * 100) / 100
                nuevas = nuevas.map((y, j) => j === i ? { ...y, cantidad: String(suma), vencimiento: y.vencimiento || x.vencimiento } : y)
            } else {
                nuevas = [...nuevas, { ...filaVacia(x.lote, x.vencimiento), cantidad: String(x.cantidad) }]
            }
        }
        conteo.cambiar(clave, nuevas.length ? nuevas : [filaVacia()])
        for (const x of leidas) if (x.lote && !refPorLote.has(x.lote)) conteo.buscarLote(codigo, x.lote)
    }

    /** Al salir del lote: si existe, completa el vencimiento; si no está en los lotes con saldo, lo busca en el kardex. */
    const alSalirLote = async (f: FilaLote) => {
        const l = normLote(f.lote)
        if (!l) return
        if (l !== f.lote) set(f.k, { lote: l })
        const ref = refPorLote.get(l)
        if (ref) { if (!f.vencimiento && ref.vencimiento) set(f.k, { lote: l, vencimiento: ref.vencimiento }); return }
        const r = await conteo.buscarLote(codigo, l)
        if (r?.existe && r.vencimiento && !f.vencimiento) {
            conteo.cambiar(clave, (conteo.filas[clave]?.length ? conteo.filas[clave] : filas).map(x => x.k === f.k ? { ...x, lote: l, vencimiento: r.vencimiento! } : x))
        }
    }

    const estadoFila = (f: FilaLote) => {
        const l = normLote(f.lote)
        if (enBlanco(f)) return null
        if (!l) return <span className="text-muted-foreground">Sin lote</span>
        if (!RE_LOTE.test(l)) return null
        const ref = refPorLote.get(l)
        const b = conteo.buscados[`${codigo}|${l}`]
        const vSistema = ref?.vencimiento ?? (b && typeof b === 'object' && b.existe ? b.vencimiento : null)
        const avisoVence = f.vencimiento && vSistema && f.vencimiento !== vSistema
            ? <span className="text-amber-700 dark:text-amber-400"> · el sistema dice vence {fechaDMY(vSistema)}</span> : null
        const vencido = f.vencimiento && corte && f.vencimiento < corte
            ? <span className="text-amber-700 dark:text-amber-400"> · vencido</span> : null
        if (ref) return <span className="text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="mr-0.5 inline h-3 w-3" />En sistema{typeof ref.saldo === 'number' ? `: ${fmt(ref.saldo)}` : ''}{avisoVence}{vencido}</span>
        if (b === 'buscando') return <span className="text-muted-foreground"><Loader2 className="mr-0.5 inline h-3 w-3 animate-spin" />Verificando lote…</span>
        if (b && typeof b === 'object') {
            return b.existe
                ? <span className="text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="mr-0.5 inline h-3 w-3" />Existe en kardex (saldo {fmt(b.saldo ?? 0)}){avisoVence}{vencido}</span>
                : <span className="font-medium text-amber-700 dark:text-amber-400"><Sparkles className="mr-0.5 inline h-3 w-3" />Lote nuevo{f.vencimiento ? '' : ': indica su vencimiento'}{vencido}</span>
        }
        return <span className="text-muted-foreground">Sal del campo lote para verificarlo{vencido}</span>
    }

    if (deshabilitado) return <p className="text-[11px] text-muted-foreground">{deshabilitado}</p>

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 space-y-1">
                <datalist id={idLista}>{lotesRef.filter(l => l.lote).map(l => <option key={l.lote!} value={l.lote!}>{l.vencimiento ? `vence ${fechaDMY(l.vencimiento)}` : ''}</option>)}</datalist>
                {filas.map((f, i) => (
                    <div key={f.k}>
                        <div className="flex items-center gap-1">
                            <Input data-conteo-lote value={f.cantidad} disabled={bloqueado} inputMode="decimal" placeholder="Stock"
                                   onChange={e => set(f.k, { cantidad: e.target.value })}
                                   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); enfocarSiguiente(e.currentTarget) } }}
                                   className="h-8 w-16 shrink-0 px-2 text-right font-mono text-xs" aria-label={`Stock contado ${i + 1}`} />
                            <Input data-conteo-lote value={f.lote} disabled={bloqueado} list={idLista} placeholder="Lote" maxLength={50}
                                   onChange={e => set(f.k, { lote: e.target.value.toUpperCase() })} onBlur={() => alSalirLote(f)}
                                   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); alSalirLote(f); enfocarSiguiente(e.currentTarget) } }}
                                   className="h-8 min-w-[6.5rem] flex-1 px-2 font-mono text-xs uppercase" aria-label={`Lote ${i + 1}`} />
                            <Input data-conteo-lote type="date" value={f.vencimiento} disabled={bloqueado} min="2000-01-01" max="2100-12-31"
                                   onChange={e => set(f.k, { vencimiento: e.target.value })}
                                   onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); enfocarSiguiente(e.currentTarget) } }}
                                   className="h-8 w-[8.25rem] shrink-0 px-1.5 text-xs" aria-label={`Vencimiento ${i + 1}`} />
                            {!bloqueado && (filas.length > 1 || !enBlanco(f)) && (
                                <button type="button" onClick={() => quitar(f.k)} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Quitar fila">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="pl-0.5 pt-0.5 text-[10.5px] leading-tight">{estadoFila(f)}</div>
                    </div>
                ))}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {!bloqueado && (
                        <button type="button" onClick={agregar} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-700 hover:underline dark:text-blue-400">
                            <Plus className="h-3 w-3" /> Otro lote
                        </button>
                    )}
                    {!bloqueado && (
                        <button type="button" onClick={() => setCamara(true)} className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-violet-700">
                            <Camera className="h-3 w-3" /> Contar con cámara (IA)
                        </button>
                    )}
                    {conteoAnterior && !hayConteo && <span className="text-[10.5px] text-muted-foreground" title="Conteo escrito antes como texto libre">Anotado antes: “{conteoAnterior}”</span>}
                </div>
                {error && <p className="flex items-start gap-1 text-[11px] text-amber-700 dark:text-amber-400"><AlertTriangle className="mt-px h-3 w-3 shrink-0" />{error} No se guarda hasta corregirlo.</p>}
            </div>
            {camara && (
                <ModalCamaraLotes abierto={camara} onCerrar={() => setCamara(false)} onAplicar={aplicarCamara}
                                  codigo={codigo} producto={producto} unidad={unidad} lotesRef={lotesRef} corte={corte} />
            )}
            <div className={`shrink-0 rounded-md border px-2 py-1 text-right sm:w-28 ${hayConteo ? (conSaldo && dif !== 0 ? 'border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/30' : 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30') : 'border-dashed'}`}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Nuevo saldo</p>
                <p className="font-mono text-sm font-bold">{hayConteo ? fmt(contado) : '—'} <span className="text-[10px] font-normal text-muted-foreground">{unidad}</span></p>
                {conSaldo && <p className="text-[10px] text-muted-foreground">Sistema {fmt(sistema)}</p>}
                {conSaldo && hayConteo && (
                    <p className={`font-mono text-[11px] font-semibold ${dif === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {dif === 0 ? 'Cuadra' : `${dif > 0 ? '+' : ''}${fmt(dif)}`}
                    </p>
                )}
            </div>
        </div>
    )
}

/** Indicador de guardado del conteo por lote. */
export function EstadoGuardadoLotes({ conteo, editable }: { conteo: ConteoLotes; editable: boolean }) {
    if (!editable) return null
    if (conteo.guardando) return <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando…</span>
    if (conteo.errorGuardar) return <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> {conteo.errorGuardar}</span>
    if (conteo.conError) return <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> {conteo.conError} línea(s) por corregir</span>
    if (conteo.sinGuardar) return <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"><Loader2 className="h-3.5 w-3.5" /> {conteo.sinGuardar} sin guardar</span>
    return <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> {conteo.ultimo ? `Guardado ${conteo.ultimo.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 'Todo guardado'}</span>
}
