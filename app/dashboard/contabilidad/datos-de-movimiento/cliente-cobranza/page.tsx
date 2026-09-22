'use client'

import { useState, useEffect, type ReactNode, type ElementType } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Save, Loader2, X, IdCard, FileText, Wallet, MessageSquare, User, Landmark, Eraser } from "lucide-react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { toast } from "@/app/hooks/useToast"
import { fetchGetAllClients } from "@/app/api/takeOrders"
import { IClient } from "@/app/types/order/client-interface"
import InlineAutocomplete from "@/components/tomar-pedido/InlineAutocomplete"

import {
    Seller,
    TipoAmortizacion,
    EntidadFinanciera,
    TipoDocumento,
    FormState,
    FORM_INITIAL,
    AmortizacionListItem, EmpresaOption,
} from "@/app/types/amortizacion-types"

import ModalBuscarAmortizacion from "@/components/contabilidad/cliente-conbranza/Modalbuscaramortizacion";
import ModalKardex from "@/components/contabilidad/cliente-conbranza/Modalkardex";
import ModalMayor from "@/components/contabilidad/cliente-conbranza/Modalmayor";

function FormSection({
    icon: Icon,
    accent,
    title,
    description,
    children,
}: {
    icon: ElementType
    accent: "blue" | "violet" | "emerald" | "slate"
    title: string
    description: string
    children: ReactNode
}) {
    const accentClasses: Record<typeof accent, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        violet: "bg-violet-50 text-violet-600 border-violet-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${accentClasses[accent]}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground leading-none">{title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
            </div>
            <div className="pl-12">{children}</div>
        </div>
    )
}

export default function ClienteCobranzaPage() {
    const { user } = useAuth()

    const [form, setForm] = useState<FormState>(FORM_INITIAL)
    const [isSaving, setIsSaving] = useState(false)

    const [tiposAmort, setTiposAmort] = useState<TipoAmortizacion[]>([])
    const [entidades, setEntidades] = useState<EntidadFinanciera[]>([])
    const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([])
    const [empresas,   setEmpresas]   = useState<EmpresaOption[]>([])

    const [tipoDocSearch, setTipoDocSearch] = useState("")
    const [tipoAmortSearch, setTipoAmortSearch] = useState("")
    const [entidadSearch, setEntidadSearch] = useState("")

    const [clients, setClients] = useState<IClient[]>([])
    const [clientsFiltered, setClientsFiltered] = useState<IClient[]>([])
    const [clientSearch, setClientSearch] = useState("")
    const [selectedClient, setSelectedClient] = useState<IClient | null>(null)
    const [loadingClients, setLoadingClients] = useState(false)

    const [sellers, setSellers] = useState<Seller[]>([])
    const [sellersFiltered, setSellersFiltered] = useState<Seller[]>([])
    const [sellerSearch, setSellerSearch] = useState("")
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
    const [loadingSellers, setLoadingSellers] = useState(false)

    const [buscarOpen, setBuscarOpen] = useState(false)
    const [kardexOpen, setKardexOpen] = useState(false)
    const [mayorOpen, setMayorOpen] = useState(false)
    const [selectedAmortForModal, setSelectedAmortForModal] = useState<AmortizacionListItem | null>(null)

    const [confirmLimpiarOpen, setConfirmLimpiarOpen] = useState(false)
    const [confirmGuardarOpen, setConfirmGuardarOpen] = useState(false)

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
            const response = await fetchGetAllClients("", true, "")
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
        setLoadingSellers(true)
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
        } finally {
            setLoadingSellers(false)
        }
    }

    const fetchCombos = async () => {
        try {
            const [resTipos, resEntidades, resDocs, resEmpresas] = await Promise.all([
                apiClient.get('/amortizacion/combos/tipo-amortizacion'),
                apiClient.get('/amortizacion/combos/entidad-financiera'),
                apiClient.get('/amortizacion/combos/tipo-documento'),
                apiClient.get('/laboratorios/combos/laboratorios/empresas'),
            ])
            setTiposAmort(resTipos.data?.data?.data || [])
            setEntidades(resEntidades.data?.data?.data || [])
            setTiposDoc(resDocs.data?.data?.data || [])

            const listaEmpresas: EmpresaOption[] = resEmpresas.data?.data?.data || []
            setEmpresas(listaEmpresas)
            if (listaEmpresas.length > 0) {
                setForm(prev =>
                    prev.Id_Amort_Clie === null
                        ? { ...prev, Empresa: listaEmpresas[0].CodigoEmpresa }
                        : prev
                )
            }
        } catch {
            setTiposAmort([])
            setEntidades([])
            setTiposDoc([])
            setEmpresas([])
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
        const defaultEmpresa = empresas[0]?.CodigoEmpresa ?? ""
        setForm({ ...FORM_INITIAL, Empresa: defaultEmpresa })
        setSelectedClient(null)
        setSelectedSeller(null)
        setClientSearch("")
        setSellerSearch("")
        setTipoDocSearch("")
        setTipoAmortSearch("")
        setEntidadSearch("")
    }

    const buildPayload = () => ({
        id_amort_clie:      isEditing ? form.Id_Amort_Clie : null,
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
        empresa:           form.Empresa,
        moneda:             form.Moneda,
    })

    const isFormValid = () =>
        !!(form.Cod_Clie && form.TipoDoc && form.SerieDoc && form.Fecha_Mvto && form.Importe_Amortiz)

    const handleGuardarClick = () => {
        if (!isFormValid()) {
            toast({ title: "Guardar", description: "Complete los campos obligatorios.", variant: "warning" })
            return
        }
        setConfirmGuardarOpen(true)
    }

    const handleGuardar = async () => {
        if (!isFormValid()) {
            toast({ title: "Guardar", description: "Complete los campos obligatorios.", variant: "warning" })
            return
        }
        setIsSaving(true)
        try {
            await apiClient.post('/amortizacion', buildPayload())
            toast({
                title: "Guardar",
                description: "Registro agregado correctamente."
            })
            resetForm()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.response?.data?.message || "No se pudo guardar.",
                variant: "destructive"
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleSelectEditar = (record: AmortizacionListItem) => {
        setForm({
            Id_Amort_Clie:     record.Id_Amort_Clie,
            NroPlanilla:       record.NroPlanilla       ?? "",
            Cod_Clie:          record.Cod_Clie          ?? "",
            TipoDoc:           record.TipoDoc           ?? "",
            SerieDoc:          record.SerieDoc           ?? "",
            NumeroDoc:         String(record.NumeroDoc   ?? ""),
            Fecha_Mvto:        record.Fecha_Mvto
                    ? record.Fecha_Mvto.toString().slice(0, 10)
                    : "",
            Importe_Amortiz:   record.Importe_Amortiz?.toString() ?? "",
            Tipo_Amort:        record.Tipo_Amort        ?? "",
            NroDocAmortiza:    record.NroDocAmortiza     ?? "",
            Entida_Financiera: record.Entidad_Financiera ?? "",
            Observaciones:     record.Observaciones      ?? "",
            Cod_Vend:          record.Cod_Vend           ?? "",
            Moneda:            record.Moneda             ?? "NSO",
            Empresa:           record.EMPRESA             ?? "",
        })

        setSelectedClient(clients.find(c => c.codigo === record.Cod_Clie) ?? null)
        setSelectedSeller(sellers.find(s => s.codigo === record.Cod_Vend) ?? null)
    }

    const handleOpenKardex = (record: AmortizacionListItem) => {
        setSelectedAmortForModal(record)
        setKardexOpen(true)
    }

    const handleOpenMayor = (record: AmortizacionListItem) => {
        setSelectedAmortForModal(record)
        setMayorOpen(true)
    }

    const selectedTipoDoc = tiposDoc.find(t => t.Cod_Tipo === form.TipoDoc) ?? null
    const tiposDocFiltered = tipoDocSearch
        ? tiposDoc.filter(t => t.Descripcion?.toUpperCase().includes(tipoDocSearch.toUpperCase()))
        : tiposDoc

    const selectedTipoAmort = tiposAmort.find(t => t.Cod_Tipo_Amort === form.Tipo_Amort) ?? null
    const tiposAmortFiltered = tipoAmortSearch
        ? tiposAmort.filter(t => t.Descripcion?.toUpperCase().includes(tipoAmortSearch.toUpperCase()))
        : tiposAmort

    const selectedEntidad = entidades.find(e => e.CodigoEntidadFinanciera === form.Entida_Financiera) ?? null
    const entidadesFiltered = entidadSearch
        ? entidades.filter(e => e.DescripcionEntidadFinanciera?.toUpperCase().includes(entidadSearch.toUpperCase()))
        : entidades

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Cliente Cobranza</h1>
                <p className="text-sm md:text-base text-muted-foreground">Registro de amortizaciones y pagos de clientes.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                            {isEditing ? 'Editar Amortización' : 'Nueva Amortización'}
                        </span>
                        {isEditing && (
                            <span className="text-[11px] bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                                Modo Edición
                            </span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 ml-auto bg-background"
                            onClick={() => setBuscarOpen(true)}
                        >
                            <Search className="h-4 w-4" />
                            Buscar
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 space-y-6">
                    <FormSection
                        icon={IdCard}
                        accent="blue"
                        title="Identificación"
                        description="Cliente y empresa asociados al movimiento"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm">
                                    Cliente <span className="text-red-500">*</span>
                                </Label>
                                {selectedClient ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-blue-900 truncate leading-tight">
                                                {selectedClient.Nombre}
                                            </p>
                                            <p className="text-xs text-blue-600 truncate">
                                                {selectedClient.RUC ? `RUC: ${selectedClient.RUC}` : selectedClient.codigo}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleClientSelect(null)}
                                            className="h-7 px-2.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 bg-background shrink-0"
                                        >
                                            Cambiar
                                        </Button>
                                    </div>
                                ) : (
                                    <InlineAutocomplete<IClient>
                                        variant="tile"
                                        tileAccent="blue"
                                        tileIcon={User}
                                        tileTitle="Buscar cliente"
                                        tileDescription="Por RUC o nombre"
                                        placeholder="RUC o nombre del cliente..."
                                        value={clientSearch}
                                        onValueChange={setClientSearch}
                                        loading={loadingClients}
                                        items={clientsFiltered}
                                        pageSize={30}
                                        getKey={c => c.codigo}
                                        getItemLabel={c => c.Nombre}
                                        onSelect={handleClientSelect}
                                        emptyMessage="No se encontraron clientes"
                                        idleMessage="Escribe para buscar clientes"
                                        renderItem={c => (
                                            <div className="flex items-start gap-3 px-3 py-2.5">
                                                <div className="bg-blue-100 p-2 rounded-full shrink-0 mt-0.5">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                                    <span className="font-semibold text-sm text-foreground line-clamp-1 leading-tight">
                                                        {c.Nombre}
                                                    </span>
                                                    {c.RUC && (
                                                        <span className="text-xs text-muted-foreground">
                                                            <span className="font-medium">RUC:</span> {c.RUC}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    />
                                )}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm">Nro. Planilla</Label>
                                <Input
                                    placeholder="0000"
                                    value={form.NroPlanilla}
                                    onChange={e => handleChange('NroPlanilla', e.target.value)}
                                    disabled={isEditing}
                                />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <Label className="text-sm">
                                    Empresa <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={form.Empresa}
                                    onValueChange={v => handleChange('Empresa', v)}
                                    disabled
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar empresa..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {empresas.map(e => (
                                            <SelectItem key={e.CodigoEmpresa} value={e.CodigoEmpresa}>
                                                {e.NombreRazSocial}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FormSection>

                    <Separator />

                    <FormSection
                        icon={FileText}
                        accent="violet"
                        title="Documento"
                        description="Datos del comprobante que sustenta el movimiento"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                                <Label className="text-sm">
                                    Tipo Documento <span className="text-red-500">*</span>
                                </Label>
                                {selectedTipoDoc ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                            <FileText className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-blue-900 truncate leading-tight">
                                                {selectedTipoDoc.Descripcion}
                                            </p>
                                            <p className="text-xs text-blue-600 truncate font-mono">
                                                {selectedTipoDoc.Cod_Tipo}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleChange('TipoDoc', '')}
                                            className="h-7 px-2.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 bg-background shrink-0"
                                        >
                                            Cambiar
                                        </Button>
                                    </div>
                                ) : (
                                    <InlineAutocomplete<TipoDocumento>
                                        variant="tile"
                                        tileAccent="blue"
                                        tileIcon={FileText}
                                        tileTitle="Tipo de documento"
                                        tileDescription="Elige el comprobante"
                                        placeholder="Buscar tipo de documento..."
                                        value={tipoDocSearch}
                                        onValueChange={setTipoDocSearch}
                                        items={tiposDocFiltered}
                                        getKey={t => t.Cod_Tipo}
                                        getItemLabel={t => t.Descripcion}
                                        onSelect={t => handleChange('TipoDoc', t.Cod_Tipo)}
                                        emptyMessage="No se encontraron tipos de documento"
                                        idleMessage="Escribe para buscar"
                                        renderItem={t => (
                                            <div className="flex items-center gap-3 px-3 py-2.5">
                                                <div className="bg-blue-100 p-2 rounded-full shrink-0">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-foreground truncate">
                                                        {t.Descripcion}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-mono">
                                                        {t.Cod_Tipo}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    />
                                )}
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
                    </FormSection>

                    <Separator />

                    <FormSection
                        icon={Wallet}
                        accent="emerald"
                        title="Cobro y amortización"
                        description="Importe, fecha y forma en que se aplica el pago"
                    >
                        <div className="flex flex-col gap-4">
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
                                    {selectedTipoAmort ? (
                                        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                <Wallet className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-blue-900 truncate leading-tight">
                                                    {selectedTipoAmort.Descripcion}
                                                </p>
                                                <p className="text-xs text-blue-600 truncate font-mono">
                                                    {selectedTipoAmort.Cod_Tipo_Amort}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleChange('Tipo_Amort', '')}
                                                className="h-7 px-2.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-100 bg-background shrink-0"
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    ) : (
                                        <InlineAutocomplete<TipoAmortizacion>
                                            variant="tile"
                                            tileAccent="blue"
                                            tileIcon={Wallet}
                                            tileTitle="Tipo de amortización"
                                            tileDescription="Cómo se aplica el pago"
                                            placeholder="Buscar tipo de amortización..."
                                            value={tipoAmortSearch}
                                            onValueChange={setTipoAmortSearch}
                                            items={tiposAmortFiltered}
                                            getKey={t => t.Cod_Tipo_Amort}
                                            getItemLabel={t => t.Descripcion}
                                            onSelect={t => handleChange('Tipo_Amort', t.Cod_Tipo_Amort)}
                                            emptyMessage="No se encontraron tipos de amortización"
                                            idleMessage="Escribe para buscar"
                                            renderItem={t => (
                                                <div className="flex items-center gap-3 px-3 py-2.5">
                                                    <div className="bg-blue-100 p-2 rounded-full shrink-0">
                                                        <Wallet className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground truncate">
                                                            {t.Descripcion}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {t.Cod_Tipo_Amort}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    )}
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
                                    {selectedEntidad ? (
                                        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 p-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600">
                                                <Landmark className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-violet-900 truncate leading-tight">
                                                    {selectedEntidad.DescripcionEntidadFinanciera}
                                                </p>
                                                <p className="text-xs text-violet-600 truncate font-mono">
                                                    {selectedEntidad.CodigoEntidadFinanciera}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleChange('Entida_Financiera', '')}
                                                className="h-7 px-2.5 text-xs text-violet-600 border-violet-200 hover:bg-violet-100 bg-background shrink-0"
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    ) : (
                                        <InlineAutocomplete<EntidadFinanciera>
                                            variant="tile"
                                            tileAccent="violet"
                                            tileIcon={Landmark}
                                            tileTitle="Entidad financiera"
                                            tileDescription="Banco o entidad del pago"
                                            placeholder="Buscar entidad financiera..."
                                            value={entidadSearch}
                                            onValueChange={setEntidadSearch}
                                            items={entidadesFiltered}
                                            getKey={e => e.CodigoEntidadFinanciera}
                                            getItemLabel={e => e.DescripcionEntidadFinanciera}
                                            onSelect={e => handleChange('Entida_Financiera', e.CodigoEntidadFinanciera)}
                                            emptyMessage="No se encontraron entidades financieras"
                                            idleMessage="Escribe para buscar"
                                            renderItem={e => (
                                                <div className="flex items-center gap-3 px-3 py-2.5">
                                                    <div className="bg-violet-100 p-2 rounded-full shrink-0">
                                                        <Landmark className="h-4 w-4 text-violet-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground truncate">
                                                            {e.DescripcionEntidadFinanciera}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {e.CodigoEntidadFinanciera}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-sm">Vendedor</Label>
                                    {selectedSeller ? (
                                        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 p-2.5">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-violet-900 truncate leading-tight">
                                                    {selectedSeller.nombres} {selectedSeller.apellidos}
                                                </p>
                                                <p className="text-xs text-violet-600 truncate font-mono">
                                                    {selectedSeller.codigo}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSellerSelect(null)}
                                                className="h-7 px-2.5 text-xs text-violet-600 border-violet-200 hover:bg-violet-100 bg-background shrink-0"
                                            >
                                                Cambiar
                                            </Button>
                                        </div>
                                    ) : (
                                        <InlineAutocomplete<Seller>
                                            variant="tile"
                                            tileAccent="violet"
                                            tileIcon={User}
                                            tileTitle="Buscar vendedor"
                                            tileDescription="Por nombre o código"
                                            placeholder="Nombre o código del vendedor..."
                                            value={sellerSearch}
                                            onValueChange={setSellerSearch}
                                            loading={loadingSellers}
                                            items={sellersFiltered}
                                            pageSize={30}
                                            getKey={s => s.codigo}
                                            getItemLabel={s => `${s.nombres} ${s.apellidos}`}
                                            onSelect={handleSellerSelect}
                                            emptyMessage="No se encontraron vendedores"
                                            idleMessage="Escribe para buscar vendedores"
                                            renderItem={s => (
                                                <div className="flex items-center gap-3 px-3 py-2.5">
                                                    <div className="bg-violet-100 p-2 rounded-full shrink-0">
                                                        <User className="h-4 w-4 text-violet-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-foreground truncate">
                                                            {s.nombres} {s.apellidos}
                                                        </p>
                                                        <p className="text-xs text-violet-600 font-mono">
                                                            {s.codigo}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    <Separator />

                    <FormSection
                        icon={MessageSquare}
                        accent="slate"
                        title="Observaciones"
                        description="Notas adicionales sobre el movimiento (opcional)"
                    >
                        <div className="flex flex-col gap-1">
                            <Textarea
                                placeholder="Observaciones adicionales..."
                                value={form.Observaciones}
                                onChange={e => handleChange('Observaciones', e.target.value)}
                                className="resize-none"
                                rows={3}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">{form.Observaciones.length}/500</p>
                        </div>
                    </FormSection>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-muted-foreground"
                            onClick={() => setConfirmLimpiarOpen(true)}
                        >
                            <X className="h-4 w-4" />
                            Limpiar
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 ml-auto"
                            onClick={handleGuardarClick}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isEditing ? 'Actualizar' : 'Guardar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ModalBuscarAmortizacion
                open={buscarOpen}
                onClose={() => setBuscarOpen(false)}
                onSelectEditar={handleSelectEditar}
                onOpenKardex={handleOpenKardex}
                onOpenMayor={handleOpenMayor}
            />

            <ModalKardex
                open={kardexOpen}
                onClose={() => setKardexOpen(false)}
                amortizacion={selectedAmortForModal}
            />

            <ModalMayor
                open={mayorOpen}
                onClose={() => setMayorOpen(false)}
                amortizacion={selectedAmortForModal}
            />

            <AlertDialog open={confirmLimpiarOpen} onOpenChange={setConfirmLimpiarOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Eraser className="h-5 w-5 text-muted-foreground" />
                            Limpiar formulario
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Seguro que deseas limpiar el formulario? Se perderá la información no guardada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => { resetForm(); setConfirmLimpiarOpen(false) }}
                        >
                            Sí, limpiar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmGuardarOpen} onOpenChange={setConfirmGuardarOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
                            <Save className="h-5 w-5" />
                            {isEditing ? 'Actualizar registro' : 'Guardar registro'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isEditing
                                ? '¿Seguro que deseas actualizar este registro de cobranza?'
                                : '¿Seguro que deseas guardar este nuevo registro de cobranza?'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => { setConfirmGuardarOpen(false); handleGuardar() }}
                        >
                            {isEditing ? 'Sí, actualizar' : 'Sí, guardar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}