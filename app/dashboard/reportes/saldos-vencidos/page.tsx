'use client'

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getExpiredBalancesRequest } from "@/app/api/reports"
import {RefreshCcw, Search} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ExportExpiredBalancesPdf } from "@/components/reporte/exportExpiredBalancesPdf"
import { ZoneReportSkeleton } from "@/components/skeleton/ZoneReportSkeleton"
import {VendedorVencido} from "@/app/types/report-interface";

export default function ExpiredBalancesPage() {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<VendedorVencido[]>([])

    const fetchReport = async () => {
        setLoading(true)
        try {
            const response = await getExpiredBalancesRequest();
            if (response.status === 200) {
                setData(response.data.data || []);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar el reporte", variant: "destructive" });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReport();
    }, [])

    return (
        <div className="grid gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Saldos por Cobrar (Vencidos)</h1>
                <p className="text-gray-500">Listado general de documentos vencidos agrupado por Vendedor, Zona y Cliente.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Datos del Reporte</h2>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={fetchReport} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Actualizar
                        </Button>
                        <ExportExpiredBalancesPdf data={data} disabled={loading || data.length === 0} />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6"><ZoneReportSkeleton /></div>
                    ) : data.length > 0 ? (
                        <div className="p-6 max-h-[600px] overflow-y-auto">
                            {data.map((vendedor, vIdx) => (
                                <div key={vIdx} className="mb-8 border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-indigo-600 text-white p-3 font-bold text-lg">
                                        {vendedor.Vendedor}
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {vendedor.zonas.map((zona, zIdx) => (
                                            <div key={zIdx}>
                                                <h3 className="font-bold text-slate-800 border-b pb-1 mb-3">ZONA: {zona.NombreZona}</h3>
                                                <div className="pl-4 space-y-4">
                                                    {zona.clientes.map((cliente, cIdx) => (
                                                        <div key={cIdx} className="bg-slate-50 p-3 rounded border border-slate-200">
                                                            <p className="font-semibold text-sm text-slate-900">{cliente.Cliente}</p>
                                                            <p className="text-xs text-slate-500 mb-2">{cliente.Direccion}</p>
                                                            <div className="text-xs font-mono">
                                                                {cliente.documentos.map((doc, dIdx) => (
                                                                    <div key={dIdx} className="grid grid-cols-5 gap-2 border-b border-slate-100 py-1">
                                                                        <span>{doc.Fecha_Emision}</span>
                                                                        <span>{doc.Serie_Numero}</span>
                                                                        <span>{doc.Abreviatura}</span>
                                                                        <span className="text-right">S/ {doc.Saldo_Soles.toFixed(2)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-gray-500 py-12">
                            No hay documentos vencidos para mostrar.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}