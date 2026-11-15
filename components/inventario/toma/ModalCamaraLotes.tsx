'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Camera, CheckCircle2, ImageUp, Loader2, Minus, Plus, Sparkles, Trash2, X } from "lucide-react"
import { TomaInventarioService } from "@/app/services/inventario/TomaInventarioService"
import { TomaLoteBuscado, TomaLoteRef } from "@/app/types/toma-inventario-types"
import { fechaDMY } from "@/components/contabilidad/comisiones/ui"
import { normLote } from "./ConteoLotes"

/**
 * Conteo con cámara + IA (experimento). Todo ocurre dentro del modal:
 *   - La cámara ocupa el recuadro; "Capturar" envía la foto y la IA lee lote y vencimiento.
 *   - Cada captura suma 1 al lote leído (lote nuevo = fila nueva). "+1" suma sin volver a leer.
 *   - Lote, vencimiento y cantidad se pueden editar a mano.
 *   - El botón verde "Aplicar" pasa lo contado a la celda del artículo.
 * La foto no se guarda.
 */

export interface LoteEscaneado { k: string; lote: string; vencimiento: string; cantidad: string }
let sec = 0
const nuevaFila = (lote = '', vencimiento = '', cantidad = '1'): LoteEscaneado => ({ k: `e${++sec}`, lote, vencimiento, cantidad })
const RE_LOTE = /^[A-Z0-9][A-Z0-9\-/.]{0,49}$/
const RE_CANT = /^\d+([.,]\d{1,2})?$/
const ANCHO_MAX = 1280

function errorFila(f: LoteEscaneado, todas: LoteEscaneado[]): string {
    const l = normLote(f.lote)
    if (!RE_CANT.test(f.cantidad.trim()) || Number(f.cantidad.replace(',', '.')) <= 0) return 'Cantidad mayor a 0, hasta 2 decimales'
    if (l && !RE_LOTE.test(l)) return 'Lote: solo letras, números, guion, punto o barra'
    if (todas.some(x => x.k !== f.k && normLote(x.lote) === l)) return l ? 'Lote repetido' : 'Ya hay una fila sin lote'
    if (l && !f.vencimiento) return 'Indica el vencimiento'
    return ''
}

export function ModalCamaraLotes({ abierto, onCerrar, onAplicar, codigo, producto, unidad, lotesRef, corte }: {
    abierto: boolean
    onCerrar: () => void
    onAplicar: (filas: { lote: string; vencimiento: string; cantidad: number }[]) => void
    codigo: string
    producto?: string | null
    unidad?: string | null
    lotesRef: TomaLoteRef[]
    corte: string
}) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const archivoRef = useRef<HTMLInputElement>(null)
    const [camara, setCamara] = useState<'iniciando' | 'lista' | 'sin-permiso' | 'no-disponible'>('iniciando')
    const [leyendo, setLeyendo] = useState(false)
    const [aviso, setAviso] = useState('')
    const [ultimo, setUltimo] = useState<{ texto: string; ok: boolean } | null>(null)
    const [filas, setFilas] = useState<LoteEscaneado[]>([])
    const [activa, setActiva] = useState<string | null>(null)
    const [buscados, setBuscados] = useState<Record<string, TomaLoteBuscado>>({})
    const refPorLote = useMemo(() => new Map(lotesRef.filter(l => l.lote).map(l => [normLote(l.lote!), l])), [lotesRef])

    const detener = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    // Encender la cámara trasera al abrir; apagarla al cerrar
    useEffect(() => {
        if (!abierto) { detener(); return }
        setFilas([]); setActiva(null); setAviso(''); setUltimo(null); setCamara('iniciando')
        let vivo = true
        ;(async () => {
            if (!navigator.mediaDevices?.getUserMedia) { setCamara('no-disponible'); return }
            try {
                const s = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false,
                })
                if (!vivo) { s.getTracks().forEach(t => t.stop()); return }
                streamRef.current = s
                if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play().catch(() => {}) }
                setCamara('lista')
            } catch (e: any) {
                setCamara(e?.name === 'NotAllowedError' ? 'sin-permiso' : 'no-disponible')
            }
        })()
        return () => { vivo = false; detener() }
    }, [abierto, detener])

    /** Verifica en el kardex un lote que no está entre los lotes con saldo. */
    const verificar = useCallback(async (lote: string) => {
        const l = normLote(lote)
        if (!l || !RE_LOTE.test(l) || refPorLote.has(l) || buscados[l]) return
        try { const r = await TomaInventarioService.buscarLote(codigo, l); setBuscados(b => ({ ...b, [l]: r })) } catch { /* sin verificar */ }
    }, [codigo, refPorLote, buscados])

    /** Suma 1 al lote leído (o crea su fila) y completa el vencimiento conocido. */
    const sumarLectura = useCallback((lote: string, vencimiento: string) => {
        const l = normLote(lote)
        const vSistema = refPorLote.get(l)?.vencimiento ?? ''
        setFilas(prev => {
            const i = prev.findIndex(f => normLote(f.lote) === l)
            if (i >= 0) {
                const f = prev[i]
                const n = (Number(f.cantidad.replace(',', '.')) || 0) + 1
                const act = { ...f, cantidad: String(n), vencimiento: f.vencimiento || vencimiento || vSistema }
                setActiva(f.k)
                return prev.map((x, j) => j === i ? act : x)
            }
            const nueva = nuevaFila(l, vencimiento || vSistema)
            setActiva(nueva.k)
            return [nueva, ...prev]
        })
        if (l) verificar(l)
    }, [refPorLote, verificar])

    const enviarFoto = useCallback(async (foto: Blob) => {
        setLeyendo(true); setAviso('')
        try {
            const lotes = lotesRef.map(l => l.lote).filter(Boolean).join(',')
            const r = await TomaInventarioService.leerEtiqueta(foto, { producto: producto ?? '', lotes })
            if (!r.legible || (!r.lote && !r.vencimiento)) {
                setUltimo({ texto: r.textoVisto ? `Se vio: “${r.textoVisto}”` : 'No se distingue la etiqueta', ok: false })
                setAviso('No se pudo leer el lote. Acércate, enfoca la etiqueta y evita el reflejo.')
                return
            }
            sumarLectura(r.lote, r.vencimiento)
            setUltimo({ texto: `${r.lote || 'Sin lote'}${r.vencimiento ? ` · vence ${fechaDMY(r.vencimiento)}` : ''}  (+1)`, ok: true })
            if (navigator.vibrate) navigator.vibrate(60)
        } catch (e: any) {
            setAviso(e?.response?.data?.message || 'No se pudo leer la foto. Revisa tu conexión e inténtalo de nuevo.')
        } finally {
            setLeyendo(false)
        }
    }, [lotesRef, producto, sumarLectura])

    const capturar = useCallback(async () => {
        const v = videoRef.current
        if (!v || camara !== 'lista' || leyendo || !v.videoWidth) return
        const escala = Math.min(1, ANCHO_MAX / v.videoWidth)
        const c = document.createElement('canvas')
        c.width = Math.round(v.videoWidth * escala); c.height = Math.round(v.videoHeight * escala)
        c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
        const foto = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/jpeg', 0.85))
        if (foto) enviarFoto(foto)
    }, [camara, leyendo, enviarFoto])

    /** Sin cámara (o sin permiso): se puede tomar/subir una foto. */
    const subirFoto = async (file?: File) => {
        if (!file) return
        const img = await createImageBitmap(file).catch(() => null)
        if (!img) { setAviso('No se pudo abrir la imagen.'); return }
        const escala = Math.min(1, ANCHO_MAX / img.width)
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        const foto = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/jpeg', 0.85))
        if (foto) enviarFoto(foto)
    }

    const editar = (k: string, cambio: Partial<LoteEscaneado>) => setFilas(fs => fs.map(f => f.k === k ? { ...f, ...cambio } : f))
    const sumar = (k: string, d: number) => setFilas(fs => fs.map(f => {
        if (f.k !== k) return f
        const n = Math.max(0, Math.round(((Number(f.cantidad.replace(',', '.')) || 0) + d) * 100) / 100)
        return { ...f, cantidad: String(n) }
    }).filter(f => f.k !== k || Number(f.cantidad) > 0))
    const filaActiva = filas.find(f => f.k === activa) ?? filas[0]

    const errores = useMemo(() => Object.fromEntries(filas.map(f => [f.k, errorFila(f, filas)])), [filas])
    const hayError = Object.values(errores).some(Boolean)
    const total = filas.reduce((s, f) => s + (Number(f.cantidad.replace(',', '.')) || 0), 0)

    const aplicar = () => {
        if (hayError || !filas.length) return
        onAplicar(filas.map(f => ({ lote: normLote(f.lote), vencimiento: f.vencimiento, cantidad: Number(f.cantidad.replace(',', '.')) })))
        onCerrar()
    }

    const estadoLote = (f: LoteEscaneado) => {
        const l = normLote(f.lote)
        if (!l) return <span className="text-white/60">Sin lote</span>
        const ref = refPorLote.get(l)
        if (ref) return <span className="text-emerald-300"><CheckCircle2 className="mr-0.5 inline h-3 w-3" />En sistema{typeof ref.saldo === 'number' ? `: ${ref.saldo}` : ''}</span>
        const b = buscados[l]
        if (b?.existe) return <span className="text-emerald-300"><CheckCircle2 className="mr-0.5 inline h-3 w-3" />Existe en kardex</span>
        if (b && !b.existe) return <span className="font-medium text-amber-300"><Sparkles className="mr-0.5 inline h-3 w-3" />Lote nuevo</span>
        return <span className="text-white/60">Verificando…</span>
    }

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v) onCerrar() }}>
            <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 bg-black p-0 text-white [&>button]:hidden">
                <DialogTitle className="sr-only">Contar con cámara</DialogTitle>
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 bg-black/80 px-4 py-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{producto || codigo}</p>
                        <p className="font-mono text-[11px] text-white/60">{codigo}{unidad ? ` · ${unidad}` : ''} · cada captura suma 1</p>
                    </div>
                    <button type="button" onClick={onCerrar} className="rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Cerrar"><X className="h-5 w-5" /></button>
                </div>

                {/* Cámara (todo el recuadro) */}
                <div className="relative min-h-0 flex-1 bg-black">
                    <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                    {camara === 'lista' && (
                        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-32 -translate-y-1/2 rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                            <span className="absolute -top-6 left-0 right-0 text-center text-xs font-medium text-white">Pon aquí el lote y el vencimiento</span>
                        </div>
                    )}
                    {camara !== 'lista' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white/80">
                            {camara === 'iniciando' ? <><Loader2 className="h-8 w-8 animate-spin" />Encendiendo la cámara…</> : <>
                                <Camera className="h-10 w-10 opacity-60" />
                                {camara === 'sin-permiso' ? 'No diste permiso a la cámara. Actívalo en el candado del navegador o toma una foto:' : 'No se pudo usar la cámara en este equipo. Puedes tomar o subir una foto:'}
                                <button type="button" onClick={() => archivoRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold text-black">
                                    <ImageUp className="h-4 w-4" /> Tomar o subir foto
                                </button>
                            </>}
                        </div>
                    )}
                    <input ref={archivoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { subirFoto(e.target.files?.[0]); e.target.value = '' }} />
                    {leyendo && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><span className="inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Leyendo con IA…</span></div>}
                    {(ultimo || aviso) && (
                        <div className="absolute inset-x-3 bottom-3 space-y-1">
                            {ultimo && <p className={`rounded-lg px-3 py-1.5 text-xs font-medium ${ultimo.ok ? 'bg-emerald-600/90' : 'bg-black/70 text-white/80'}`}>{ultimo.texto}</p>}
                            {aviso && <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-medium text-black"><AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />{aviso}</p>}
                        </div>
                    )}
                </div>

                {/* Lo contado (editable) */}
                <div className="max-h-[38%] overflow-y-auto border-t border-white/10 bg-neutral-950 px-3 py-2">
                    {filas.length === 0 && <p className="py-2 text-center text-xs text-white/50">Captura la etiqueta: cada lectura suma 1 a su lote. Luego puedes editar lote, vencimiento y cantidad.</p>}
                    {filas.map(f => (
                        <div key={f.k} onClick={() => setActiva(f.k)} className={`mb-1.5 rounded-lg border px-2 py-1.5 ${f.k === filaActiva?.k ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-white/10'}`}>
                            <div className="flex items-center gap-1.5">
                                <Input value={f.lote} onChange={e => editar(f.k, { lote: e.target.value.toUpperCase() })} onBlur={() => verificar(f.lote)} placeholder="Lote" maxLength={50}
                                       className="h-8 min-w-0 flex-1 border-white/20 bg-white/5 px-2 font-mono text-xs uppercase text-white placeholder:text-white/40" aria-label="Lote" />
                                <Input type="date" value={f.vencimiento} onChange={e => editar(f.k, { vencimiento: e.target.value })} min="2000-01-01" max="2100-12-31"
                                       className="h-8 w-[8.25rem] shrink-0 border-white/20 bg-white/5 px-1.5 text-xs text-white [color-scheme:dark]" aria-label="Vencimiento" />
                                <button type="button" onClick={() => sumar(f.k, -1)} className="shrink-0 rounded-md bg-white/10 p-1.5 hover:bg-white/20" aria-label="Restar 1"><Minus className="h-3.5 w-3.5" /></button>
                                <Input value={f.cantidad} onChange={e => editar(f.k, { cantidad: e.target.value })} inputMode="decimal"
                                       className="h-8 w-14 shrink-0 border-white/20 bg-white/5 px-1 text-center font-mono text-sm font-bold text-white" aria-label="Cantidad" />
                                <button type="button" onClick={() => sumar(f.k, 1)} className="shrink-0 rounded-md bg-white/10 p-1.5 hover:bg-white/20" aria-label="Sumar 1"><Plus className="h-3.5 w-3.5" /></button>
                                <button type="button" onClick={() => setFilas(fs => fs.filter(x => x.k !== f.k))} className="shrink-0 rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Quitar"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            <div className="flex justify-between gap-2 pt-0.5 text-[10.5px]">
                                {estadoLote(f)}
                                {errores[f.k] ? <span className="text-amber-300">{errores[f.k]}</span>
                                    : f.vencimiento && corte && f.vencimiento < corte ? <span className="text-amber-300">Vencido</span> : null}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={() => { const n = nuevaFila('', '', '1'); setFilas(fs => [...fs, n]); setActiva(n.k) }}
                            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-white/70 hover:text-white"><Plus className="h-3 w-3" /> Agregar fila a mano</button>
                </div>

                {/* Botones */}
                <div className="flex items-center gap-2 border-t border-white/10 bg-black px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <button type="button" onClick={() => filaActiva && sumar(filaActiva.k, 1)} disabled={!filaActiva}
                            className="flex h-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/10 px-3 text-xs font-semibold disabled:opacity-40" title="Suma 1 al lote marcado sin volver a leer">
                        <span className="text-base leading-none">+1</span><span className="max-w-[5.5rem] truncate font-mono text-[10px] font-normal text-white/70">{filaActiva ? (normLote(filaActiva.lote) || 'sin lote') : 'mismo lote'}</span>
                    </button>
                    <button type="button" onClick={camara === 'lista' ? capturar : () => archivoRef.current?.click()} disabled={leyendo}
                            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-base font-bold text-black disabled:opacity-60">
                        {leyendo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />} Capturar
                    </button>
                    {filas.length > 0 && (
                        <button type="button" onClick={aplicar} disabled={hayError}
                                className="flex h-12 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                            Aplicar<span className="text-[10px] font-normal">{total} {unidad ?? ''}</span>
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
