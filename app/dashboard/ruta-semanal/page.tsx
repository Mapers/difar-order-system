'use client'

import {useState, useEffect, use} from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Edit,
    Trash2,
    MapPin,
    Calendar,
    User,
    CheckCircle,
    Clock,
    Filter,
    MoreHorizontal,
    Target,
    X, Locate, Phone, Route, AlertCircle, Loader2, Info
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/authContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import apiClient from "@/app/api/client";
import {ClientService} from "@/app/services/client/ClientService";
import {Combobox} from "@/app/dashboard/mis-pedidos/page";
import moment from "moment";
import { Alert, AlertDescription } from "@/components/ui/alert"
import ExcelJS from 'exceljs';
import { Download } from "lucide-react";

interface ClientZone {
    Codigo: string
    direccion: string
    Nombre: string
    NombreComercial: string
    Telefono: string
    latitud: number
    longitud: number
}

interface Direccion {
    id: string
    Nombre: string
    direccion: string
    NombreComercial: string
    latitud: number
    longitud: number
    telefono?: string
    estado: string
    comentario?: string
    ruta_cliente_id?: number
}

interface Ruta {
    id: number
    nombre: string
    dia: string
    vendedorId: number
    vendedorNombre: string
    clientes: Direccion[]
    fechaCreacion: string
    activa: boolean
    zona: string
    zonaNombre: string
    fechaCrea: string
    estado: string
}

interface History {
    id: number
    nombreRuta: string
    dia: string
    vendedorId: number
    vendedorNombre: string
    Nombre: string
    direccion: string
    NombreComercial: string
    latitud: number
    longitud: number
    telefono?: string
    estado_ruta: string
    estado_cliente: string
    comentario?: string
    ruta_cliente_id?: number
    fecha_crea: string
    fecha_mod: string
    usu_crea: string
    usu_mod: string
    activa: boolean
    zona: string
    zonaNombre: string
}

interface RutaSeller extends Ruta {
    completadas: number
    total: number
    porcentaje: number
    estado: string
}

interface Zone {
    IdZona: string;
    NombreZona: string;
}

interface Seller {
    idVendedor: string
    codigo: string
    nombres: string
    apellidos: string
    DNI: string
    telefono: string
    comisionVend: number
    comisionCobranza: number
    empRegistro: string
}

export default function RutaSemanalPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState("configuracion")
    const [rutas, setRutas] = useState<Ruta[]>([])
    const [visitasBySeller, setVisitasBySeller] = useState<RutaSeller[]>([])
    const [history, setHistory] = useState<History[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [loadingRutas, setLoadingRutas] = useState(false)
    const [loadingVisitas, setLoadingVisitas] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)
    const [selectedSeller, setSelectedSeller] = useState<string>("all")
    const [isRutaModalOpen, setIsRutaModalOpen] = useState(false)
    const [isVisitaModalOpen, setIsVisitaModalOpen] = useState(false)
    const [isMapaModalOpen, setIsMapaModalOpen] = useState(false)
    const [selectedVisita, setSelectedVisita] = useState<Direccion | null>(null)
    const [comentarioVisita, setComentarioVisita] = useState("")
    const [selectedMapaDirecciones, setSelectedMapaDirecciones] = useState<Direccion[]>([])
    const [mapaTitulo, setMapaTitulo] = useState("")
    const [zones, setZones] = useState<Zone[]>([])
    const [clientsByZone, setClientsByZone] = useState<ClientZone[]>([])
    const [loadingClientsByZone, setLoadingClientsByZone] = useState<boolean>(false)
    const [searchCliente, setSearchCliente] = useState("")
    const [selectedZones, setSelectedZones] = useState<string[]>([])
    const [rutaEditando, setRutaEditando] = useState<Ruta | null>(null)
    const [newRuta, setNewRuta] = useState({
        nombre: "",
        dia: "",
        vendedorId: "",
        vendedorCode: "",
        zonaSeleccionada: ""
    })
    const [farmaciasSeleccionadas, setFarmaciasSeleccionadas] = useState<string[]>([])
    const [sellers, setSellers] = useState<Seller[]>([])
    const [sellersFiltered, setSellersFiltered] = useState<Seller[]>([])
    const [sellerSearch, setSellerSearch] = useState("")
    const [errors, setErrors] = useState<{[key: string]: string}>({})
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    const [fechaInicio, setFechaInicio] = useState<string>(moment().format('YYYY-MM-DD'))
    const [fechaFin, setFechaFin] = useState<string>(moment().format('YYYY-MM-DD'))

    // KPIs
    const kpis = {
        rutasConfiguradas: rutas.length,
        vendedoresAsignados: [...new Set(rutas.map(r => r.vendedorId))].length,
        direccionesTotales: rutas.reduce((total, ruta) => total + ruta.clientes.length, 0)
    }

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {}

        if (!newRuta.nombre.trim()) {
            newErrors.nombre = "El nombre de la ruta es obligatorio"
        }
        if (!newRuta.dia) {
            newErrors.dia = "El día de la semana es obligatorio"
        }
        if (!newRuta.vendedorId) {
            newErrors.vendedorId = "Debe seleccionar un vendedor"
        }
        if (farmaciasSeleccionadas.length === 0) {
            newErrors.farmacias = "Debe seleccionar al menos una farmacia"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const abrirModalNuevaRuta = () => {
        setRutaEditando(null)
        setNewRuta({
            nombre: "",
            dia: "",
            vendedorId: "",
            zonaSeleccionada: ""
        })
        setFarmaciasSeleccionadas([])
        setErrors({})
        setIsRutaModalOpen(true)
    }

    const abrirModalDeleteRuta = (ruta: Ruta) => {
        setRutaEditando(ruta)
        setErrors({})
        setShowDeleteConfirmModal(true)
    }

    const abrirModalEditarRuta = (ruta: Ruta) => {
        setRutaEditando(ruta)
        setNewRuta({
            nombre: ruta.nombre,
            dia: ruta.dia,
            vendedorId: ruta.vendedorId.toString(),
            zonaSeleccionada: ruta.zona || ""
        })
        setFarmaciasSeleccionadas(ruta.clientes.map(d => d.id))
        setErrors({})
        setIsRutaModalOpen(true)
    }

    const handleSeleccionarFarmacia = (farmaciaId: string) => {
        setFarmaciasSeleccionadas(prev =>
            prev.includes(farmaciaId)
                ? prev.filter(id => id !== farmaciaId)
                : [...prev, farmaciaId]
        )
        // Limpiar error de farmacias si se selecciona al menos una
        if (farmaciasSeleccionadas.length === 0 && errors.farmacias) {
            setErrors(prev => ({...prev, farmacias: ''}))
        }
    }

    const handleGuardarRuta = async () => {
        if (!validateForm()) {
            return
        }

        setLoadingSave(true)
        try {
            const selectedAddresses = clientsByZone
                .filter(f => farmaciasSeleccionadas.includes(f.Codigo))
                .map(f => ({
                    cliente_id: f.Codigo,
                    orden_visita: 0,
                    user: user?.nombreCompleto
                }))

            if (rutaEditando) {
                const response = await apiClient.post('/rutas/upsert', {
                    id: rutaEditando.id,
                    nombre: newRuta.nombre,
                    dia: newRuta.dia,
                    vendedor_id: parseInt(newRuta.vendedorId),
                    zona: newRuta.zonaSeleccionada,
                    activa: true,
                    user: user?.nombreCompleto
                })

                if (response.data.success) {
                    await apiClient.delete(`/rutas/rutaClient/delete-all/${rutaEditando.id}`)

                    for (const address of selectedAddresses) {
                        await apiClient.post('/rutas/rutaClient/upsert', {
                            ...address,
                            ruta_id: rutaEditando.id
                        })
                    }

                    setIsRutaModalOpen(false)
                    setRutaEditando(null)
                    fetchConfigRutas()
                    fetchHistoryRutas()
                    fetchRutasBySeller()
                }
            } else {
                const response = await apiClient.post('/rutas/upsert', {
                    nombre: newRuta.nombre,
                    dia: newRuta.dia,
                    vendedor_id: parseInt(newRuta.vendedorId),
                    zona: newRuta.zonaSeleccionada,
                    activa: true,
                    user: user?.nombreCompleto
                })

                if (response.data.success) {
                    const newId = response.data.data.id

                    for (const address of selectedAddresses) {
                        await apiClient.post('/rutas/rutaClient/upsert', {
                            ...address,
                            ruta_id: newId
                        })
                    }

                    setIsRutaModalOpen(false)
                    setRutaEditando(null)
                    fetchConfigRutas()
                    fetchHistoryRutas()
                    fetchRutasBySeller()
                }
            }
        } catch (error) {
            console.error("Error al guardar ruta:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    const handleEliminarRuta = async (rutaId: number) => {
        try {
            const response = await apiClient.delete(`/rutas/delete/${rutaId}?usu_mod=${user?.nombreCompleto}`)
            if (response.data.success) {
                setShowDeleteConfirmModal(false)
                fetchConfigRutas()
                fetchHistoryRutas()
                fetchRutasBySeller()
            }
        } catch (error) {
            console.error("Error al eliminar ruta:", error)
        }
    }

    const verMapaUbicacion = (direccion: Direccion) => {
        setSelectedMapaDirecciones([direccion])
        setMapaTitulo(`Ubicación - ${direccion.NombreComercial}`)
        setIsMapaModalOpen(true)
    }

    const verMapaRuta = (direcciones: Direccion[], nombreRuta: string) => {
        setSelectedMapaDirecciones(direcciones)
        setMapaTitulo(`Ruta - ${nombreRuta}`)
        setIsMapaModalOpen(true)
    }

    const generarMapaEstatico = (direcciones: Direccion[]) => {
        if (direcciones.length === 0) return ""

        if (direcciones.length === 1) {
            const dir = direcciones[0]
            return `https://www.openstreetmap.org/export/embed.html?bbox=${dir.longitud-0.01}%2C${dir.latitud-0.01}%2C${dir.longitud+0.01}%2C${dir.latitud+0.01}&layer=mapnik&marker=${dir.latitud}%2C${dir.longitud}`
        } else {
            const lats = direcciones.map(d => d.latitud)
            const lons = direcciones.map(d => d.longitud)
            const minLat = Math.min(...lats) - 0.01
            const maxLat = Math.max(...lats) + 0.01
            const minLon = Math.min(...lons) - 0.01
            const maxLon = Math.max(...lons) + 0.01

            let markers = direcciones.map((d, i) =>
                `&marker=${d.latitud}%2C${d.longitud}%3A${i+1}`
            ).join('')

            return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}${markers}&layer=mapnik`
        }
    }

    const handleMarcarLlegada = (visita: Direccion) => {
        setSelectedVisita(visita)
        setComentarioVisita("")
        setIsVisitaModalOpen(true)
    }

    const handleConfirmarVisita = async () => {
        if (!selectedVisita || !comentarioVisita.trim()) {
            return
        }

        try {
            const response = await apiClient.post(`/rutas/update/status/${selectedVisita.ruta_cliente_id}`, {
                status: 'C',
                comment: comentarioVisita,
                usu_mod: user?.nombreCompleto
            })

            if (response.data.success) {
                setIsVisitaModalOpen(false)
                setSelectedVisita(null)
                setComentarioVisita("")
                fetchRutasBySeller()
            }
        } catch (error) {
            console.error("Error al registrar visita:", error)
        }
    }

    const canAccessConfiguracion = user?.idRol && [2, 3].includes(user.idRol)
    const canAccessHistorial = user?.idRol && [2, 3].includes(user.idRol)

    const fetchSellers = async () => {
        try {
            const response = await apiClient.get('/usuarios/listar/vendedores')
            const vendedoresTransformados = response.data.data.data.map((v: any) => ({
                idVendedor: String(v.idVendedor),
                codigo: v.Codigo_Vend,
                nombres: v.Nombres,
                apellidos: v.Apellidos,
                DNI: v.DNI,
                telefono: v.Telefonos,
                comisionVend: v.ComisionVend,
                comisionCobranza: v.ComisionCobranza,
                empRegistro: v.EmpRegistro,
            }));
            setSellers(vendedoresTransformados);
        } catch (error) {
            setSellers([]);
        }
    }

    const fetchZones = async () => {
        try {
            const response = await ClientService.getZones();
            const data = response.data || []
            setZones(data.filter((item: Zone) => String(item.NombreZona || '').trim() != ''))
        } catch (error) {
            console.error("Error fetching zones:", error)
            setZones([])
        }
    }

    const fetchConfigRutas = async () => {
        setLoadingRutas(true)
        try {
            const response = await apiClient.get('/rutas/get/configs')
            const data = response.data?.data || []

            const rutasFormateadas = formatearRutas(data)
            setRutas(rutasFormateadas)
        } catch (error) {
            console.error("Error fetching routes:", error)
            setRutas([])
        } finally {
            setLoadingRutas(false)
        }
    }

    const fetchSellerZones = async (seller: string) => {
        setLoadingSave(true)
        try {
            setSelectedZones([])
            const response = await apiClient.get(`/rutas/seller-zone?seller=${seller}`)
            const data = response.data?.data || []

            for (const item of data) {
                await agregarZona(item.IdZona)
            }
        } catch (error) {
            console.error("Error fetching zones:", error)
        } finally {
            setLoadingSave(false)
        }
    }

    const fetchHistoryRutas = async () => {
        setLoadingHistory(true)
        try {
            const params: any = {}

            if (fechaInicio) {
                params.fecha_inicio = fechaInicio
            }
            if (fechaFin) {
                params.fecha_fin = fechaFin
            }

            const response = await apiClient.post('/rutas/history', params)
            const data = response.data?.data || []
            setHistory(data)
        } catch (error) {
            console.error("Error fetching routes:", error)
            setHistory([])
        } finally {
            setLoadingHistory(false)
        }
    }

    const limpiarFiltros = () => {
        setFechaInicio("")
        setFechaFin("")
    }

    const fetchRutasBySeller = async () => {
        setLoadingVisitas(true)
        try {
            let url = '/rutas/get'
            const params = []
            params.push(`activa=1`)

            if (selectedSeller !== 'all') {
                params.push(`vendedor_id=${selectedSeller}`)
            }
            if (user?.idRol === 1) {
                params.push(`vendedor_code=${user.codigo}`)
            }

            if (params.length > 0) {
                url += `?${params.join('&')}`
            }

            const response = await apiClient.get(url)
            const data = response.data?.data || []

            const rutasFormateadas = formatearRutas(data)
            setVisitasBySeller(rutasFormateadas)
        } catch (error) {
            console.error("Error fetching seller routes:", error)
            setVisitasBySeller([])
        } finally {
            setLoadingVisitas(false)
        }
    }

    const formatearRutas = (data) => {
        const rutasMap = new Map()

        data.forEach(item => {
            if (!rutasMap.has(item.id)) {
                rutasMap.set(item.id, {
                    id: item.id,
                    nombre: item.nombre,
                    dia: item.dia,
                    vendedorId: item.vendedor_id,
                    vendedorNombre: item.vendedor_nombre,
                    zona: item.zona,
                    zonaNombre: item.zona_nombre,
                    activa: item.activa,
                    estado: item.estado_ruta || 'P',
                    fechaCreacion: item.fecha_crea,
                    clientes: [],
                    completadas: item.clientes_completados || 0,
                    total: item.total_clientes || 0,
                    porcentaje: item.porcentaje_completado || 0,
                })
            }

            const ruta = rutasMap.get(item.id)
            ruta.clientes.push({
                id: item.Codigo,
                Nombre: item.Nombre,
                NombreComercial: item.NombreComercial,
                direccion: item.direccion,
                latitud: Number(item.latitud),
                longitud: Number(item.longitud),
                telefono: item.Telefono,
                estado: item.estado_cliente || 'P',
                ruta_cliente_id: item.id_cliente,
            })
        })

        return Array.from(rutasMap.values())
    }

    const fetchClientsByZones = async (zonaId?: string) => {
        setLoadingClientsByZone(true)
        try {
            if (zonaId) {
                const response = await ClientService.getClientsByZone(zonaId)
                const data = response.data || []
                const nuevosClientes = data.map((item: ClientZone) => ({
                    ...item,
                    latitud: Number(item.latitud),
                    longitud: Number(item.longitud),
                }))

                setClientsByZone(prev => {
                    const clientesUnicos = [...prev]
                    nuevosClientes.forEach(nuevoCliente => {
                        if (!clientesUnicos.find(c => c.Codigo === nuevoCliente.Codigo)) {
                            clientesUnicos.push(nuevoCliente)
                        }
                    })
                    return clientesUnicos
                })
            } else {
                setClientsByZone([])
            }
        } catch (error) {
            console.error("Error fetching clients by zone:", error)
        } finally {
            setLoadingClientsByZone(false)
        }
    }

    const agregarZona = async (zonaId: string) => {
        if (!selectedZones.includes(zonaId)) {
            setSelectedZones(prev => [...prev, zonaId])
            await fetchClientsByZones(zonaId)
        }
    }

    const removerZona = (zonaId: string) => {
        setSelectedZones(prev => prev.filter(id => id !== zonaId))
    }

    const limpiarTodasLasZonas = () => {
        setSelectedZones([])
        setClientsByZone([])
        setFarmaciasSeleccionadas([])
    }

    const clientesFiltrados = clientsByZone.filter(client =>
        client.NombreComercial?.toLowerCase().includes(searchCliente.toLowerCase()) ||
        client.Codigo?.toLowerCase().includes(searchCliente.toLowerCase()) ||
        client.Nombre?.toLowerCase().includes(searchCliente.toLowerCase())
    )

    useEffect(() => {
        if (sellerSearch.length > 0) {
            setSellersFiltered(sellers.filter(item =>
                item.codigo?.includes(sellerSearch) ||
                `${item.nombres} ${item.apellidos}`.toUpperCase().includes(sellerSearch.toUpperCase())))
        } else {
            setSellersFiltered(sellers)
        }
    }, [sellers, sellerSearch]);

    useEffect(() => {
        if (user?.idRol === 1) {
            setActiveTab("plan-semanal")
        }
    }, [user])

    useEffect(() => {
        if (newRuta.zonaSeleccionada != '') {
            if (!selectedZones.includes(newRuta.zonaSeleccionada)) {
                agregarZona(newRuta.zonaSeleccionada)
            }
            setNewRuta(prev => ({...prev, zonaSeleccionada: ""}))
        }
    }, [newRuta.zonaSeleccionada]);

    useEffect(() => {
        if (newRuta.vendedorCode != '') {
            fetchSellerZones(newRuta.vendedorCode || '')
        }
    }, [newRuta.vendedorCode]);

    useEffect(() => {
        fetchZones()
        fetchSellers()
        fetchConfigRutas()
        fetchHistoryRutas()
    }, [])

    useEffect(() => {
        if (user) {
            fetchRutasBySeller();
        }
    }, [selectedSeller, user]);

    useEffect(() => {
        if (activeTab === "historial") {
            fetchHistoryRutas()
        }
    }, [fechaInicio, fechaFin, activeTab])

    const exportarConfiguracionesExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema Rutas';
            workbook.created = new Date();

            const worksheet = workbook.addWorksheet('Configuraciones Rutas');

            worksheet.columns = [
                { header: 'Nombre Ruta', key: 'nombre', width: 25 },
                { header: 'Día', key: 'dia', width: 12 },
                { header: 'Vendedor', key: 'vendedor', width: 25 },
                { header: 'Zona', key: 'zona', width: 20 },
                { header: 'Estado', key: 'estado', width: 15 },
                { header: 'Total Direcciones', key: 'totalDirecciones', width: 8 },
                { header: 'Farmacias Asignadas', key: 'farmacias', width: 35 },
                { header: 'Fecha Creación', key: 'fechaCreacion', width: 15 },
                { header: 'Activa', key: 'activa', width: 8 }
            ];

            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '2E5AA7' }
            };

            rutas.forEach(ruta => {
                worksheet.addRow({
                    nombre: ruta.nombre,
                    dia: ruta.dia,
                    vendedor: ruta.vendedorNombre,
                    zona: ruta.zonaNombre,
                    estado: ruta.estado === 'C' ? 'Completada' : ruta.estado === 'P' ? 'En Proceso' : 'Pendiente',
                    totalDirecciones: ruta.clientes.length,
                    farmacias: ruta.clientes.map(cliente => cliente.NombreComercial).join(', '),
                    fechaCreacion: moment(ruta.fechaCreacion, 'yyyy-MM-DDTHH:mm').format('DD/MM/YYYY'),
                    activa: ruta.activa ? 'Sí' : 'No'
                });
            });

            worksheet.eachRow((row) => {
                row.alignment = { vertical: 'middle', horizontal: 'left' };
                row.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Configuraciones_Rutas_${moment().format('DD-MM-YYYY_HH-mm')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error al exportar Excel:', error);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rutas Semanales</h1>
                <p className="text-gray-500">Gestión y seguimiento de rutas de venta semanales</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    {canAccessConfiguracion && (
                        <TabsTrigger value="configuracion" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Configuración
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="plan-semanal" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Plan Semanal
                    </TabsTrigger>
                    {canAccessHistorial && (
                        <TabsTrigger value="historial" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Historial
                        </TabsTrigger>
                    )}
                </TabsList>

                {canAccessConfiguracion && (
                    <TabsContent value="configuracion" className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Rutas Configuradas</CardTitle>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{kpis.rutasConfiguradas}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Rutas activas en el sistema
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Vendedores Asignados</CardTitle>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{kpis.vendedoresAsignados}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Vendedores con rutas asignadas
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Direcciones Totales</CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{kpis.direccionesTotales}</div>
                                    <p className="text-xs text-muted-foreground">
                                        Puntos de visita configurados
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle>Rutas Configuradas</CardTitle>
                                    <CardDescription>
                                        Crea y gestiona las rutas que se asignarán a los vendedores cada semana
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                    <Button
                                        onClick={exportarConfiguracionesExcel}
                                        variant="outline"
                                        className="flex items-center gap-2 w-full sm:w-auto"
                                        disabled={rutas.length === 0 || loadingRutas}
                                    >
                                        <Download className="h-4 w-4" />
                                        Exportar Excel
                                    </Button>
                                    <Button
                                        onClick={abrirModalNuevaRuta}
                                        className="flex items-center gap-2 w-full sm:w-auto"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nueva Ruta
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingRutas ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <Skeleton key={index} className="h-32 w-full" />
                                        ))}
                                    </div>
                                ) : rutas.length > 0 ? (
                                    <div className="space-y-4 md:space-y-6">
                                        {rutas.map((ruta) => (
                                            <Card key={ruta.id} className="overflow-hidden">
                                                <CardContent className="p-4 md:p-6">
                                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                                                <h3 className="text-lg font-semibold break-words">{ruta.nombre}</h3>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                                                        {ruta.dia}
                                                                    </Badge>
                                                                    {ruta.estado === 'C' && (
                                                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                                                            <CheckCircle className="h-3 w-3 mr-1"/>
                                                                            Completada
                                                                        </Badge>
                                                                    )}
                                                                    {ruta.estado === 'P' && (
                                                                        <Badge variant="default" className="text-xs">
                                                                            En Proceso
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                                                                <div className="flex items-start gap-2">
                                                                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <span className="break-words">{ruta.vendedorNombre}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <span>{ruta.clientes.length} direcciones</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-2">
                                                                    <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <span>Creado: {moment(ruta.fechaCreacion, 'yyyy-MM-DDTHH:mm').format('DD/MM/yyyy')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {ruta.estado === 'P' && <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm"
                                                                        className="self-start">
                                                                    <MoreHorizontal className="h-4 w-4"/>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => abrirModalEditarRuta(ruta)}>
                                                                    <Edit className="h-4 w-4 mr-2"/>
                                                                    Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => abrirModalDeleteRuta(ruta)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2"/>
                                                                    Eliminar
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>}
                                                    </div>

                                                    <div className="border-t pt-4">
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                                                            <h4 className="font-medium">Direcciones Asignadas</h4>
                                                            {/*<Button*/}
                                                            {/*    variant="outline"*/}
                                                            {/*    size="sm"*/}
                                                            {/*    onClick={() => verMapaRuta(ruta.clientes, ruta.nombre)}*/}
                                                            {/*    className="w-full sm:w-auto"*/}
                                                            {/*>*/}
                                                            {/*    <MapPin className="h-4 w-4 mr-1" />*/}
                                                            {/*    Ver Ruta Completa*/}
                                                            {/*</Button>*/}
                                                        </div>

                                                        <div className="space-y-3">
                                                            {ruta.clientes.map((direccion) => (
                                                                <div key={direccion.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                                            <span className="font-medium break-words">{direccion.NombreComercial}</span>
                                                                            <Badge variant="outline" className="text-xs w-fit">
                                                                                {ruta.zonaNombre}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                                                                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                            <span className="break-words">{direccion.direccion}</span>
                                                                        </p>
                                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-gray-500">
                                                                            <div className="flex items-center gap-1">
                                                                                <Locate className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                                                                <span>Coordenadas: {direccion.latitud.toFixed(4)}, {direccion.longitud.toFixed(4)}</span>
                                                                            </div>
                                                                            {direccion.telefono && (
                                                                                <div className="flex items-center gap-1">
                                                                                    <Phone className="h-3 w-3 text-lime-600 flex-shrink-0" />
                                                                                    <span>{direccion.telefono}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center gap-1">
                                                                                <User className="h-3 w-3 text-orange-600 flex-shrink-0" />
                                                                                <span>{direccion.Nombre}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => verMapaUbicacion(direccion)}
                                                                        className="w-full md:w-auto mt-2 md:mt-0"
                                                                    >
                                                                        <MapPin className="h-4 w-4 mr-1" />
                                                                        Ver Mapa
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay rutas configuradas</h3>
                                        <p className="text-gray-500 mb-4">
                                            Comienza creando la primera ruta para tus vendedores
                                        </p>
                                        <Button onClick={abrirModalNuevaRuta} className="w-full sm:w-auto">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Crear Primera Ruta
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="plan-semanal" className="space-y-6">
                    {user?.idRol && [2, 3].includes(user.idRol) ? (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">Filtrar por vendedor:</span>
                                    </div>
                                    <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                                        <SelectTrigger className="w-full sm:w-64">
                                            <SelectValue placeholder="Todos los vendedores" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los vendedores</SelectItem>
                                            {sellers.map((seller) => (
                                                <SelectItem key={seller.idVendedor} value={seller.idVendedor.toString()}>
                                                    {seller.nombres} {seller.apellidos} <span className='text-blue-400'> {seller.codigo}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                    <div className="flex items-center gap-2">
                                        <Route className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm font-medium">{visitasBySeller.length} Rutas Asignadas para usted</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {loadingVisitas ? (
                        <div className="space-y-6">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <Skeleton key={index} className="h-64 w-full" />
                            ))}
                        </div>
                    ) : visitasBySeller.length > 0 ? (
                        <div className="space-y-4 md:space-y-6">
                            {visitasBySeller
                                .filter(item => selectedSeller === "all" || item.vendedorId.toString() === selectedSeller)
                                .map((seller) => (
                                    <Card key={seller.id}>
                                        <CardHeader className="border-b">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <CardTitle className="flex items-center gap-2 mb-2">
                                                        <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                                        <span className="break-words">{seller.nombre}</span>
                                                    </CardTitle>
                                                    <CardDescription className='break-words'>
                                                        {seller.zonaNombre} • {seller.vendedorNombre}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <div className={`text-2xl font-bold ${seller.estado === 'C' ? 'text-green-500' : 'text-orange-500'}`}>
                                                            {seller.completadas}/{seller.total}
                                                        </div>
                                                        <div className="text-sm text-gray-500">Visitas completadas</div>
                                                    </div>
                                                    <div className="w-12 h-12 relative flex-shrink-0">
                                                        <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
                                                        <div
                                                            className={`absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-r-transparent transform -rotate-45 ${seller.estado === 'C' ? 'border-green-500' : 'border-orange-500'}`}
                                                            style={{ clipPath: `inset(0 ${100 - seller.porcentaje}% 0 0)` }}
                                                        ></div>
                                                        <div className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center text-xs font-bold">
                                                            {Math.round(seller.porcentaje)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                {seller.clientes.map((visita) => (
                                                    <div key={visita.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${visita.estado === 'C' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                                    <span className="font-medium break-words">{visita.NombreComercial}</span>
                                                                </div>
                                                                {visita.estado === 'C' && (
                                                                    <Badge className="bg-green-100 text-green-800 w-fit">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Completada
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 flex items-start gap-2 mb-3">
                                                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                <span className="break-words">{visita.direccion}</span>
                                                            </p>
                                                            <div className='flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-gray-500'>
                                                                <div className="flex items-center gap-1">
                                                                    <Locate className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                                                    <span>Coordenadas: {visita.latitud.toFixed(4)}, {visita.longitud.toFixed(4)}</span>
                                                                </div>
                                                                {visita.telefono && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Phone className="h-3 w-3 text-lime-600 flex-shrink-0" />
                                                                        <span>{visita.telefono}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1">
                                                                    <User className="h-3 w-3 text-orange-600 flex-shrink-0" />
                                                                    <span>{visita.Nombre}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 w-full md:w-auto">
                                                            {visita.estado === 'P' ? (
                                                                <Button
                                                                    onClick={() => handleMarcarLlegada(visita)}
                                                                    className="flex items-center gap-2 w-full md:w-auto"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    Marcar Llegada
                                                                </Button>
                                                            ) : (
                                                                <div className="text-right">
                                                                </div>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => verMapaUbicacion(visita)}
                                                                className="w-full md:w-auto"
                                                            >
                                                                <MapPin className="h-4 w-4 mr-1" />
                                                                Ver Mapa
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            }
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay rutas asignadas</h3>
                            <p className="text-gray-500">
                                {selectedSeller === "all" ? "No hay rutas configuradas en el sistema" : "El vendedor seleccionado no tiene rutas asignadas"}
                            </p>
                        </div>
                    )}
                </TabsContent>

                {canAccessHistorial && (
                    <TabsContent value="historial" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filtros del Historial</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                                        <Input
                                            id="fechaInicio"
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fechaFin">Fecha Fin</Label>
                                        <Input
                                            id="fechaFin"
                                            type="date"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 flex items-end">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={limpiarFiltros}
                                                className="flex-1"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Limpiar
                                            </Button>
                                            <Button
                                                onClick={fetchHistoryRutas}
                                                disabled={loadingHistory}
                                                className="flex-1"
                                            >
                                                {loadingHistory ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Filter className="h-4 w-4 mr-2" />
                                                )}
                                                Filtrar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Visitas</CardTitle>
                                <CardDescription>
                                    Registro completo de todas las visitas realizadas por los vendedores
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingHistory ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <Skeleton key={index} className="h-32 w-full" />
                                        ))}
                                    </div>
                                ) : history.length > 0 ? (
                                    <div className="space-y-4 md:space-y-6">
                                        {history.map((historyItem, index) => (
                                            <Card key={`${historyItem.id}-${index}`} className="overflow-hidden">
                                                <CardContent className="p-4 md:p-6">
                                                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                                                <h3 className="text-lg font-semibold break-words">{historyItem.nombreRuta}</h3>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                                                        {historyItem.zonaNombre}
                                                                    </Badge>
                                                                    {historyItem.activa ? (
                                                                        <>
                                                                            {historyItem.estado_cliente === 'P' && <Badge variant="default"
                                                                                    className="text-xs">
                                                                                Pendiente
                                                                            </Badge>}
                                                                            {historyItem.estado_cliente === 'C' && <Badge
                                                                                className="bg-green-100 text-green-800 w-fit">
                                                                                <CheckCircle className="h-3 w-3 mr-1"/>
                                                                                Completada
                                                                            </Badge>}
                                                                        </>
                                                                    ) : (
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            <X className="h-3 w-3 mr-1"/>
                                                                            Eliminado
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                                                                <div className="flex items-start gap-2">
                                                                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <span className="font-medium block sm:inline">Vendedor: </span>
                                                                        <span className="break-words">{historyItem.vendedorNombre}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div className="min-w-0">
                                                                        <span className="font-medium block sm:inline">Farmacia: </span>
                                                                        <span className="break-words">{historyItem.NombreComercial}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-2">
                                                                    <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <span className="font-medium block sm:inline">Creado: </span>
                                                                        <span>{moment(historyItem.fecha_crea).format('DD/MM/YYYY HH:mm')}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-start gap-2">
                                                                    <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <span className="font-medium block sm:inline">Modificado: </span>
                                                                        <span>{historyItem.fecha_mod ? moment(historyItem.fecha_mod).format('DD/MM/YYYY HH:mm') : '--/--/---- --:--'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => verMapaUbicacion(historyItem)}
                                                            className="w-full lg:w-auto mt-2 lg:mt-0"
                                                        >
                                                            <MapPin className="h-4 w-4 mr-1" />
                                                            Ver Mapa
                                                        </Button>
                                                    </div>

                                                    <div className="border-t pt-4">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                                            <div>
                                                                <h4 className="font-medium mb-3 text-sm md:text-base">Información de la Farmacia</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex items-start gap-2">
                                                                        <User className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium">Representante: </span>
                                                                            <span className="break-words">{historyItem.Nombre}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <MapPin className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium">Dirección: </span>
                                                                            <span className="break-words">{historyItem.direccion}</span>
                                                                        </div>
                                                                    </div>
                                                                    {historyItem.telefono && (
                                                                        <div className="flex items-start gap-2">
                                                                            <Phone className="h-4 w-4 mt-0.5 text-lime-600 flex-shrink-0" />
                                                                            <div>
                                                                                <span className="font-medium">Teléfono: </span>
                                                                                <span>{historyItem.telefono}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex items-start gap-2">
                                                                        <Locate className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                                                                        <div>
                                                                            <span className="font-medium">Coordenadas: </span>
                                                                            <span>{historyItem.latitud.toFixed(4)}, {historyItem.longitud.toFixed(4)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-medium mb-3 text-sm md:text-base">Información del Registro</h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <div className="flex items-start gap-2">
                                                                        <User className="h-4 w-4 mt-0.5 text-gray-600 flex-shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium">Usuario Creación: </span>
                                                                            <span className="break-words">{historyItem.usu_crea}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <User className="h-4 w-4 mt-0.5 text-gray-600 flex-shrink-0" />
                                                                        <div className="min-w-0">
                                                                            <span className="font-medium">Usuario Modificación: </span>
                                                                            <span className="break-words">{historyItem.usu_mod || '--'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <Target className="h-4 w-4 mt-0.5 text-gray-600 flex-shrink-0" />
                                                                        <div>
                                                                            <span className="font-medium">ID Cliente Ruta: </span>
                                                                            <span>{historyItem.ruta_cliente_id || '--'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {historyItem.comentario && (
                                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                                                <h4 className="font-medium mb-2 text-sm md:text-base">Comentario de la Visita</h4>
                                                                <p className="text-sm text-gray-700 break-words">{historyItem.comentario}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial de visitas</h3>
                                        <p className="text-gray-500">
                                            El historial aparecerá aquí una vez que se completen las visitas
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            <Dialog open={isRutaModalOpen} onOpenChange={setIsRutaModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {rutaEditando ? 'Editar Ruta' : 'Nueva Ruta'}
                        </DialogTitle>
                        <DialogDescription>
                            {rutaEditando
                                ? 'Modifica los datos de la ruta existente'
                                : 'Configura una nueva ruta semanal para tus vendedores'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre de la Ruta *</Label>
                                <Input
                                    id="nombre"
                                    placeholder="Ej: Ruta Norte"
                                    value={newRuta.nombre}
                                    onChange={(e) => {
                                        setNewRuta({...newRuta, nombre: e.target.value})
                                        if (errors.nombre) setErrors(prev => ({...prev, nombre: ''}))
                                    }}
                                    className={errors.nombre ? "border-red-500" : ""}
                                />
                                {errors.nombre && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.nombre}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dia">Día de la Semana *</Label>
                                <Select
                                    value={newRuta.dia}
                                    onValueChange={(value) => {
                                        setNewRuta({...newRuta, dia: value})
                                        if (errors.dia) setErrors(prev => ({...prev, dia: ''}))
                                    }}
                                >
                                    <SelectTrigger className={errors.dia ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Seleccionar día" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Lunes">Lunes</SelectItem>
                                        <SelectItem value="Martes">Martes</SelectItem>
                                        <SelectItem value="Miércoles">Miércoles</SelectItem>
                                        <SelectItem value="Jueves">Jueves</SelectItem>
                                        <SelectItem value="Viernes">Viernes</SelectItem>
                                        <SelectItem value="Sábado">Sábado</SelectItem>
                                        <SelectItem value="Domingo">Domingo</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.dia && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.dia}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vendedor">Vendedor *</Label>
                                <div className={errors.vendedorId ? "border border-red-500 rounded-md p-1" : ""}>
                                    <Combobox<Seller>
                                        items={sellersFiltered}
                                        value={newRuta.vendedorId}
                                        onSearchChange={setSellerSearch}
                                        onSelect={(value) => {
                                            setNewRuta({...newRuta, vendedorId: value?.idVendedor || '', vendedorCode: value?.codigo || ''})
                                            if (errors.vendedorId) setErrors(prev => ({...prev, vendedorId: ''}))
                                        }}
                                        getItemKey={(seller) => seller.idVendedor}
                                        getItemLabel={(seller) => (
                                            <div>
                                                <span>{`${seller.nombres} ${seller.apellidos}`}</span>
                                                <span className='text-blue-400'> {seller.codigo}</span>
                                            </div>
                                        )}
                                        placeholder="Buscar vendedor..."
                                        emptyText="No se encontraron vendedores"
                                        searchText="Escribe al menos 3 vendedores..."
                                        loadingText="Buscando vendedores..."
                                    />
                                </div>
                                {errors.vendedorId && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.vendedorId}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Sección de Zonas Seleccionadas */}
                        {selectedZones.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label>Zonas Seleccionadas ({selectedZones.length})</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={limpiarTodasLasZonas}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Limpiar Todas
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedZones.map(zonaId => {
                                        const zona = zones.find(z => z.IdZona === zonaId)
                                        return (
                                            <Badge key={zonaId} variant="secondary" className="flex items-center gap-1">
                                                {zona?.NombreZona || zonaId}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-4 w-4 p-0 hover:bg-red-100"
                                                    onClick={() => removerZona(zonaId)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="zona">Agregar Zona</Label>
                            <Select
                                disabled={loadingSave}
                                value={newRuta.zonaSeleccionada}
                                onValueChange={(value) => {
                                    setNewRuta({...newRuta, zonaSeleccionada: value})
                                    if (errors.zonaSeleccionada) setErrors(prev => ({...prev, zonaSeleccionada: ''}))
                                }}
                            >
                                <SelectTrigger id="zona" className={errors.zonaSeleccionada ? "border-red-500" : ""}>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <SelectValue placeholder="Seleccionar zona para agregar" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {zones
                                        .filter(zona => !selectedZones.includes(zona.IdZona)) // Filtrar zonas ya seleccionadas
                                        .map((zona) => (
                                            <SelectItem key={zona.IdZona} value={zona.IdZona}>
                                                <div className="flex items-center gap-2">
                                                    {zona.NombreZona}
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.zonaSeleccionada && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.zonaSeleccionada}
                                </p>
                            )}
                        </div>

                        {/* Sección de Búsqueda y Farmacias */}
                        {selectedZones.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Farmacias en Zonas Seleccionadas</Label>
                                    <Badge variant="outline">
                                        {farmaciasSeleccionadas.length} seleccionadas
                                    </Badge>
                                </div>

                                {/* Buscador */}
                                <div className="space-y-2">
                                    <Label htmlFor="buscarFarmacia">Buscar Farmacia</Label>
                                    <Input
                                        id="buscarFarmacia"
                                        placeholder="Buscar por nombre comercial, RUC o representante..."
                                        value={searchCliente}
                                        onChange={(e) => setSearchCliente(e.target.value)}
                                    />
                                </div>

                                {errors.farmacias && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            {errors.farmacias}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                                    {loadingClientsByZone && clientsByZone.length === 0 ? (
                                        Array.from({ length: 3 }).map((_, index) => (
                                            <Skeleton key={index} className="h-32 w-full" />
                                        ))
                                    ) : clientesFiltrados.length > 0 ? (
                                        clientesFiltrados.map((client) => {
                                            const zona = zones.find(z => z.IdZona === client.zona) // Asumiendo que client tiene zona
                                            return (
                                                <div key={client.Codigo} className="flex items-start gap-3 p-4 hover:bg-gray-50">
                                                    <Checkbox
                                                        checked={farmaciasSeleccionadas.includes(client.Codigo)}
                                                        onCheckedChange={() => handleSeleccionarFarmacia(client.Codigo)}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium">{client.NombreComercial}</span>
                                                            {zona && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {zona.NombreZona}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 text-sm">
                                                            <div>
                                                                <strong>RUC:</strong> {client.Codigo}
                                                            </div>
                                                            <div>
                                                                <strong>Representante:</strong> {client.Nombre}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{client.direccion}</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                                                            <div>
                                                                <strong>Teléfono:</strong> {client.Telefono || '--- --- ---'}
                                                            </div>
                                                            <div className="col-span-2">
                                                                <strong>Coordenadas:</strong> {client.latitud.toFixed(4)}, {client.longitud.toFixed(4)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => verMapaUbicacion({
                                                            id: client.Codigo,
                                                            NombreComercial: client.NombreComercial,
                                                            direccion: client.direccion,
                                                            latitud: client.latitud,
                                                            longitud: client.longitud
                                                        })}
                                                    >
                                                        <MapPin className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-8">
                                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                {searchCliente ? "No se encontraron farmacias" : "No hay farmacias cargadas"}
                                            </h3>
                                            <p className="text-gray-500">
                                                {searchCliente
                                                    ? "Intenta con otros términos de búsqueda"
                                                    : "Agrega zonas para ver las farmacias disponibles"
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Contador de resultados */}
                                {searchCliente && clientesFiltrados.length > 0 && (
                                    <div className="text-sm text-gray-500 text-center">
                                        Mostrando {clientesFiltrados.length} de {clientsByZone.length} farmacias
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRutaModalOpen(false)} disabled={loadingSave}>
                            Cancelar
                        </Button>
                        <Button onClick={handleGuardarRuta} disabled={loadingSave}>
                            {loadingSave && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {rutaEditando ? 'Actualizar Ruta' : 'Crear Ruta'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isVisitaModalOpen} onOpenChange={setIsVisitaModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Marcar Llegada</DialogTitle>
                        <DialogDescription>
                            Confirma tu llegada a {selectedVisita?.NombreComercial} y describe la visita
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-1">{selectedVisita?.NombreComercial}</h4>
                            <p className="text-sm text-gray-600 flex items-center"><Locate className="h-4 w-4 mr-2 text-blue-600" /> {selectedVisita?.direccion}</p>
                            <p className="text-xs text-gray-500 flex items-center"><User className="h-4 w-4 mr-2 text-orange-600" /> {selectedVisita?.Nombre}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comentario">Comentario de la visita *</Label>
                            <Textarea
                                id="comentario"
                                placeholder="Describe los resultados obtenidos, observaciones, pedidos realizados, etc."
                                value={comentarioVisita}
                                onChange={(e) => setComentarioVisita(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsVisitaModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmarVisita}
                            disabled={!comentarioVisita.trim()}
                            className="flex items-center gap-2"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar Visita
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isMapaModalOpen} onOpenChange={setIsMapaModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{mapaTitulo}</DialogTitle>
                        <DialogDescription>
                            {selectedMapaDirecciones.length === 1
                                ? `Ubicación de ${selectedMapaDirecciones[0]?.NombreComercial}`
                                : `${selectedMapaDirecciones.length} ubicaciones en el mapa`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                            <iframe
                                src={generarMapaEstatico(selectedMapaDirecciones)}
                                width="100%"
                                height="400"
                                style={{ border: 'none' }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>

                        {selectedMapaDirecciones.length > 1 && (
                            <div className="space-y-2">
                                <h4 className="font-medium">Puntos de la ruta:</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {selectedMapaDirecciones.map((direccion, index) => (
                                        <div key={direccion.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                            <Badge variant="outline">{index + 1}</Badge>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{direccion.NombreComercial}</div>
                                                <div className="text-xs text-gray-500">{direccion.direccion}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMapaModalOpen(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Está seguro que quiere eliminar?
                        </DialogTitle>
                        <DialogDescription>
                            Se eliminará el registro, todas sus direcciones y progresos
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteConfirmModal(false)
                            }}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                handleEliminarRuta(rutaEditando?.id || 0)
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}