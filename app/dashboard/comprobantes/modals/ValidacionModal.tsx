'use client'

import { useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, Loader2, AlertTriangle, CheckCircle2, FileSearch, ChevronDown, ChevronUp } from 'lucide-react'
import ExcelJS from 'exceljs'
import { parseISO, addHours, format } from 'date-fns'
import { Comprobante } from '@/app/types/order/order-interface'

type FilaSistema = {
    key        : string
    serie      : string
    numero     : string
    tipoDoc    : string
    fecha      : string
    cliente    : string
    nroDocIdent: string
    biGravada  : number
    igv        : number
    total      : number
}

type FilaArchivo = {
    key        : string
    serie      : string
    numero     : string
    tipoDoc    : string
    fecha      : string
    cliente    : string
    nroDocIdent: string
    biGravada  : number
    igv        : number
    total      : number
    rowNum     : number
}

type Diferencia = {
    key          : string
    serie        : string
    numero       : string
    campo        : string
    sistemaValor : number
    archivoValor : number
    diferencia   : number
}

type Resultado = {
    totalSistema  : number
    totalArchivo  : number
    soloEnSistema : FilaSistema[]
    diferencias   : Diferencia[]
}

function safeDate(str: string | null | undefined, offset = 0): string {
    if (!str) return '—'
    try {
        const d = offset ? addHours(parseISO(str), offset) : parseISO(str)
        return format(d, 'dd/MM/yyyy')
    } catch { return '—' }
}

function toNum(v: any): number {
    const n = Number(String(v ?? '').replace(/,/g, '.').trim())
    return isNaN(n) ? 0 : n
}

function toStr(v: any): string {
    return v != null ? String(v).trim() : ''
}

function makeKey(serie: string, numero: string): string {
    const numPadded = numero.trim().padStart(8, '0')
    return `${serie.trim().toUpperCase()}-${numPadded}`
}

function parseRowCols(cols: any[], rowNum: number): FilaArchivo | null {
    const serie  = toStr(cols[7])
    const numero = toStr(cols[8])
    if (!serie && !numero) return null
    return {
        key        : makeKey(serie, numero),
        serie,
        numero,
        tipoDoc    : toStr(cols[6]),
        fecha      : toStr(cols[4]),
        cliente    : toStr(cols[12]),
        nroDocIdent: toStr(cols[11]),
        biGravada  : toNum(cols[14]),
        igv        : toNum(cols[16]),
        total      : toNum(cols[25]),
        rowNum,
    }
}

async function parseExcelFile(file: File): Promise<FilaArchivo[]> {
    const buffer   = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const ws  = workbook.worksheets[0]
    const rows: FilaArchivo[] = []

    ws.eachRow((row, rowNum) => {
        const vals  = row.values as any[] // ExcelJS: 1-indexed, vals[0] = undefined
        const first = toStr(vals[1])
        if (rowNum === 1 && isNaN(Number(first))) return
        const cols = vals.slice(1) // convertir a 0-indexed
        const fila = parseRowCols(cols, rowNum)
        if (fila) rows.push(fila)
    })

    return rows
}

async function parseCsvFile(file: File): Promise<FilaArchivo[]> {
    const text  = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    const rows  : FilaArchivo[] = []

    lines.forEach((line, i) => {
        const sep  = line.includes('|') ? '|' : ','
        const cols = line.split(sep).map(c => c.trim())
        if (i === 0 && isNaN(Number(cols[0]))) return // saltar cabecera
        const fila = parseRowCols(cols, i + 1)
        if (fila) rows.push(fila)
    })

    return rows
}

async function parseFile(file: File): Promise<FilaArchivo[]> {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx') return parseExcelFile(file)
    if (ext === 'csv' || ext === 'txt') return parseCsvFile(file)
    throw new Error(`Formato ".${ext}" no soportado. Use .xlsx, .csv o .txt`)
}

function buildSistemaData(data: Comprobante[]): FilaSistema[] {
    const sistemaMap = new Map<string, FilaSistema>()

    for (const c of data) {
        if (c.idSunat === null) continue
        if (c.aceptada_por_sunat != null && c.aceptada_por_sunat === 104) continue

        const serie  = c.serie
        const numero = c.numero
        const key     = makeKey(serie, numero)
        const base    = Number(c.total_gravada || 0)
        const igv     = Number(c.total_igv    || 0)
        const total   = Number(c.total        || 0)
        const tipoDoc = c.tipo_comprobante === 1 ? 'FAC' : c.tipo_comprobante === 3 ? 'BOL' : toStr(c.tipo_comprobante)

        sistemaMap.set(key, {
            key,
            serie,
            numero,
            tipoDoc,
            fecha      : safeDate(c.fecha_envio, 5),
            cliente    : c.cliente_denominacion ?? '—',
            nroDocIdent: c.cliente_numdoc       ?? '—',
            biGravada  : Number((c.anulado ? 0 : base).toFixed(2)),
            igv        : Number((c.anulado ? 0 : igv).toFixed(2)),
            total      : Number((c.anulado ? 0 : total).toFixed(2)),
        })
    }

    return Array.from(sistemaMap.values())
}

function comparar(sistemaData: FilaSistema[], archivoData: FilaArchivo[]): Resultado {
    const sistemaMap = new Map(sistemaData.map(f => [f.key, f]))
    const archivoMap = new Map(archivoData.map(f => [f.key, f]))

    const soloEnSistema: FilaSistema[] = []
    const diferencias  : Diferencia[]  = []

    sistemaMap.forEach((sis, key) => {
        const arch = archivoMap.get(key)
        if (!arch) {
            soloEnSistema.push(sis)
        } else {
            const chk = (campo: string, sv: number, av: number) => {
                if (Math.abs(sv - av) > 0.01)
                    diferencias.push({ key, serie: sis.serie, numero: sis.numero, campo, sistemaValor: sv, archivoValor: av, diferencia: sv - av })
            }
            chk('BI Gravada', sis.biGravada, arch.biGravada)
            chk('IGV / IPM',  sis.igv,       arch.igv)
            chk('Total CP',   sis.total,      arch.total)
        }
    })

    return { totalSistema: sistemaMap.size, totalArchivo: archivoMap.size, soloEnSistema, diferencias }
}


function SummaryCard({ label, value, variant }: { label: string; value: number; variant: 'blue' | 'slate' | 'orange' | 'red' | 'green' }) {
    const colors = {
        blue  : 'border-blue-200 bg-blue-50 text-blue-700',
        slate : 'border-border bg-muted text-foreground',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        red   : 'border-red-200 bg-red-50 text-red-700',
        green : 'border-green-200 bg-green-50 text-green-700',
    }
    return (
        <div className={`rounded-lg border p-3 text-center ${colors[variant]}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs mt-0.5 opacity-80">{label}</p>
        </div>
    )
}

function CollapsibleSection({ title, badge, children, defaultOpen = true }: {
    title      : string
    badge      : number
    children   : React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted hover:bg-accent transition-colors text-sm font-medium text-foreground"
            >
                <span className="flex items-center gap-2">
                    {title}
                    <Badge variant="destructive" className="text-[10px] px-1.5">{badge}</Badge>
                </span>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {open && <div className="overflow-x-auto">{children}</div>}
        </div>
    )
}

const TH = ({ children }: { children: React.ReactNode }) => (
    // Static slate tone (not a theme token): this header sits on a static, non-dark-aware
    // colored `<thead>` (bg-orange-50 / bg-red-50) that never changes with the theme, so the
    // text must stay a fixed readable shade instead of reacting to dark mode.
    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{children}</th>
)
const TD = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <td className={`px-3 py-1.5 text-xs ${className}`}>{children}</td>
)

interface ValidacionModalProps {
    open        : boolean
    onOpenChange: (open: boolean) => void
    data        : Comprobante[]
}

export function ValidacionModal({ open, onOpenChange, data }: ValidacionModalProps) {
    const [file,      setFile]      = useState<File | null>(null)
    const [loading,   setLoading]   = useState(false)
    const [error,     setError]     = useState<string | null>(null)
    const [resultado, setResultado] = useState<Resultado | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFile = useCallback((f: File) => {
        setFile(f)
        setError(null)
        setResultado(null)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
    }, [handleFile])

    const handleValidar = async () => {
        if (!file) { setError('Seleccione un archivo antes de validar'); return }
        setLoading(true)
        setError(null)
        setResultado(null)

        try {
            const archivoData = await parseFile(file)

            if (archivoData.length === 0) {
                setError('No se encontraron registros en el archivo. Verifique el formato (XLSX, CSV o TXT con separador "|" o ",").')
                return
            }

            const sistemaData = buildSistemaData(data)
            setResultado(comparar(sistemaData, archivoData))
        } catch (e: any) {
            setError(e?.message ?? 'Error al procesar el archivo')
        } finally {
            setLoading(false)
        }
    }

    const clean = () => { setFile(null); setError(null); setResultado(null) }

    const todoOk = resultado
        && resultado.soloEnSistema.length === 0
        && resultado.diferencias.length   === 0

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) clean() }}>
            <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-0 gap-0">

                <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <FileSearch className="h-5 w-5 text-blue-600" />
                        Validar comprobantes con archivo SUNAT (PLE 14.1)
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                    {/* ── Form ──────────────────────────────────────────── */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Archivo de ventas SUNAT (.xlsx / .csv / .txt)</Label>
                        <div
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-lg px-4 py-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center gap-3"
                        >
                            <Upload className="h-5 w-5 text-muted-foreground shrink-0" />
                            <span className="text-sm text-muted-foreground truncate">
                                {file
                                    ? <span className="text-blue-700 font-medium">{file.name}</span>
                                    : 'Arrastra el archivo o haz clic para seleccionar'
                                }
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.csv,.txt"
                                className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleValidar} disabled={loading || !file} className="flex items-center gap-2">
                            {loading
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando...</>
                                : <><FileSearch className="h-4 w-4" /> Validar</>
                            }
                        </Button>
                    </div>

                    {/* ── Error ─────────────────────────────────────────── */}
                    {error && (
                        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* ── Results ───────────────────────────────────────── */}
                    {resultado && (
                        <div className="space-y-4">

                            {/* Summary cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <SummaryCard label="En sistema"     value={resultado.totalSistema}       variant="blue" />
                                <SummaryCard label="En archivo"     value={resultado.totalArchivo}       variant="slate" />
                                <SummaryCard
                                    label="No encontrados"
                                    value={resultado.soloEnSistema.length}
                                    variant={resultado.soloEnSistema.length > 0 ? 'orange' : 'green'}
                                />
                                <SummaryCard
                                    label="Con diferencias"
                                    value={resultado.diferencias.length}
                                    variant={resultado.diferencias.length > 0 ? 'red' : 'green'}
                                />
                            </div>

                            {todoOk && (
                                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    Todos los documentos del sistema coinciden correctamente con el archivo SUNAT.
                                </div>
                            )}

                            {/* Table: only in system */}
                            {resultado.soloEnSistema.length > 0 && (
                                <CollapsibleSection title="En sistema, NO en archivo SUNAT" badge={resultado.soloEnSistema.length}>
                                    <table className="w-full">
                                        <thead className="bg-orange-50 border-b border-orange-100">
                                            <tr>
                                                <TH>Serie</TH>
                                                <TH>Número</TH>
                                                <TH>Tipo</TH>
                                                <TH>Fecha</TH>
                                                <TH>Cliente</TH>
                                                <TH>RUC / DNI</TH>
                                                <TH>BI Gravada</TH>
                                                <TH>IGV</TH>
                                                <TH>Total</TH>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {resultado.soloEnSistema.map((f, i) => (
                                                <tr key={f.key} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/60'}>
                                                    <TD>{f.serie}</TD>
                                                    <TD>{f.numero}</TD>
                                                    <TD>{f.tipoDoc}</TD>
                                                    <TD className="whitespace-nowrap">{f.fecha}</TD>
                                                    <TD className="max-w-[200px] truncate">{f.cliente}</TD>
                                                    <TD>{f.nroDocIdent}</TD>
                                                    <TD className="text-right tabular-nums">{f.biGravada.toFixed(2)}</TD>
                                                    <TD className="text-right tabular-nums">{f.igv.toFixed(2)}</TD>
                                                    <TD className="text-right tabular-nums font-medium">{f.total.toFixed(2)}</TD>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CollapsibleSection>
                            )}

                            {/* Table: amount differences */}
                            {resultado.diferencias.length > 0 && (
                                <CollapsibleSection title="Documentos con datos distintos" badge={resultado.diferencias.length}>
                                    <table className="w-full">
                                        <thead className="bg-red-50 border-b border-red-100">
                                            <tr>
                                                <TH>Serie</TH>
                                                <TH>Número</TH>
                                                <TH>Campo</TH>
                                                <TH>Valor sistema</TH>
                                                <TH>Valor archivo</TH>
                                                <TH>Diferencia</TH>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {resultado.diferencias.map((d, i) => (
                                                <tr key={`${d.key}-${d.campo}`} className={i % 2 === 0 ? 'bg-background' : 'bg-red-50/30'}>
                                                    <TD>{d.serie}</TD>
                                                    <TD>{d.numero}</TD>
                                                    <TD className="font-medium text-foreground">{d.campo}</TD>
                                                    <TD className="text-right tabular-nums">{d.sistemaValor.toFixed(2)}</TD>
                                                    <TD className="text-right tabular-nums">{d.archivoValor.toFixed(2)}</TD>
                                                    <TD className={`text-right tabular-nums font-semibold ${d.diferencia > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                                                        {d.diferencia > 0 ? '+' : ''}{d.diferencia.toFixed(2)}
                                                    </TD>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CollapsibleSection>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
