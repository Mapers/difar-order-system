import { CalendarClock, Tag } from "lucide-react"
import { fechaDMY } from "@/components/contabilidad/comisiones/ui"
import { TomaLoteRef } from "@/app/types/toma-inventario-types"

const DIA = 24 * 60 * 60 * 1000
const POR_VENCER_DIAS = 90

type EstadoLote = 'vencido' | 'porVencer' | 'vigente' | 'sinFecha'

function estadoLote(vencimiento: string | null, corte: string): { estado: EstadoLote; dias: number | null } {
    if (!vencimiento) return { estado: 'sinFecha', dias: null }
    const dias = Math.round((Date.parse(vencimiento.slice(0, 10)) - Date.parse(corte.slice(0, 10))) / DIA)
    if (dias < 0) return { estado: 'vencido', dias }
    if (dias <= POR_VENCER_DIAS) return { estado: 'porVencer', dias }
    return { estado: 'vigente', dias }
}

const ESTILO: Record<EstadoLote, string> = {
    vencido:   'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300',
    porVencer: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300',
    vigente:   'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300',
    sinFecha:  'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
}

function ayuda(estado: EstadoLote, dias: number | null) {
    if (estado === 'vencido') return `Vencido hace ${Math.abs(dias!)} días`
    if (estado === 'porVencer') return dias === 0 ? 'Vence hoy' : `Vence en ${dias} días`
    if (estado === 'vigente') return `Vigente (${dias} días)`
    return 'Sin fecha de vencimiento'
}

/** Etiqueta "lote · vence" con color según el vencimiento (rojo vencido, ámbar ≤ 90 días, verde vigente). */
export function LoteBadge({ lote, vencimiento, corte, saldo }: TomaLoteRef & { corte: string }) {
    const { estado, dias } = estadoLote(vencimiento, corte)
    return (
        <span title={`${lote ? `Lote ${lote}` : 'Sin lote'} · ${ayuda(estado, dias)}${saldo !== undefined ? ` · saldo ${saldo}` : ''}`}
              className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 ${ESTILO[estado]}`}>
            <Tag className="h-3 w-3 shrink-0 opacity-70" />
            <span className="truncate font-mono">{lote || 's/lote'}</span>
            <span className="opacity-40">·</span>
            <CalendarClock className="h-3 w-3 shrink-0 opacity-70" />
            <span className="font-mono">{vencimiento ? fechaDMY(vencimiento) : 's/f'}</span>
        </span>
    )
}

/** Lista de etiquetas de lote; si no hay lotes con saldo, una etiqueta gris. */
export function LotesBadges({ lotes, corte, max = 4 }: { lotes: TomaLoteRef[]; corte: string; max?: number }) {
    if (!lotes?.length) {
        return <span className="inline-flex rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground">Sin lote con saldo</span>
    }
    const visibles = lotes.slice(0, max)
    return (
        <span className="flex flex-wrap gap-1">
            {visibles.map((l, i) => <LoteBadge key={`${l.lote}-${i}`} {...l} corte={corte} />)}
            {lotes.length > max && (
                <span title={lotes.slice(max).map(l => `${l.lote || 's/lote'} ${fechaDMY(l.vencimiento)}`).join('\n')}
                      className="inline-flex rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">+{lotes.length - max}</span>
            )}
        </span>
    )
}

/** Texto para PDF: "JK2504 (30/10/2028), S25 (30/04/2027) +1". */
export function lotesTexto(lotes: TomaLoteRef[], max = 2) {
    if (!lotes?.length) return ''
    const t = lotes.slice(0, max).map(l => `${l.lote || 's/lote'}${l.vencimiento ? ` (${fechaDMY(l.vencimiento)})` : ''}`).join(', ')
    return lotes.length > max ? `${t} +${lotes.length - max}` : t
}

export const loteVencido = (vencimiento: string | null, corte: string) => estadoLote(vencimiento, corte).estado === 'vencido'
