'use client'

import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ImageIcon, Download, Paperclip } from 'lucide-react'
import {fmtFecha} from "@/lib/planilla.helper";

export interface Voucher {
    id:            number
    id_detalle:    number
    ruta_archivo:  string
    fecha_subida:  string
}

interface Props {
    open:        boolean
    onOpenChange:(v: boolean) => void
    numeroPlanilla: string
    vouchers:    Voucher[]
    baseUrl?:    string
}

function isPdf(ruta: string) {
    return ruta.toLowerCase().endsWith('.pdf')
}

export function VouchersModal({ open, onOpenChange, numeroPlanilla, vouchers, baseUrl = '' }: Props) {
    const total = vouchers.length

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Paperclip className="h-5 w-5 text-sky-600" />
                        Vouchers — {numeroPlanilla}
                    </DialogTitle>
                    <DialogDescription>
                        {total === 0
                            ? 'Esta planilla no tiene vouchers adjuntos.'
                            : `${total} voucher${total !== 1 ? 's' : ''} adjunto${total !== 1 ? 's' : ''}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {total === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                            <Paperclip className="h-10 w-10 opacity-30" />
                            <p className="text-sm">Sin vouchers para esta planilla</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {vouchers.map((v) => {
                                const url      = `${baseUrl}${v.ruta_archivo}`
                                const esPdf    = isPdf(v.ruta_archivo)
                                const filename = v.ruta_archivo.split('/').pop() ?? 'voucher'

                                return (
                                    <div
                                        key={v.id}
                                        className="flex flex-col gap-2 p-2 border border-slate-200 rounded-xl bg-slate-50 hover:border-sky-300 transition-colors"
                                    >
                                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-white border border-slate-100 flex items-center justify-center">
                                            {esPdf ? (
                                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                                    <FileText className="h-10 w-10" />
                                                    <span className="text-[10px] font-medium">PDF</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={url}
                                                    alt={filename}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none'
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-1 px-1">
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className="text-[9px] px-1 py-0">
                                                    Det. #{v.id_detalle}
                                                </Badge>
                                                {esPdf && (
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-red-50 text-red-600 border-red-200">
                                                        PDF
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">{fmtFecha(v.fecha_subida)}</p>
                                        </div>

                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={filename}
                                            className="flex items-center justify-center gap-1.5 text-[11px] font-medium
                                                text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200
                                                rounded-lg py-1.5 transition-colors"
                                        >
                                            <Download className="h-3 w-3" />
                                            {esPdf ? 'Descargar PDF' : 'Descargar imagen'}
                                        </a>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}