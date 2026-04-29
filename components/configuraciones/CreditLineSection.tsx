'use client'

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Edit, RefreshCw, Save, Search, Landmark, User, ChevronLeft, ChevronRight
} from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import {fetchGetAllClients} from "@/app/api/takeOrders";
import {IClient} from "@/app/types/order/client-interface";

interface LineasCreditoSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

const fmtMoney = (n: number) =>
    "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2 })

const PAGE_SIZE = 12

export default function CreditLineSection({ onOpenModalChange }: LineasCreditoSectionProps) {
    const { user, isAdmin } = useAuth()
    const [data, setData] = useState<IClient[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [page, setPage] = useState(1)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editando, setEditando] = useState<IClient | null>(null)
    const [form, setForm] = useState({ linea_credito: "" })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE))
    const paginatedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const noOp = useCallback(() => {}, [])
    useEffect(() => { onOpenModalChange(noOp) }, [onOpenModalChange, noOp])

    const loadInitialData = async () => {
        setLoading(true)
        try {
            const sellerCode = isAdmin() ? "" : (user?.codigo || "");
            const resCli = await fetchGetAllClients(sellerCode, isAdmin());
            const clientes = resCli.data?.data?.data || resCli.data?.data || [];
            setData(clientes);
        } catch (error) {
            console.error("Error cargando catálogos", error);
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        if (user) {
            loadInitialData();
        }
    }, [user]);

    const abrirEditar = (item: IClient) => {
        setEditando(item)
        setForm({ linea_credito: String(item.LineaCredito) })
        setErrors({})
        setIsModalOpen(true)
    }

    const handleGuardar = async () => {
        const newErrors: Record<string, string> = {}
        if (form.linea_credito === "" || isNaN(Number(form.linea_credito))) {
            newErrors.linea_credito = "Ingrese un monto válido"
        }
        if (Number(form.linea_credito) < 0) {
            newErrors.linea_credito = "El monto no puede ser negativo"
        }
        setErrors(newErrors)
        if (Object.keys(newErrors).length > 0) return

        if (!editando) return

        setLoadingSave(true)
        try {
            const res = await apiClient.put(
                `/admin/update-credit-line/${editando.codigo}`,
                {
                    linea_credito: Number(form.linea_credito)
                }
            )
            if (res.data?.success !== false) {
                setIsModalOpen(false)
                loadInitialData()
            }
        } catch (error) {
            console.error("Error al actualizar línea de crédito:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    return (
        <>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Search className="h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Buscar por nombre, RUC o código de cliente..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-white border-slate-200 h-9 text-sm"
                />
                {data.length > 0 && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {data.length} cliente{data.length === 1 ? '' : 's'}
                    </Badge>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-40" />
                    ))}
                </div>
            ) : paginatedData.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedData.map((item) => (
                            <Card key={item.codigo} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-gray-900 truncate">
                                                {item.Nombre}
                                            </h3>
                                            {item.NombreComercial && (
                                                <p className="text-[10px] text-slate-400 truncate">
                                                    {item.NombreComercial}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                RUC: {item.RUC} · Cod: {item.codigo}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg my-3">
                                        <p className="text-[10px] text-amber-500 uppercase font-semibold mb-0.5">
                                            Línea de Crédito
                                        </p>
                                        <p className="text-lg font-bold text-amber-800">
                                            {fmtMoney(Number(item.LineaCredito))}
                                        </p>
                                    </div>

                                    {(item.Vendedor?.trim() || item.NombreZona) && (
                                        <div className="flex gap-2 text-[10px] text-slate-400 mb-3">
                                            {item.Vendedor?.trim() && (
                                                <span className="truncate">
                                                    <User className="h-3 w-3 inline mr-0.5" />
                                                    {item.Vendedor.trim()}
                                                </span>
                                            )}
                                            {item.NombreZona && (
                                                <span className="truncate">· {item.NombreZona}</span>
                                            )}
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => abrirEditar(item)}
                                        className="w-full text-xs"
                                    >
                                        <Edit className="h-3 w-3 mr-1" /> Editar Línea de Crédito
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="text-xs"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-xs text-slate-500">
                                Página {page} de {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="text-xs"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <Landmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {debouncedQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {debouncedQuery
                            ? "Intenta con otro término de búsqueda"
                            : "Los clientes aparecerán aquí cuando existan en el sistema"}
                    </p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Línea de Crédito</DialogTitle>
                        <DialogDescription>
                            Actualiza el monto de línea de crédito para este cliente.
                        </DialogDescription>
                    </DialogHeader>

                    {editando && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                                <p className="text-sm font-semibold text-slate-800">{editando.Nombre}</p>
                                <p className="text-xs text-slate-500">
                                    RUC: {editando.RUC} · Código: {editando.codigo}
                                </p>
                                {editando.Vendedor?.trim() && (
                                    <p className="text-xs text-slate-400">
                                        Vendedor: {editando.Vendedor.trim()}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Línea de Crédito (S/) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.linea_credito}
                                    onChange={e => setForm({ linea_credito: e.target.value })}
                                    placeholder="Ej: 5000.00"
                                    className={errors.linea_credito ? "border-red-500" : ""}
                                />
                                {errors.linea_credito && (
                                    <p className="text-xs text-red-500">{errors.linea_credito}</p>
                                )}
                            </div>

                            {form.linea_credito && Number(form.linea_credito) !== Number(editando.LineaCredito) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-semibold text-blue-500">Cambio</p>
                                        <p className="text-xs text-blue-600">
                                            {fmtMoney(Number(editando.LineaCredito))} → {fmtMoney(Number(form.linea_credito))}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${
                                            Number(form.linea_credito) > Number(editando.LineaCredito)
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                        }`}
                                    >
                                        {Number(form.linea_credito) > Number(editando.LineaCredito) ? '▲' : '▼'}{' '}
                                        {fmtMoney(Math.abs(Number(form.linea_credito) - Number(editando.LineaCredito)))}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={loadingSave}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleGuardar} disabled={loadingSave}>
                            {loadingSave && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}