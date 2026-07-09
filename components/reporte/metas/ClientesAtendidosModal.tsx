'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Users, MapPin } from "lucide-react"
import { fmtMoney } from "@/app/utils/metas-helpers"
import { MetasService } from "@/app/services/reports/metasService"

interface ClienteAtendido {
    cod_cliente: string;
    nombre_cliente: string;
    zona: string | null;
    monto_vendido: number;
}

interface ClientesAtendidosModalProps {
    open: boolean;
    onClose: () => void;
    codVendedor: string;
    idCiclo: number;
    idLineaGe: number;
    nombreVendedor?: string;
}

export default function ClientesAtendidosModal({ open, onClose, codVendedor, idCiclo, idLineaGe, nombreVendedor }: ClientesAtendidosModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [clientes, setClientes] = useState<ClienteAtendido[]>([])

    useEffect(() => {
        if (!open || !codVendedor || !idCiclo || !idLineaGe) return
        let cancel = false
        setLoading(true)
        setError(null)
        MetasService.listarClientesAtendidosDirecto(codVendedor, idCiclo, idLineaGe)
            .then(res => {
                if (cancel) return
                const list: ClienteAtendido[] = res?.data?.data || []
                setClientes(Array.isArray(list) ? list : [])
            })
            .catch(() => { if (!cancel) setError("No se pudieron cargar los clientes") })
            .finally(() => { if (!cancel) setLoading(false) })
        return () => { cancel = true }
    }, [open, codVendedor, idCiclo, idLineaGe])

    const totalMonto = clientes.reduce((s, c) => s + Number(c.monto_vendido || 0), 0)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-5 pb-4 border-b border-border">
                    <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-sky-600" />
                        Clientes atendidos
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                        {nombreVendedor ? `${nombreVendedor} · ` : ''}{clientes.length} cliente{clientes.length === 1 ? '' : 's'}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 text-sm py-12">{error}</div>
                    ) : clientes.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-12">
                            Este vendedor no registra clientes atendidos en el ciclo.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-[1fr_90px_90px] gap-2 px-3 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                                <span>Cliente</span>
                                <span className="text-center">Zona</span>
                                <span className="text-right">Monto S/</span>
                            </div>
                            {clientes.map((c) => (
                                <div key={c.cod_cliente}
                                     className="grid grid-cols-[1fr_90px_90px] gap-2 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/70 items-center transition-colors">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground truncate" title={c.nombre_cliente}>
                                            {c.nombre_cliente || c.cod_cliente}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">{c.cod_cliente}</p>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="truncate" title={c.zona || ''}>{c.zona || '—'}</span>
                                    </div>
                                    <span className="text-right text-xs font-semibold text-foreground">
                                        {fmtMoney(Number(c.monto_vendido))}
                                    </span>
                                </div>
                            ))}
                            <div className="grid grid-cols-[1fr_90px_90px] gap-2 px-3 py-2.5 bg-muted rounded-lg border-2 border-border shadow-sm items-center mt-2">
                                <span className="text-[11px] font-semibold text-muted-foreground">TOTAL · {clientes.length} clientes</span>
                                <span></span>
                                <span className="text-right text-xs font-bold text-foreground">{fmtMoney(totalMonto)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
