'use client'

import { CloudUpload, CloudOff, Check, Loader2, History, RotateCcw, Trash2, AlertTriangle } from "lucide-react"
import type { EstadoBorrador } from "./useBorradorServidor"
import type { ResumenBorrador } from "@/lib/borradorContable"

const hora = (v: string | Date | null) => {
    if (!v) return ''
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const partes = (r: ResumenBorrador) => [
    r.nuevas && `${r.nuevas} nueva${r.nuevas === 1 ? '' : 's'}`,
    r.editadas && `${r.editadas} editada${r.editadas === 1 ? '' : 's'}`,
    r.eliminadas && `${r.eliminadas} para eliminar`,
].filter(Boolean).join(' · ')

/** Aviso de que hay cambios sin grabar guardados en el servidor, con Recuperar / Descartar. */
export function BannerBorrador({ resumen, actualizado, cabeceraCambiada, onRecuperar, onDescartar, ocupado }: {
    resumen: ResumenBorrador
    actualizado: string | null
    cabeceraCambiada?: boolean
    onRecuperar: () => void
    onDescartar: () => void
    ocupado?: boolean
}) {
    const detalle = [cabeceraCambiada && 'datos de la cabecera', partes(resumen)].filter(Boolean).join(' · ')
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-md shadow-amber-500/10 animate-in fade-in-0 slide-in-from-top-2 dark:border-amber-800 dark:bg-amber-950/40 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm"><History className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Tienes cambios sin grabar de este documento</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                    {detalle || 'Cambios pendientes'}{actualizado ? ` · guardado el ${hora(actualizado)}` : ''}
                </p>
            </div>
            <div className="flex shrink-0 gap-2">
                <button type="button" disabled={ocupado} onClick={onDescartar}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-transparent dark:text-amber-100">
                    <Trash2 className="h-4 w-4" /> Descartar
                </button>
                <button type="button" disabled={ocupado} onClick={onRecuperar} autoFocus
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60">
                    {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Recuperar
                </button>
            </div>
        </div>
    )
}

/** Líneas del borrador que no se pudieron aplicar porque alguien cambió o borró la línea en la base. */
export function ConflictosBorrador({ items, onCerrar }: { items: string[]; onCerrar: () => void }) {
    if (!items.length) return null
    return (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                        {items.length === 1 ? 'Un cambio no se aplicó' : `${items.length} cambios no se aplicaron`}: otra persona modificó o eliminó esas líneas después
                    </p>
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-amber-800 dark:text-amber-200">
                        {items.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                    <p className="mt-1.5 text-amber-800 dark:text-amber-200">Se dejó lo que está en la base. Revísalas y vuelve a hacer el cambio si corresponde.</p>
                </div>
                <button type="button" onClick={onCerrar} className="rounded-md px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:text-amber-100">Entendido</button>
            </div>
        </div>
    )
}

/** Indicador pequeño del autoguardado del borrador. */
export function IndicadorBorrador({ estado, guardadoEn }: { estado: EstadoBorrador; guardadoEn: Date | null }) {
    if (estado === 'inactivo') return null
    const ver = {
        pendiente: { icono: CloudUpload, texto: 'Cambios sin grabar', clase: 'text-muted-foreground' },
        guardando: { icono: Loader2, texto: 'Guardando borrador…', clase: 'text-blue-600 [&_svg]:animate-spin' },
        guardado: { icono: Check, texto: `Borrador guardado ${guardadoEn ? guardadoEn.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}`, clase: 'text-emerald-600' },
        error: { icono: CloudOff, texto: 'No se pudo guardar el borrador; se reintentará', clase: 'text-amber-600' },
    }[estado]
    const Icono = ver.icono
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${ver.clase}`} title="Tus cambios se guardan solos hasta que pulses Guardar">
            <Icono className="h-3.5 w-3.5" /> {ver.texto}
        </span>
    )
}
