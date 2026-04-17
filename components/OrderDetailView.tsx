'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft, Printer, FileDown, Edit, X, Save, Plus, Trash,
    Pen, ArrowBigDownDash, Gift, Search, Minus, CheckCircle, XCircle, Check, ChevronDown, User, MapPin
} from "lucide-react"
import Link from "next/link"
import {
    Dialog, DialogContent, DialogDescription,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Badge as IgvBadgeBase } from "@/components/ui/badge"
import { ORDER_STATES } from "@/app/dashboard/mis-pedidos/page"
import {Pedido, PedidoDet} from "@/app/dashboard/estados-pedidos/page"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import SearchPickerDialog from "@/components/tomar-pedido/SearchPickerDialog";
import React from "react";

export type OrderDetailContext = 'mis-pedidos' | 'estados-pedidos' | 'comprobantes'

export interface OrderDetailViewProps {
    context: OrderDetailContext
    backHref: string
    pedido:   Pedido | null
    detalles: PedidoDet[]
    loading:  boolean
    error:    string | null
    canEdit?:          boolean
    isEditing?:        boolean
    tempDetalles?:     PedidoDet[]
    onEditToggle?:     () => void
    onSaveChanges?:    () => void
    onRemoveItem?:     (index: number) => void
    onQuantityChange?: (index: number, qty: number) => void
    canAddProduct?:        boolean
    openAddModal?:         boolean
    onOpenAddModal?:       (open: boolean) => void
    addProductSlot?:       React.ReactNode
    canAuthorize?:   boolean
    onAuthorize?:    () => void
    onReject?:       () => void
    authLoading?:    boolean
    conditions?: any[]
    selectedCondition?: any | null
    onConditionChange?: (c: any) => void
    isConditionOpen?: boolean
    setIsConditionOpen?: (val: boolean) => void
    clientsFiltered?: any[]
    selectedClient?: any | null
    onClientSelect?: (c: any | null) => void
    openClientSearch?: boolean
    setOpenClientSearch?: (val: boolean) => void
    clientSearchQuery?: string
    setClientSearchQuery?: (val: string) => void
}

const IgvBadge = ({ tipo }: { tipo?: string }) => {
    if (!tipo || tipo === '10') return null
    if (tipo === '20') return (
        <IgvBadgeBase className="bg-yellow-50 text-yellow-700 border-yellow-300 text-[10px] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block mr-1" />
            EXO
        </IgvBadgeBase>
    )
    return (
        <IgvBadgeBase className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1" />
            INA
        </IgvBadgeBase>
    )
}

const sym = (moneda?: string) => moneda === 'PEN' ? 'S/' : '$'

interface Totales {
    baseGravada:    number
    baseExonerada:  number
    baseInafecta:   number
    igv:            number
    total:          number
}

function calcularTotales(items: PedidoDet[]): Totales {
    let baseGravada   = 0
    let baseExonerada = 0
    let baseInafecta  = 0

    for (const item of items) {
        const subtotalItem = Number(item.cantPedido) * Number(item.precioPedido)
        const tipo = item.tipo_afectacion_igv ?? '10'

        if (tipo === '20') {
            baseExonerada += subtotalItem
        } else if (tipo === '30') {
            baseInafecta  += subtotalItem
        } else {
            baseGravada   += subtotalItem / 1.18
        }
    }

    const igv   = baseGravada * 0.18
    const total = baseGravada + igv + baseExonerada + baseInafecta

    return { baseGravada, baseExonerada, baseInafecta, igv, total }
}

const ProductName = ({ item }: { item: PedidoDet }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
        {(item.is_editado === 'S' && Number(item.precioPedido) > 0) &&
          <Pen className="h-4 w-4 text-blue-600 shrink-0" />}
        {(item.is_editado === 'S' && Number(item.precioPedido) === 0) &&
          <Gift className="h-4 w-4 text-pink-600 shrink-0" />}
        {item.is_autorizado === 'S' &&
          <ArrowBigDownDash className="h-5 w-5 text-orange-600 shrink-0" />}
        <span>{item.productoNombre || 'Producto no especificado'}</span>
        <IgvBadge tipo={item.tipo_afectacion_igv} />
    </div>
)

const SubtotalCell = ({ item, moneda }: { item: PedidoDet; moneda?: string }) => {
    const val  = (Number(item.cantPedido) * Number(item.precioPedido)).toFixed(2)
    const tipo = item.tipo_afectacion_igv ?? '10'
    const label = tipo === '10' ? '+ IGV' : 'sin IGV'
    const labelColor = tipo === '10' ? 'text-green-600' : 'text-gray-400'

    return (
        <div className="flex flex-col items-end">
            <span className="font-medium">{sym(moneda)} {val}</span>
            <span className={`text-[10px] font-medium ${labelColor}`}>{label}</span>
        </div>
    )
}

const LoadingSkeleton = () => (
    <div className="grid gap-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map(i => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                    <CardContent className="space-y-4">
                        {[1,2,3,4].map(j => (
                            <div key={j} className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent>
                {[1,2,3].map(i => (
                    <div key={i} className="border rounded-md p-4 mb-3">
                        <Skeleton className="h-4 w-full mb-2" />
                        <div className="grid grid-cols-2 gap-2">
                            <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
)

export default function OrderDetailView({
                                            context, backHref,
                                            pedido, detalles, loading, error,
                                            canEdit, isEditing, tempDetalles, onEditToggle, onSaveChanges, onRemoveItem, onQuantityChange,
                                            canAddProduct, openAddModal, onOpenAddModal, addProductSlot,
                                            canAuthorize, onAuthorize, onReject, authLoading,
                                            clientsFiltered = [], selectedClient, onClientSelect, openClientSearch, setOpenClientSearch, clientSearchQuery, setClientSearchQuery,
                                            conditions = [], selectedCondition, onConditionChange, isConditionOpen, setIsConditionOpen,
                                        }: OrderDetailViewProps) {

    const activeDetalles = isEditing ? (tempDetalles ?? detalles) : detalles
    const totales = calcularTotales(activeDetalles)

    const getStateInfo = (stateId: number, porAutorizar?: string, isAutorizado?: string) => {
        if (porAutorizar === 'S' && isAutorizado === 'N')  return ORDER_STATES.find(e => e.id === -2)
        if (porAutorizar === 'S' && !isAutorizado)          return ORDER_STATES.find(e => e.id === -1)
        return ORDER_STATES.find(s => s.id === stateId)
    }

    if (loading) return <LoadingSkeleton />

    if (error || !pedido) return (
        <div className="grid gap-6">
            <div className="flex items-center gap-4">
                <Link href={backHref}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                    {error ? 'Error' : 'Pedido no encontrado'}
                </h1>
            </div>
            {error && (
                <Card className="text-center p-8">
                    <p className="text-red-500">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                        Reintentar
                    </Button>
                </Card>
            )}
        </div>
    )

    const stateInfo = getStateInfo(pedido.estadodePedido, pedido.por_autorizar, pedido.is_autorizado)
    const currency  = sym(pedido.monedaPedido)

    return (
        <div className="grid gap-6">

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Link href={backHref}>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                            Pedido #{pedido.nroPedido}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {canAuthorize && (
                            <>
                                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={onAuthorize} disabled={authLoading}>
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">AUTORIZAR</span>
                                </Button>
                                <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                                        onClick={onReject} disabled={authLoading}>
                                    <XCircle className="h-4 w-4" />
                                    <span className="hidden sm:inline">RECHAZAR</span>
                                </Button>
                            </>
                        )}

                        {canEdit && onEditToggle && (
                            <Button variant={isEditing ? 'outline' : 'default'}
                                    onClick={onEditToggle} className="gap-2">
                                {isEditing
                                    ? <><X className="h-4 w-4" /> Cancelar</>
                                    : <><Edit className="h-4 w-4" /> Editar</>
                                }
                            </Button>
                        )}

                        {context === 'comprobantes' && (
                            <>
                                <Button variant="outline" className="gap-2" disabled>
                                    <Printer className="h-4 w-4" />
                                    <span className="hidden sm:inline">Imprimir</span>
                                </Button>
                                <Button variant="outline" className="gap-2" disabled>
                                    <FileDown className="h-4 w-4" />
                                    <span className="hidden sm:inline">Descargar PDF</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <p className="text-gray-500">Información completa del pedido y sus productos.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md bg-white">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-xl font-semibold text-teal-700">Información del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Número de Pedido:</p>
                                <p className="font-medium">{pedido.nroPedido}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Fecha:</p>
                                <p>{new Date(pedido.fechaPedido).toLocaleDateString()}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-500 mb-1">Condición:</p>
                                {isEditing && onConditionChange ? (
                                    <Popover
                                        open={isConditionOpen}
                                        onOpenChange={setIsConditionOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between h-9 px-3">
                                                {selectedCondition
                                                    ? selectedCondition.Descripcion
                                                    : 'Seleccionar...'}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar condición..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                                    <CommandGroup>
                                                        {conditions.map((condition: any) => (
                                                            <CommandItem
                                                                key={condition.CodigoCondicion}
                                                                value={condition.Descripcion}
                                                                onSelect={() => {
                                                                    onConditionChange(condition);
                                                                    setIsConditionOpen?.(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedCondition?.CodigoCondicion === condition.CodigoCondicion ? 'opacity-100' : 'opacity-0'
                                                                    )}
                                                                />
                                                                {condition.Descripcion}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <p>{pedido.condicionPedido}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Moneda:</p>
                                <p>{pedido.monedaPedido === 'PEN' ? 'Soles (S/)' : 'Dólares ($)'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Vendedor:</p>
                                <p>{pedido.nombreVendedor || 'No especificado'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Estado:</p>
                                <Badge className={`${stateInfo?.color} flex items-center gap-1 text-xs`}>
                                    {stateInfo?.name || 'Desconocido'}
                                </Badge>
                            </div>
                            {pedido.notaPedido && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Notas:</p>
                                    <p>{pedido.notaPedido}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md bg-white">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-xl font-semibold text-teal-700">Información del Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Razón Social:</p>
                                    <p className="font-medium text-lg text-gray-900">
                                        {isEditing && selectedClient ? selectedClient.NombreComercial : (pedido.nombreComercial || 'No especificada')}
                                    </p>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Cliente:</p>
                                    <p className="font-medium text-lg text-gray-900">
                                        {isEditing && selectedClient ? selectedClient.Nombre : (pedido.nombreCliente || 'No especificada')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        RUC: {isEditing && selectedClient ? selectedClient.RUC : pedido.codigoCliente || 'No especificada'}
                                    </p>
                                </div>
                                {isEditing && setOpenClientSearch && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setOpenClientSearch(true)}
                                            className="shrink-0"
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            Cambiar Cliente
                                        </Button>

                                        <SearchPickerDialog<any>
                                            open={openClientSearch!}
                                            onOpenChange={setOpenClientSearch}
                                            title="Buscar cliente"
                                            placeholder="RUC, DNI o nombre..."
                                            searchValue={clientSearchQuery || ""}
                                            onSearchChange={(val) => setClientSearchQuery?.(val)}
                                            onClearSearch={() => setClientSearchQuery?.("")}
                                            items={clientsFiltered}
                                            emptyMessage="No se encontraron clientes"
                                            idleMessage="Escribe para buscar clientes"
                                            searchTransform={(value) => value.toUpperCase()}
                                            getKey={(c) => c.codigo || c.RUC}
                                            onSelect={(c) => onClientSelect?.(c)}
                                            renderItem={(c) => (
                                                <div className="flex items-start gap-3 px-4 py-3">
                                                    <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full shrink-0 mt-0.5">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>

                                                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1 leading-tight">
                      {c.Nombre}
                    </span>

                                                        {c.NombreComercial && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {c.NombreComercial}
                      </span>
                                                        )}

                                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                                            {c.RUC && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            RUC:
                          </span>{' '}
                                                                    {c.RUC}
                        </span>
                                                            )}

                                                            {c.Dirección && (
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                                                                    {c.Dirección}
                        </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    </>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Correo Electrónico:</p>
                                <p>{pedido.correo || 'No especificado'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Teléfono:</p>
                                <p>{pedido.telefonoPedido || 'No especificado'}</p>
                            </div>
                            {pedido.contactoPedido && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Contacto Adicional:</p>
                                    <p>{pedido.contactoPedido}</p>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-gray-500">Dirección de Entrega:</p>
                                <p>{pedido.direccionEntrega || 'No especificada'}</p>
                            </div>
                            {pedido.referenciaDireccion && (
                                <div className="md:col-span-2">
                                    <p className="text-sm font-medium text-gray-500">Referencia:</p>
                                    <p>{pedido.referenciaDireccion}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-md bg-white">
                <CardHeader className="border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold text-teal-700">Productos</CardTitle>

                        {isEditing && canAddProduct && onOpenAddModal && (
                            <Dialog open={openAddModal} onOpenChange={onOpenAddModal}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" /> Agregar Producto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[95vw] sm:max-w-2xl rounded-xl">
                                    <DialogHeader>
                                        <DialogTitle>Agregar Producto</DialogTitle>
                                        <DialogDescription>Selecciona un producto, ajusta su precio y cantidad.</DialogDescription>
                                    </DialogHeader>
                                    {addProductSlot}
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="rounded-md border m-4 hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Laboratorio</TableHead>
                                    <TableHead>Lote - Fec.Venc</TableHead>
                                    <TableHead className="text-right">Cant.</TableHead>
                                    <TableHead className="text-right">P. Unit.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                    {isEditing && <TableHead className="text-right">Acc.</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeDetalles.length > 0 ? activeDetalles.map((item, index) => (
                                    <TableRow key={item.idPedidodet || index} className="hover:bg-gray-50">
                                        <TableCell className="text-sm">{item.codigoitemPedido}</TableCell>
                                        <TableCell><ProductName item={item} /></TableCell>
                                        <TableCell className="text-sm">{item.laboratorio || 'N/A'}</TableCell>
                                        <TableCell className="text-sm">
                                            {item.cod_lote || '—'} · {item.fec_venc_lote || '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isEditing && onQuantityChange ? (
                                                <Input type="number" min="1" value={item.cantPedido}
                                                       onChange={e => onQuantityChange(index, Number(e.target.value))}
                                                       className="w-20 text-right ml-auto" />
                                            ) : Number(item.cantPedido)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {currency} {Number(item.precioPedido).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <SubtotalCell item={item} moneda={pedido.monedaPedido} />
                                        </TableCell>
                                        {isEditing && onRemoveItem && (
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => onRemoveItem(index)}
                                                        className="text-red-600 hover:text-red-800 h-8 w-8 p-0">
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                            No se encontraron productos en este pedido
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="md:hidden space-y-3 p-4">
                        {activeDetalles.length > 0 ? activeDetalles.map((item, index) => (
                            <Card key={item.idPedidodet || index} className="shadow-sm border">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-500">Código</p>
                                            <p className="font-semibold text-sm">{item.codigoitemPedido}</p>
                                        </div>
                                        {isEditing && onRemoveItem && (
                                            <Button variant="ghost" size="sm" onClick={() => onRemoveItem(index)}
                                                    className="text-red-600 hover:text-red-800 h-8 w-8 p-0">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Producto</p>
                                        <ProductName item={item} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Laboratorio</p>
                                        <p className="text-sm font-medium">{item.laboratorio || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Lote - Vencimiento</p>
                                        <p className="text-sm">{item.cod_lote || '—'} · {item.fec_venc_lote || '—'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Cantidad</p>
                                            {isEditing && onQuantityChange ? (
                                                <Input type="number" min="1" value={item.cantPedido}
                                                       onChange={e => onQuantityChange(index, Number(e.target.value))}
                                                       className="w-full mt-1" />
                                            ) : <p className="font-semibold text-sm">{Number(item.cantPedido)}</p>}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Precio Unit.</p>
                                            <p className="font-semibold text-sm">{currency} {Number(item.precioPedido).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between items-center">
                                        <p className="text-xs text-gray-500">Subtotal</p>
                                        <SubtotalCell item={item} moneda={pedido.monedaPedido} />
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <p className="text-center py-8 text-gray-500">No se encontraron productos</p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex justify-end items-end border-t bg-gray-50 p-4 flex-wrap gap-4">
                    <div className="w-full max-w-sm space-y-1.5">
                        {totales.baseGravada > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                    Subtotal:
                                </span>
                                <span>{currency} {totales.baseGravada.toFixed(2)}</span>
                            </div>
                        )}
                        {totales.igv > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 pl-3.5">IGV (18%):</span>
                                <span>{currency} {totales.igv.toFixed(2)}</span>
                            </div>
                        )}
                        {totales.baseExonerada > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                                    Subtotal:
                                </span>
                                <span>{currency} {totales.baseExonerada.toFixed(2)}</span>
                            </div>
                        )}
                        {totales.baseInafecta > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                    Subtotal:
                                </span>
                                <span>{currency} {totales.baseInafecta.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t pt-1.5 flex justify-between font-bold text-lg text-teal-900">
                            <span>Total:</span>
                            <span>{currency} {totales.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {isEditing && onSaveChanges && (
                        <Button onClick={onSaveChanges} className="gap-2">
                            <Save className="h-4 w-4" /> Guardar Cambios
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}