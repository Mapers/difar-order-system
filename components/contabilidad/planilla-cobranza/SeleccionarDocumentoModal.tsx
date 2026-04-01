'use client'

import { useState, useEffect } from 'react'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import {
    FileText, Search, CheckCircle,
    Loader2, AlertCircle, ArrowRight, Calendar,
} from 'lucide-react'
import apiClient from '@/app/api/client'
import { format, parseISO } from 'date-fns'

export interface DocumentoCliente {
    IdKardexClientes:  number
    CodVend:           string
    nomVend:           string
    Cod_Clie:          string
    Nombre:            string
    NombreComercial:   string
    Fecha_Emision:     string
    Fecha_Vcto:        string
    Fecha_Amortizacion: string | null
    Tipo_Doc:          string
    Abre_Doc:          string
    SerieDoc:          string
    NumeroDoc:         string
    documento_completo: string
    Tipo_Moneda:       string
    Simb_Moneda:       string
    Provision:         number
    Amortizacion:      number
    saldo_pendiente:   number
}

interface Props {
    open:            boolean
    onOpenChange:    (v: boolean) => void
    codCliente:      string
    codVendedor?:    string
    soloVigentes?:   boolean
    onSelect:        (doc: DocumentoCliente) => void
}

function fmtFecha(f: string | null) {
    if (!f) return '—'
    try { return format(parseISO(f), 'dd/MM/yyyy') } catch { return f }
}

function fmtMoney(v: number, simb = 'S/') {
    return `${simb} ${Number(v).toFixed(2)}`
}

export function SeleccionarDocumentoModal({
                                              open, onOpenChange,
                                              codCliente, codVendedor,
                                              soloVigentes = false,
                                              onSelect,
                                          }: Props) {
    const [docs,      setDocs]      = useState<DocumentoCliente[]>([])
    const [loading,   setLoading]   = useState(false)
    const [error,     setError]     = useState('')
    const [search,    setSearch]    = useState('')
    const [selected,  setSelected]  = useState<DocumentoCliente | null>(null)

    useEffect(() => {
        if (!open || !codCliente) return
        setSelected(null)
        setSearch('')
        setError('')
        fetchDocs()
    }, [open, codCliente])

    const fetchDocs = async () => {
        setLoading(true)
        setError('')
        try {
            const params = new URLSearchParams({ cod_clie: codCliente })
            if (codVendedor) params.append('cod_vend', codVendedor)
            if (soloVigentes) params.append('solo_vigentes', '1')

            const res = await apiClient.get(`/planilla-cobranza/documentos-cliente?${params}`)

            setDocs(res.data?.data?.data ?? [])
        } catch {
            setError('No se pudieron cargar los documentos del cliente.')
            setDocs([])
        } finally {
            setLoading(false)
        }
    }

    const filtered = docs.filter(d => {
        const q = search.toLowerCase()
        return (
            d.documento_completo.toLowerCase().includes(q) ||
            d.Abre_Doc?.toLowerCase().includes(q)         ||
            d.NumeroDoc?.toString().includes(q)                       ||
            d.SerieDoc?.includes(q)
        )
    })

    const handleConfirmar = () => {
        if (!selected) return
        onSelect(selected)
        onOpenChange(false)
    }

    const saldoColor = (s: number) =>
        s <= 0 ? 'text-green-600' : s < 100 ? 'text-amber-600' : 'text-red-600'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-sky-600" />
                        Seleccionar Documento
                    </DialogTitle>
                    <DialogDescription>
                        Documentos del kardex del cliente seleccionado.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-3 border-b shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por tipo, serie o número..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                            disabled={loading}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-6 py-4 bg-gray-50/60">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="text-sm">Cargando documentos...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-red-400">
                            <AlertCircle className="h-8 w-8" />
                            <p className="text-sm">{error}</p>
                            <Button size="sm" variant="outline" onClick={fetchDocs}>Reintentar</Button>
                        </div>
                    ) : !codCliente ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                            <FileText className="h-8 w-8 opacity-40" />
                            <p className="text-sm">Selecciona primero un cliente.</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
                            <FileText className="h-8 w-8 opacity-40" />
                            <p className="text-sm">
                                {search ? 'Sin resultados para esa búsqueda.' : 'El cliente no tiene documentos en kardex.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filtered.map(doc => {
                                const isSelected = selected?.IdKardexClientes === doc.IdKardexClientes
                                return (
                                    <Card
                                        key={doc.IdKardexClientes}
                                        onClick={() => setSelected(doc)}
                                        className={`cursor-pointer transition-all hover:border-sky-400 hover:shadow-sm
                                            ${isSelected
                                            ? 'border-sky-600 ring-1 ring-sky-600 bg-sky-50'
                                            : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Badge variant="outline" className="font-mono text-xs bg-white">
                                                        {doc.Abre_Doc || doc.Tipo_Doc}
                                                    </Badge>
                                                    <span className="font-mono font-semibold text-sm text-slate-800">
                                                        {doc.SerieDoc}-{doc.NumeroDoc}
                                                    </span>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle className="h-5 w-5 text-sky-600 shrink-0" />
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Emisión: {fmtFecha(doc.Fecha_Emision)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Vcto: {fmtFecha(doc.Fecha_Vcto)}
                                                </span>
                                            </div>

                                            {/*<div className="grid grid-cols-3 gap-1 pt-1 border-t border-dashed border-slate-100">*/}
                                            {/*    <div>*/}
                                            {/*        <p className="text-[9px] uppercase text-slate-400 font-semibold tracking-wider">Provisión</p>*/}
                                            {/*        <p className="font-mono text-xs font-medium text-slate-700">*/}
                                            {/*            {fmtMoney(doc.Provision, doc.Simb_Moneda || 'S/')}*/}
                                            {/*        </p>*/}
                                            {/*    </div>*/}
                                            {/*    <div>*/}
                                            {/*        <p className="text-[9px] uppercase text-slate-400 font-semibold tracking-wider">Amortizado</p>*/}
                                            {/*        <p className="font-mono text-xs font-medium text-emerald-600">*/}
                                            {/*            {fmtMoney(doc.Amortizacion, doc.Simb_Moneda || 'S/')}*/}
                                            {/*        </p>*/}
                                            {/*    </div>*/}
                                            {/*    <div>*/}
                                            {/*        <p className="text-[9px] uppercase text-slate-400 font-semibold tracking-wider">Saldo</p>*/}
                                            {/*        <p className={`font-mono text-xs font-bold ${saldoColor(doc.saldo_pendiente)}`}>*/}
                                            {/*            {fmtMoney(doc.saldo_pendiente, doc.Simb_Moneda || 'S/')}*/}
                                            {/*        </p>*/}
                                            {/*    </div>*/}
                                            {/*</div>*/}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-4 bg-white">
                    <p className="text-xs text-slate-400">
                        {filtered.length} documento{filtered.length !== 1 ? 's' : ''}
                        {soloVigentes && ' con saldo pendiente'}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmar}
                            disabled={!selected}
                            className="bg-sky-600 hover:bg-sky-700 gap-1.5"
                        >
                            Usar documento
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}