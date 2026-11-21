'use client'

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Check, Loader2, AlertTriangle, Database, FileText, ListChecks, BookOpenCheck, Receipt, ClipboardCheck,
} from "lucide-react"

/**
 * Ventana que acompaña "Aceptar" en Planillas de cobranza: muestra, en el orden real en que
 * sp_ws_cajabco_planilla_aceptar (+ sp_ws_cajabco_centralizar) graba, cada tabla que se toca.
 * El servidor hace todo en una sola llamada; los pasos avanzan mientras espera y se cierran
 * con la respuesta real (éxito o error). Nunca marca "listo" algo que el servidor no confirmó.
 */

export interface FilaProgreso {
    id:        number
    cliente:   string
    documento: string
    importe:   number
    simbolo:   string
    caja:      string
}

export type EstadoProgreso =
    | { fase: 'grabando' }
    | { fase: 'listo'; aceptados: number; vouchers: number }
    | { fase: 'error'; mensaje: string; sinRespuesta: boolean }

const PASOS = [
    { tabla: 'planilla_detalle_caja', titulo: 'Revisando los cobros',      texto: 'Confirma que sigan pendientes y que cliente, caja y fecha estén completos.', icono: ClipboardCheck },
    { tabla: 'caja encabezado',       titulo: 'Abriendo el voucher',       texto: 'Un voucher por caja y por día; si ya existe, se reutiliza.',                 icono: FileText },
    { tabla: 'caja centralizacion',   titulo: 'Grabando las líneas',       texto: 'Una línea por cobro, con su documento, importe y cuenta del cliente.',      icono: ListChecks },
    { tabla: 'planilla_detalle_caja', titulo: 'Marcando como aceptados',   texto: 'Los cobros salen de pendientes y quedan enlazados a su voucher.',           icono: Check },
    { tabla: 'mayor auxiliar',        titulo: 'Generando el asiento',      texto: 'Se regenera el asiento contable del voucher (debe y haber cuadrados).',     icono: BookOpenCheck },
    { tabla: 'kardex clientes',       titulo: 'Cancelando las facturas',   texto: 'El pago baja el saldo de cada documento en la cuenta del cliente.',         icono: Receipt },
] as const

const MS_POR_PASO = 650

const money = (v: number) => v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
    abierto:  boolean
    filas:    FilaProgreso[]
    estado:   EstadoProgreso
    onCerrar: () => void
}

export function ProgresoAceptar({ abierto, filas, estado, onCerrar }: Props) {
    // paso visible: avanza solo mientras se graba; el último espera la respuesta del servidor.
    const [paso, setPaso] = useState(0)
    // la respuesta puede llegar antes que la animación: se guarda y se muestra al terminar el recorrido.
    const [mostrarFin, setMostrarFin] = useState(false)
    const inicio = useRef(0)

    useEffect(() => {
        if (!abierto) return
        setPaso(0)
        setMostrarFin(false)
        inicio.current = Date.now()
        const t = setInterval(() => setPaso(p => Math.min(p + 1, PASOS.length - 1)), MS_POR_PASO)
        return () => clearInterval(t)
    }, [abierto])

    useEffect(() => {
        if (!abierto || estado.fase === 'grabando') return
        if (estado.fase === 'error') { setMostrarFin(true); return }
        // éxito: deja terminar el recorrido para que se vea cada tabla.
        const falta = Math.max(0, PASOS.length * MS_POR_PASO - (Date.now() - inicio.current))
        const t = setTimeout(() => { setPaso(PASOS.length); setMostrarFin(true) }, falta)
        return () => clearTimeout(t)
    }, [abierto, estado])

    const grabando = !mostrarFin
    const ok = mostrarFin && estado.fase === 'listo'
    const fallo = mostrarFin && estado.fase === 'error'
    const total = filas.reduce((s, f) => s + f.importe, 0)
    const simbolo = filas[0]?.simbolo ?? 'S/'
    const avance = ok ? 100 : Math.round((Math.min(paso + 0.5, PASOS.length) / PASOS.length) * 100)
    // documentos "procesados" acompañan al avance para que la lista también se mueva.
    const docsHechos = ok ? filas.length : fallo ? 0 : Math.floor((filas.length * Math.min(paso, PASOS.length - 1)) / PASOS.length)

    return (
        <Dialog open={abierto} onOpenChange={v => { if (!v && !grabando) onCerrar() }}>
            <DialogContent
                className="max-w-2xl overflow-hidden p-0"
                onInteractOutside={e => { if (grabando) e.preventDefault() }}
                onEscapeKeyDown={e => { if (grabando) e.preventDefault() }}
            >
                {/* Cabecera con barra de avance */}
                <div className={`relative px-6 pb-4 pt-5 text-white transition-colors duration-500 ${fallo ? 'bg-gradient-to-r from-red-700 to-rose-600' : ok ? 'bg-gradient-to-r from-emerald-700 to-teal-600' : 'bg-gradient-to-r from-blue-800 to-indigo-600'}`}>
                    <DialogHeader className="space-y-1 text-left">
                        <DialogTitle className="flex items-center gap-2 text-lg text-white">
                            {fallo ? <AlertTriangle className="h-5 w-5" /> : ok ? <Check className="h-5 w-5 animate-in zoom-in duration-300" /> : <Database className="h-5 w-5 animate-pulse" />}
                            {fallo ? 'No se pudo aceptar' : ok ? 'Cobros aceptados' : 'Pasando los cobros al libro…'}
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            {filas.length} cobro{filas.length !== 1 ? 's' : ''} · {simbolo} {money(total)}
                            {ok && estado.fase === 'listo' && estado.vouchers > 0 && <> · {estado.vouchers} voucher{estado.vouchers !== 1 ? 's' : ''}</>}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${fallo ? 'bg-white/70' : 'bg-white'}`}
                            style={{ width: `${fallo ? 100 : avance}%` }}
                        />
                    </div>
                </div>

                <div className="grid gap-5 px-6 py-5 md:grid-cols-[1.25fr_1fr]">
                    {/* Pasos: una tabla por paso, en el orden real del servidor */}
                    <ol className="relative space-y-3">
                        {PASOS.map((p, i) => {
                            const hecho = ok || (grabando && i < paso)
                            const actual = grabando && i === paso
                            const Icono = p.icono
                            return (
                                <li
                                    key={i}
                                    className={`relative flex gap-3 transition-all duration-500 ${i <= paso || ok ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-40'}`}
                                >
                                    {i < PASOS.length - 1 && (
                                        <span className={`absolute left-[15px] top-8 h-[calc(100%-14px)] w-0.5 transition-colors duration-500 ${hecho ? 'bg-emerald-500' : 'bg-border'}`} />
                                    )}
                                    <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500
                                        ${hecho ? 'border-emerald-500 bg-emerald-500 text-white'
                                            : actual ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950'
                                                : fallo && i === paso ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950'
                                                    : 'border-border bg-background text-muted-foreground'}`}>
                                        {hecho ? <Check className="h-4 w-4 animate-in zoom-in duration-300" />
                                            : actual ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Icono className="h-4 w-4" />}
                                        {actual && <span className="absolute inset-0 animate-ping rounded-full border-2 border-blue-400/60" />}
                                    </span>
                                    <div className="min-w-0 pt-0.5">
                                        <p className={`text-sm font-semibold leading-tight ${actual ? 'text-blue-700 dark:text-blue-300' : ''}`}>{p.titulo}</p>
                                        <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                            <Database className="h-3 w-3" /> {p.tabla}
                                        </p>
                                        {actual && <p className="mt-1 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300">{p.texto}</p>}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>

                    {/* Documentos que se están pasando */}
                    <div className="flex min-h-0 flex-col rounded-lg border bg-muted/30">
                        <div className="flex items-center justify-between border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
                            <span>Documentos</span>
                            <span className="tabular-nums">{docsHechos}/{filas.length}</span>
                        </div>
                        <ul className="max-h-[300px] space-y-1 overflow-y-auto p-2">
                            {filas.map((f, i) => {
                                const listo = i < docsHechos
                                return (
                                    <li
                                        key={f.id}
                                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all duration-500 animate-in fade-in slide-in-from-right-2 ${listo ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-background'}`}
                                        style={{ animationDelay: `${Math.min(i, 12) * 60}ms`, animationFillMode: 'both' }}
                                    >
                                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${listo ? 'bg-emerald-500 text-white' : 'border border-border'}`}>
                                            {listo && <Check className="h-3 w-3" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">{f.cliente}</p>
                                            <p className="truncate font-mono text-[10.5px] text-muted-foreground">{f.documento} · {f.caja}</p>
                                        </div>
                                        <span className="shrink-0 font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{f.simbolo} {money(f.importe)}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>

                {/* Pie: resultado real */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-6 py-3">
                    <p className="text-xs text-muted-foreground">
                        {grabando && 'No cierres esta ventana mientras se graba.'}
                        {ok && estado.fase === 'listo' && <span className="text-emerald-700 dark:text-emerald-400">✓ {estado.aceptados} cobro{estado.aceptados !== 1 ? 's' : ''} en el libro y facturas canceladas en la cuenta del cliente.</span>}
                        {fallo && estado.fase === 'error' && <span className="text-red-600">{estado.mensaje} {estado.sinRespuesta ? 'No llegó respuesta del servidor: revisa Pendientes e Historial antes de volver a intentar.' : 'No se grabó nada: los cobros siguen pendientes.'}</span>}
                    </p>
                    <Button onClick={onCerrar} disabled={grabando} className={ok ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                        {grabando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Grabando…</> : 'Listo'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
