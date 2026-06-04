"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload, RefreshCw } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/app/hooks/useToast"
import { MetaColumn, downloadMetaTemplate, parseMetaTemplate } from "./metaExcel"

export interface BulkResult {
  total?: number
  creados?: number
  errores?: { fila: number; motivo: string }[]
}

interface Props {
  fileBaseName: string
  sheetName: string
  columns: MetaColumn[]
  disabled?: boolean
  disabledHint?: string
  /** carga las entidades para pre-llenar la plantilla. */
  loadEntities: () => Promise<any[]>
  /** convierte una fila parseada en el item del payload (sin el padre). */
  rowToItem: (record: Record<string, string>) => any
  /** envía los items al endpoint batch y devuelve el resumen. */
  submit: (items: any[]) => Promise<BulkResult>
  /** se llama tras importar (para refrescar la lista). */
  onDone?: () => void
}

export function MetaExcelButtons({
  fileBaseName, sheetName, columns, disabled, disabledHint,
  loadEntities, rowToItem, submit, onDone,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [summary, setSummary] = useState<{
    creados: number; omitidas: number; errores: { fila: number; motivo: string }[]
  } | null>(null)

  const warnDisabled = () => {
    if (disabledHint) toast({ title: "Metas", description: disabledHint, variant: "warning" })
  }

  const handleExport = async () => {
    if (disabled) return warnDisabled()
    setExporting(true)
    try {
      const entities = await loadEntities()
      if (!entities.length) {
        toast({ title: "Plantilla", description: "No hay datos para generar la plantilla", variant: "warning" })
        return
      }
      await downloadMetaTemplate({ fileName: `${fileBaseName}.xlsx`, sheetName, columns, entities })
    } catch {
      toast({ title: "Plantilla", description: "No se pudo generar la plantilla", variant: "error" })
    } finally { setExporting(false) }
  }

  const handleImportClick = () => {
    if (disabled) return warnDisabled()
    fileInputRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setImporting(true)
    try {
      const rows = await parseMetaTemplate(file, columns)
      const tocadas = rows.filter(r => !r.isEmpty)
      const validas = tocadas.filter(r => r.missingRequired.length === 0)
      const omitidas = tocadas.length - validas.length

      if (!validas.length) {
        setSummary({ creados: 0, omitidas, errores: [] })
        return
      }

      const items = validas.map(r => ({ ...rowToItem(r.record), __fila: r.fila }))
      const res = await submit(items)
      setSummary({
        creados: res?.creados ?? 0,
        omitidas,
        errores: res?.errores ?? [],
      })
      onDone?.()
    } catch {
      toast({ title: "Importar", description: "No se pudo procesar el archivo", variant: "error" })
    } finally { setImporting(false) }
  }

  return (
    <>
      <Button
        variant="outline" size="sm" onClick={handleExport}
        disabled={exporting} className="h-9 gap-1.5"
      >
        {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Plantilla
      </Button>
      <Button
        variant="outline" size="sm" onClick={handleImportClick}
        disabled={importing} className="h-9 gap-1.5"
      >
        {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Importar
      </Button>
      <input
        ref={fileInputRef} type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden" onChange={handleFile}
      />

      <Dialog open={!!summary} onOpenChange={(o) => !o && setSummary(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resultado de importación</DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="space-y-2 text-sm">
              <p className="text-green-700">✅ Creadas: <b>{summary.creados}</b></p>
              {summary.omitidas > 0 && (
                <p className="text-amber-600">⚠️ Omitidas (incompletas): <b>{summary.omitidas}</b></p>
              )}
              {summary.errores.length > 0 && (
                <div className="text-red-600">
                  <p>❌ Con error: <b>{summary.errores.length}</b></p>
                  <div className="mt-1 max-h-40 overflow-y-auto rounded border bg-slate-50 p-2 text-xs text-slate-700">
                    {summary.errores.map((er, i) => (
                      <p key={i}>Fila {er.fila}: {er.motivo}</p>
                    ))}
                  </div>
                </div>
              )}
              {summary.creados === 0 && summary.omitidas === 0 && summary.errores.length === 0 && (
                <p className="text-slate-500">No se encontraron filas para importar.</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSummary(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
