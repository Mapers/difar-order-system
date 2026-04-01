'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, X, AlertCircle, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Combobox } from "@/app/dashboard/mis-pedidos/page"

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

interface Zone {
    IdZona: string
    NombreZona: string
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

interface RutaModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    rutaEditando: Ruta | null
    newRuta: {
        nombre: string
        dia: string
        vendedorId: string
        vendedorCode: string
        zonaSeleccionada: string
    }
    setNewRuta: (ruta: any) => void
    zones: Zone[]
    selectedZones: string[]
    clientsByZone: ClientZone[]
    loadingClientsByZone: boolean
    loadingSave: boolean
    searchCliente: string
    setSearchCliente: (value: string) => void
    farmaciasSeleccionadas: string[]
    errors: { [key: string]: string }
    setErrors: (errors: any) => void
    sellersFiltered: Seller[]
    sellerSearch: string
    setSellerSearch: (value: string) => void
    onGuardarRuta: () => void
    onRemoverZona: (zonaId: string) => void
    onLimpiarTodasLasZonas: () => void
    onSeleccionarFarmacia: (farmaciaId: string) => void
    onVerMapaUbicacion: (direccion: Direccion) => void
}

export function RutaModal({
                              isOpen,
                              onOpenChange,
                              rutaEditando,
                              newRuta,
                              setNewRuta,
                              zones,
                              selectedZones,
                              clientsByZone,
                              loadingClientsByZone,
                              loadingSave,
                              searchCliente,
                              setSearchCliente,
                              farmaciasSeleccionadas,
                              errors,
                              setErrors,
                              sellersFiltered,
                              sellerSearch,
                              setSellerSearch,
                              onGuardarRuta,
                              onRemoverZona,
                              onLimpiarTodasLasZonas,
                              onSeleccionarFarmacia,
                              onVerMapaUbicacion,
                          }: RutaModalProps) {

    const clientesFiltrados = clientsByZone.filter(client =>
        client.NombreComercial?.toLowerCase().includes(searchCliente.toLowerCase()) ||
        client.Codigo?.toLowerCase().includes(searchCliente.toLowerCase()) ||
        client.Nombre?.toLowerCase().includes(searchCliente.toLowerCase())
    )

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                                    if (errors.nombre) setErrors((prev: any) => ({...prev, nombre: ''}))
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
                                    if (errors.dia) setErrors((prev: any) => ({...prev, dia: ''}))
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
                                        if (errors.vendedorId) setErrors((prev: any) => ({...prev, vendedorId: ''}))
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
                                    onClick={onLimpiarTodasLasZonas}
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
                                                onClick={() => onRemoverZona(zonaId)}
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
                                if (errors.zonaSeleccionada) setErrors((prev: any) => ({...prev, zonaSeleccionada: ''}))
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
                                    .filter(zona => !selectedZones.includes(zona.IdZona))
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
                                        const zona = zones.find(z => z.IdZona === (client as any).zona)
                                        return (
                                            <div key={client.Codigo} className="flex items-start gap-3 p-4 hover:bg-gray-50">
                                                <Checkbox
                                                    checked={farmaciasSeleccionadas.includes(client.Codigo)}
                                                    onCheckedChange={() => onSeleccionarFarmacia(client.Codigo)}
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
                                                    onClick={() => onVerMapaUbicacion({
                                                        id: client.Codigo,
                                                        NombreComercial: client.NombreComercial,
                                                        direccion: client.direccion,
                                                        latitud: client.latitud,
                                                        longitud: client.longitud,
                                                        Nombre: client.Nombre,
                                                        estado: '',
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loadingSave}>
                        Cancelar
                    </Button>
                    <Button onClick={onGuardarRuta} disabled={loadingSave}>
                        {loadingSave && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {rutaEditando ? 'Actualizar Ruta' : 'Crear Ruta'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}