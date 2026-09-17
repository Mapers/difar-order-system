'use client'

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Upload } from "lucide-react"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/app/hooks/useToast"
import apiClient from "@/app/api/client"
import { IClient } from "@/app/types/order/client-interface"
import { MetaColumn, downloadMetaTemplate, parseMetaTemplate } from "./metas/metaExcel"

interface Props {
    clientes: IClient[]
    onDone: () => void
}

interface ErrorFila {
    fila: number
    motivo: string
}

const COLUMNAS: MetaColumn[] = [
    { header: "Código",           key: "codigo",        width: 14, prefill: (c: IClient) => c.codigo },
    { header: "Cliente",          key: "cliente",       width: 38, prefill: (c: IClient) => c.Nombre },
    { header: "RUC",              key: "ruc",           width: 16, prefill: (c: IClient) => c.RUC },
    { header: "Vendedor",         key: "vendedor",      width: 26, prefill: (c: IClient) => (c.Vendedor || "").trim() },
    {
        header: "Línea de Crédito",
        key: "linea_credito",
        width: 18,
        prefill: (c: IClient) => Number(c.LineaCredito) || 0,
        editable: true,
        required: true,
    },
]

const LOTE = 500

const hoy = () => new Date().toISOString().slice(0, 10)

export default function CreditLineExcelButtons({ clientes, onDone }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [exportando, setExportando] = useState(false)
    const [importando, setImportando] = useState(false)
    const [resumen, setResumen] = useState<{
        actualizadas: number
        omitidas: number
        errores: ErrorFila[]
    } | null>(null)

    const exportar = async () => {
        if (clientes.length === 0) {
            toast({ title: "Exportar", description: "No hay clientes que exportar con los filtros actuales", variant: "warning" })
            return
        }
        setExportando(true)
        try {
            await downloadMetaTemplate({
                fileName: `lineas-credito-${hoy()}.xlsx`,
                sheetName: "Líneas de crédito",
                columns: COLUMNAS,
                entities: clientes,
            })
        } catch {
            toast({ title: "Exportar", description: "No se pudo generar el archivo", variant: "error" })
        } finally {
            setExportando(false)
        }
    }

    const procesar = async (file: File) => {
        const filas = await parseMetaTemplate(file, COLUMNAS)

        const actual = new Map(clientes.map(c => [String(c.codigo).trim(), Number(c.LineaCredito) || 0]))

        const items: { codigo: string; linea_credito: number }[] = []
        const filaDe = new Map<string, number>()
        const errores: ErrorFila[] = []
        let omitidas = 0

        for (const f of filas) {
            const codigo = (f.record.codigo || "").trim()
            const crudo  = (f.record.linea_credito || "").trim()

            if (!codigo && !crudo) continue

            if (!codigo) {
                errores.push({ fila: f.fila, motivo: "Sin código de cliente" })
                continue
            }
            if (!crudo) {
                errores.push({ fila: f.fila, motivo: "Línea de crédito vacía" })
                continue
            }

            const monto = Number(crudo.replace(/,/g, ""))
            if (!Number.isFinite(monto)) {
                errores.push({ fila: f.fila, motivo: `"${crudo}" no es un monto válido` })
                continue
            }
            if (monto < 0) {
                errores.push({ fila: f.fila, motivo: "El monto no puede ser negativo" })
                continue
            }
            if (!actual.has(codigo)) {
                errores.push({ fila: f.fila, motivo: `El cliente ${codigo} no está en el listado cargado` })
                continue
            }
            if (Math.abs((actual.get(codigo) ?? 0) - monto) < 0.005) {
                omitidas++
                continue
            }

            items.push({ codigo, linea_credito: Number(monto.toFixed(2)) })
            filaDe.set(codigo, f.fila)
        }

        let actualizadas = 0
        for (let i = 0; i < items.length; i += LOTE) {
            const res = await apiClient.post("/admin/credit-lines/bulk", { items: items.slice(i, i + LOTE) })
            const cuerpo = res.data?.data ?? res.data
            actualizadas += Number(cuerpo?.actualizados) || 0
            for (const e of (cuerpo?.errores ?? [])) {
                errores.push({ fila: filaDe.get(String(e.codigo)) ?? 0, motivo: e.motivo })
            }
        }

        errores.sort((a, b) => a.fila - b.fila)
        setResumen({ actualizadas, omitidas, errores })
        if (actualizadas > 0) onDone()
    }

    const alElegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        setImportando(true)
        try {
            await procesar(file)
        } catch (error: any) {
            toast({
                title: "Importar",
                description: error?.response?.data?.message || "No se pudo procesar el archivo",
                variant: "error",
            })
        } finally {
            setImportando(false)
        }
    }

    return (
        <>
            <Button
                variant="outline" size="sm" onClick={exportar}
                disabled={exportando || importando} className="h-9 gap-1.5"
            >
                {exportando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Exportar
            </Button>
            <Button
                variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                disabled={exportando || importando} className="h-9 gap-1.5"
            >
                {importando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importar
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={alElegirArchivo}
            />

            <Dialog open={!!resumen} onOpenChange={(o) => !o && setResumen(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Resultado de la importación</DialogTitle>
                    </DialogHeader>
                    {resumen && (
                        <div className="space-y-2 text-sm">
                            <p className="text-green-700">✅ Actualizadas: <b>{resumen.actualizadas}</b></p>
                            {resumen.omitidas > 0 && (
                                <p className="text-muted-foreground">
                                    Sin cambios: <b>{resumen.omitidas}</b> (el monto del archivo era el mismo)
                                </p>
                            )}
                            {resumen.errores.length > 0 && (
                                <div className="text-red-600">
                                    <p>❌ Con error: <b>{resumen.errores.length}</b></p>
                                    <div className="mt-1 max-h-40 overflow-y-auto rounded border bg-muted p-2 text-xs text-foreground">
                                        {resumen.errores.map((er, i) => (
                                            <p key={i}>{er.fila > 0 ? `Fila ${er.fila}: ` : ""}{er.motivo}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {resumen.actualizadas === 0 && resumen.omitidas === 0 && resumen.errores.length === 0 && (
                                <p className="text-muted-foreground">No se encontraron filas para importar.</p>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setResumen(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
