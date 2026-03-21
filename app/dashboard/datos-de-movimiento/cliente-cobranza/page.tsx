'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Save, Pencil, Trash2, Loader2, X } from "lucide-react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { toast } from "@/app/hooks/use-toast"
import { fetchGetAllClients } from "@/app/api/takeOrders"
import { IClient } from "@/app/types/order/client-interface"
import { Combobox } from "@/app/dashboard/mis-pedidos/page"

interface Seller {
    idVendedor: number
    codigo: string
    nombres: string
    apellidos: string
}

interface TipoAmortizacion {
    Cod_Tipo_Amort: string
    Descripcion: string
}

interface EntidadFinanciera {
    CodigoEntidadFinanciera: string
    DescripcionEntidadFinanciera: string
}

interface TipoDocumento {
    Cod_Tipo:    string
    Descripcion: string
    Abreviatura: string
}

interface FormState {
    Id_Amort_Clie:    number | null
    NroPlanilla:      string
    Cod_Clie:         string
    TipoDoc:          string
    SerieDoc:         string
    NumeroDoc:        string
    Fecha_Mvto:       string
    Importe_Amortiz:  string
    Tipo_Amort:       string
    NroDocAmortiza:   string
    Entida_Financiera: string
    Observaciones:    string
    Cod_Vend:         string
    Moneda:           string
}

const FORM_INITIAL: FormState = {
    Id_Amort_Clie:     null,
    NroPlanilla:       "",
    Cod_Clie:          "",
    TipoDoc:           "",
    SerieDoc:          "",
    NumeroDoc:         "",
    Fecha_Mvto:        "",
    Importe_Amortiz:   "",
    Tipo_Amort:        "",
    NroDocAmortiza:    "",
    Entida_Financiera: "",
    Observaciones:     "",
    Cod_Vend:          "",
    Moneda:            "NSO",
}

export default function PlanillaCobranzaPage() {
    const { user } = useAuth()

    const [form, setForm] = useState<FormState>(FORM_INITIAL)
    const [isSaving, setIsSaving] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [tiposAmort, setTiposAmort] = useState<TipoAmortizacion[]>([])
    const [entidades, setEntidades] = useState<EntidadFinanciera[]>([])
    const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([])

    const [clients, setClients] = useState<IClient[]>([])
    const [clientsFiltered, setClientsFiltered] = useState<IClient[]>([])
    const [clientSearch, setClientSearch] = useState("")
    const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
    const [loadingClients, setLoadingClients] = useState(false)

    const [sellers, setSellers] = useState<Seller[]>([])
    const [sellersFiltered, setSellersFiltered] = useState<Seller[]>([])
    const [sellerSearch, setSellerSearch] = useState("")
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)

    const isEditing = form.Id_Amort_Clie !== null

    useEffect(() => {
        if (user) {
            fetchClients()
            fetchVendedores()
            fetchCombos()
        }
    }, [user])

    useEffect(() => {
        if (clientSearch) {
            setClientsFiltered(clients.filter(c =>
                c.RUC?.includes(clientSearch) ||
                c.Nombre?.toUpperCase().includes(clientSearch.toUpperCase())
            ))
        } else {
            setClientsFiltered(clients)
        }
    }, [clientSearch, clients])

    useEffect(() => {
        if (sellerSearch) {
            setSellersFiltered(sellers.filter(s =>
                s.codigo?.includes(sellerSearch) ||
                `${s.nombres} ${s.apellidos}`.toUpperCase().includes(sellerSearch.toUpperCase())
            ))
        } else {
            setSellersFiltered(sellers)
        }
    }, [sellerSearch, sellers])

    const fetchClients = async () => {
        setLoadingClients(true)
        try {
            const response = await fetchGetAllClients("", true)
            const data = response.data?.data?.data || []
            setClients(data)
            setClientsFiltered(data)
        } catch {
            setClients([])
        } finally {
            setLoadingClients(false)
        }
    }

    const fetchVendedores = async () => {
        try {
            const response = await apiClient.get('/usuarios/listar/vendedores')
            const data = response.data.data.data.map((v: any) => ({
                idVendedor: v.idVendedor,
                codigo: v.Codigo_Vend,
                nombres: v.Nombres,
                apellidos: v.Apellidos,
            }))
            setSellers(data)
            setSellersFiltered(data)
        } catch {
            setSellers([])
        }
    }

    const fetchCombos = async () => {
        try {
            const [resTipos, resEntidades, resDocs] = await Promise.all([
                apiClient.get('/amortizacion/combos/tipo-amortizacion'),
                apiClient.get('/amortizacion/combos/entidad-financiera'),
                apiClient.get('/amortizacion/combos/tipo-documento'),
            ])
            setTiposAmort(resTipos.data?.data?.data    || [])
            setEntidades(resEntidades.data?.data?.data || [])
            setTiposDoc(resDocs.data?.data?.data       || [])  // ← nuevo
        } catch {
            setTiposAmort([])
            setEntidades([])
            setTiposDoc([])  // ← nuevo
        }
    }

    const handleChange = (field: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleClientSelect = (client: IClient | null) => {
        setSelectedClient(client)
        setForm(prev => ({ ...prev, Cod_Clie: client?.codigo ?? "" }))
    }

    const handleSellerSelect = (seller: Seller | null) => {
        setSelectedSeller(seller)
        setForm(prev => ({ ...prev, Cod_Vend: seller?.codigo ?? "" }))
    }

    const resetForm = () => {
        setForm(FORM_INITIAL)
        setSelectedClient(null)
        setSelectedSeller(null)
        setClientSearch("")
        setSellerSearch("")
    }

    const buildPayload = (withId: boolean) => ({
        id_amort_clie:      withId ? form.Id_Amort_Clie : null,
        nroPlanilla:        form.NroPlanilla,
        cod_clie:           form.Cod_Clie,
        tipo_doc:           form.TipoDoc,
        serie_doc:          form.SerieDoc,
        numero_doc:         form.NumeroDoc,
        fecha_mvto:         form.Fecha_Mvto,
        importe_amortiz:    parseFloat(form.Importe_Amortiz),
        tipo_amort:         form.Tipo_Amort,
        nro_doc_amortiza:   form.NroDocAmortiza,
        entida_financiera:  form.Entida_Financiera,
        observaciones:      form.Observaciones,
        cod_vend:           form.Cod_Vend,
        empresa:            user?.codigo ?? "",
        moneda:             form.Moneda,
    })

    const handleBuscar = async () => {
        if (!form.NroPlanilla && !form.Cod_Clie) {
            toast({ title: "Buscar", description: "Ingrese Nro. Planilla o seleccione un cliente.", variant: "warning" })
            return
        }
        setIsSearching(true)
        try {
            const params = new URLSearchParams()
            if (form.NroPlanilla) params.append('nroPlanilla', form.NroPlanilla)
            if (form.Cod_Clie) params.append('codClie', form.Cod_Clie)

            const response = await apiClient.get(`/amortizacion/buscar?${params.toString()}`)
            const results: any[] = response.data?.data?.data || []

            if (results.length === 0) {
                toast({ title: "Buscar", description: "No se encontraron registros.", variant: "warning" })
                return
            }

            const record = results[0]
            setForm({
                Id_Amort_Clie:     record.Id_Amort_Clie,
                NroPlanilla:       record.NroPlanilla       ?? "",
                Cod_Clie:          record.Cod_Clie          ?? "",
                TipoDoc:           record.TipoDoc           ?? "",
                SerieDoc:          record.SerieDoc          ?? "",
                NumeroDoc:         String(record.NumeroDoc  ?? ""),
                Fecha_Mvto:        record.Fecha_Mvto
                    ? record.Fecha_Mvto.toString().slice(0, 10)
                    : "",
                Importe_Amortiz:   record.Importe_Amortiz?.toString() ?? "",
                Tipo_Amort:        record.Tipo_Amort        ?? "",
                NroDocAmortiza:    record.NroDocAmortiza     ?? "",
                Entida_Financiera: record.EntidaFinanciera   ?? "",
                Observaciones:     record.Observaciones     ?? "",
                Cod_Vend:          record.Cod_Vend          ?? "",
                Moneda:            record.Moneda            ?? "NSO",
            })

            setSelectedClient(clients.find(c => c.codigo === record.Cod_Clie) ?? null)
            setSelectedSeller(sellers.find(s => s.codigo === record.Cod_Vend) ?? null)

            toast({ title: "Buscar", description: `Registro encontrado.` })
        } catch {
            toast({ title: "Error", description: "No se pudo realizar la búsqueda.", variant: "destructive" })
        } finally {
            setIsSearching(false)
        }
    }

    const handleGuardar = async () => {
        if (!form.Cod_Clie || !form.TipoDoc || !form.SerieDoc || !form.Fecha_Mvto || !form.Importe_Amortiz) {
            toast({ title: "Guardar", description: "Complete los campos obligatorios.", variant: "warning" })
            return
        }
        setIsSaving(true)
        try {
            await apiClient.post('/amortizacion', buildPayload(false))
            toast({ title: "Guardar", description: "Registro guardado correctamente." })
            resetForm()
        } catch (error: any) {
            toast({ title: "Error", description: error?.response?.data?.message || "No se pudo guardar.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleModificar = async () => {
        if (!form.Id_Amort_Clie) {
            toast({ title: "Modificar", description: "Primero busque un registro para modificar.", variant: "warning" })
            return
        }
        setIsSaving(true)
        try {
            await apiClient.post('/amortizacion', buildPayload(true))
            toast({ title: "Modificar", description: "Registro modificado correctamente." })
            resetForm()
        } catch (error: any) {
            toast({ title: "Error", description: error?.response?.data?.message || "No se pudo modificar.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleEliminar = async () => {
        if (!form.Id_Amort_Clie) {
            toast({ title: "Eliminar", description: "Primero busque un registro para eliminar.", variant: "warning" })
            return
        }
        if (!confirm(`¿Desea eliminar la planilla "${form.NroPlanilla || `#${form.Id_Amort_Clie}`}"? Esta acción no se puede deshacer.`)) return
        setIsDeleting(true)
        try {
            await apiClient.delete(`/amortizacion/${form.Id_Amort_Clie}`)
            toast({ title: "Eliminar", description: "Registro eliminado correctamente." })
            resetForm()
        } catch (error: any) {
            toast({ title: "Error", description: error?.response?.data?.message || "No se pudo eliminar.", variant: "destructive" })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Planilla Cobranza</h1>
                <p className="text-sm md:text-base text-gray-500">Registro de amortizaciones y pagos de clientes.</p>
            </div>
            <Card className="shadow-md">
                <CardHeader className="bg-slate-50 border-b border-slate-200 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={handleBuscar}
                            disabled={isSearching}
                        >
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            Buscar
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleGuardar}
                            disabled={isSaving || isEditing}
                        >
                            {isSaving && !isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Guardar
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-amber-500 hover:bg-amber-600"
                            onClick={handleModificar}
                            disabled={isSaving || !isEditing}
                        >
                            {isSaving && isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                            Modificar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                            onClick={handleEliminar}
                            disabled={isDeleting || !isEditing}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Eliminar
                        </Button>
                        {isEditing && (
                            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-400 ml-auto" onClick={resetForm}>
                                <X className="h-4 w-4" />
                                Limpiar
                            </Button>
                        )}
                        {isEditing && (
                            <span className="text-[11px] bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                                Modo Edición
                            </span>
                        )}
                    </div>

                </CardHeader>

                <CardContent className="p-4 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Nro. Planilla</Label>
                            <Input
                                placeholder="Ej: PL-0001"
                                value={form.NroPlanilla}
                                onChange={e => handleChange('NroPlanilla', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">
                                Cliente <span className="text-red-500">*</span>
                            </Label>
                            <Combobox<IClient>
                                items={clientsFiltered}
                                value={selectedClient?.codigo ?? ""}
                                onSearchChange={setClientSearch}
                                onSelect={handleClientSelect}
                                getItemKey={c => c.codigo}
                                getItemLabel={c => `${c.Nombre} — ${c.RUC}`}
                                placeholder={loadingClients ? "Cargando cliente-cobranza..." : "Buscar cliente..."}
                                emptyText="No se encontraron clientes"
                                searchText="Escribe para buscar..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">
                                Tipo Documento <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={form.TipoDoc}
                                onValueChange={v => handleChange('TipoDoc', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposDoc.map(t => (
                                        <SelectItem key={t.Cod_Tipo} value={t.Cod_Tipo}>
                                            {t.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">
                                Serie <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="Ej: F001"
                                value={form.SerieDoc}
                                onChange={e => handleChange('SerieDoc', e.target.value)}
                                maxLength={10}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Número</Label>
                            <Input
                                placeholder="Ej: 00001234"
                                value={form.NumeroDoc}
                                onChange={e => handleChange('NumeroDoc', e.target.value)}
                                maxLength={20}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">
                                Fecha Cobro <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={form.Fecha_Mvto}
                                onChange={e => handleChange('Fecha_Mvto', e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">
                                Importe <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                min={0}
                                step="0.01"
                                value={form.Importe_Amortiz}
                                onChange={e => handleChange('Importe_Amortiz', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Tipo Amortización</Label>
                            <Select value={form.Tipo_Amort} onValueChange={v => handleChange('Tipo_Amort', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposAmort.map(t => (
                                        <SelectItem key={t.Cod_Tipo_Amort} value={t.Cod_Tipo_Amort}>
                                            {t.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Nro. Doc. Amortiza</Label>
                            <Input
                                placeholder="Nro. documento de pago"
                                value={form.NroDocAmortiza}
                                onChange={e => handleChange('NroDocAmortiza', e.target.value)}
                                maxLength={50}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Entidad Financiera</Label>
                            <Select
                                value={form.Entida_Financiera}
                                onValueChange={v => handleChange('Entida_Financiera', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {entidades.map(e => (
                                        <SelectItem key={e.CodigoEntidadFinanciera} value={e.CodigoEntidadFinanciera}>
                                            {e.DescripcionEntidadFinanciera}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-sm">Vendedor</Label>
                            <Combobox<Seller>
                                items={sellersFiltered}
                                value={selectedSeller?.codigo ?? ""}
                                onSearchChange={setSellerSearch}
                                onSelect={handleSellerSelect}
                                getItemKey={s => s.codigo}
                                getItemLabel={s => `${s.nombres} ${s.apellidos} — ${s.codigo}`}
                                placeholder="Buscar vendedor..."
                                emptyText="No se encontraron vendedores"
                                searchText="Escribe para buscar..."
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Label className="text-sm">Observaciones</Label>
                        <Textarea
                            placeholder="Observaciones adicionales..."
                            value={form.Observaciones}
                            onChange={e => handleChange('Observaciones', e.target.value)}
                            className="resize-none"
                            rows={3}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-400 text-right">{form.Observaciones.length}/500</p>
                    </div>

                </CardContent>
            </Card>

        </div>
    )
}
