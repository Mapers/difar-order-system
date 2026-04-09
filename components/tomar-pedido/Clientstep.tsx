'use client'
import React, {useState} from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {Search, User, X, MapPin, CreditCard, Building, ArrowRight, Users, Save} from "lucide-react"
import ContactInfo from "@/components/cliente/contactInfo"
import FinancialZone from "@/components/cliente/financialZone"
import PaymentCondition from "@/components/cliente/paymentCondition"
import { IClient, ICondicion, IMoneda, ITerritorio } from "@/app/types/order/client-interface"
import { monedas } from "@/constants"
import {Seller} from "@/app/types/order/order-interface";
import OrderHistory from "@/components/tomar-pedido/order-history";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";

interface ClientStepProps {
    search: { client: string; product: string; condition: string }
    setSearch: React.Dispatch<React.SetStateAction<{ client: string; product: string; condition: string }>>
    loadingClients: boolean
    clientsFiltered: IClient[]
    selectedClient: IClient | null
    onClientSelect: (c: IClient | null) => void
    isAdmin: boolean
    seller: Seller | null
    sellersFiltered: Seller[]
    sellerSearch: string
    onSellerSearch: (val: string) => void
    onSellerSelect: (s: Seller | null) => void
    referenciaDireccion: string
    contactoPedido: string
    onChangeReferenciaDireccion: (e: React.ChangeEvent<HTMLInputElement>) => void
    onChangeContactoPedido: (e: React.ChangeEvent<HTMLInputElement>) => void
    onUpdateClient: (fields: { telefono?: string; Dirección?: string }) => void
    nameZone: string
    unidadTerritorio: ITerritorio
    conditions: ICondicion[]
    condition: ICondicion | null
    currency: IMoneda | null
    onConditionChange: (c: ICondicion) => void
    onCurrencyChange: (m: IMoneda) => void
    onNext: () => void
    isStepValid: boolean
    handleSaveDraft: () => void
}

export default function ClientStep({
                                       search, setSearch, loadingClients, clientsFiltered,
                                       selectedClient, onClientSelect, isAdmin, seller, sellersFiltered,
                                       onSellerSearch, onSellerSelect, referenciaDireccion, contactoPedido,
                                       onChangeReferenciaDireccion, onChangeContactoPedido, onUpdateClient,
                                       nameZone, unidadTerritorio, conditions, condition, currency,
                                       onConditionChange, onCurrencyChange, onNext, isStepValid, sellerSearch,
                                       handleSaveDraft
                                   }: ClientStepProps) {
    const [clientModalOpen, setClientModalOpen] = useState(false)
    const [sellerModalOpen, setSellerModalOpen] = useState(false)

    return (
        <Card className="shadow-md bg-white">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-md">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">Seleccionar Cliente</CardTitle>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 px-3 sm:px-6">
                {selectedClient && (
                    <div className="w-full min-w-0 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50">

                        <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate leading-tight">
                                    {selectedClient.Nombre}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                    {selectedClient.RUC ? `RUC: ${selectedClient.RUC}` : selectedClient.codigo}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end mt-2">
                            <Button
                                type="button" size="sm" variant="outline"
                                onClick={() => onClientSelect(null)}
                                className="h-7 px-3 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 bg-white dark:bg-transparent"
                            >
                                Cambiar cliente
                            </Button>
                        </div>
                    </div>
                )}

                {!selectedClient && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar cliente</Label>
                        <Button
                            type="button" variant="outline" onClick={() => setClientModalOpen(true)}
                            className="w-full justify-start h-11 px-3 text-left font-normal text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 dark:text-gray-100 overflow-hidden"
                        >
                            <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                            <span className="truncate text-gray-400 dark:text-gray-500 font-normal">Buscar por RUC, DNI o nombre...</span>
                        </Button>

                        <Dialog open={clientModalOpen} onOpenChange={(v) => {
                            setClientModalOpen(v)
                            if (!v) setSearch((prev) => ({ ...prev, client: '' }))
                        }}>
                            <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
                                fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full
                                sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[620px] sm:h-[75vh] sm:max-w-[95vw]">
                                <DialogTitle className="sr-only">Buscar cliente</DialogTitle>
                                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                                    <input
                                        type="text" autoFocus
                                        placeholder="RUC, DNI o nombre del cliente..."
                                        value={search.client}
                                        onChange={(e) => setSearch((prev) => ({ ...prev, client: e.target.value.toUpperCase() }))}
                                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                                    />
                                    {search.client && (
                                        <button type="button" onClick={() => setSearch((prev) => ({ ...prev, client: '' }))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button type="button"
                                            onClick={() => { setClientModalOpen(false); setSearch((prev) => ({ ...prev, client: '' })) }}
                                            className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0">
                                        Cancelar
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                                    {loadingClients ? (
                                        <div className="p-3 space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                                    <div className="flex-1 space-y-1.5">
                                                        <Skeleton className="h-4 w-3/5 rounded" />
                                                        <Skeleton className="h-3 w-2/5 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : clientsFiltered.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Users className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {search.client ? 'No se encontraron clientes' : 'Escribe para buscar clientes'}
                                            </p>
                                            {search.client && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Intente con otro RUC, DNI o nombre</p>}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {clientsFiltered.map((c) => (
                                                <button key={c.codigo} type="button"
                                                        onClick={() => { onClientSelect(c); setClientModalOpen(false) }}
                                                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 active:bg-blue-100 dark:active:bg-blue-950/40 transition-colors text-left">
                                                    <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full shrink-0 mt-0.5">
                                                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1 leading-tight">{c.Nombre}</span>
                                                        {c.NombreComercial && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{c.NombreComercial}</span>
                                                        )}
                                                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                                            {c.RUC && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    <span className="font-medium text-gray-600 dark:text-gray-300">RUC:</span> {c.RUC}
                                                                </span>
                                                            )}
                                                            {c.Dirección && (
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3 shrink-0" />{c.Dirección}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {(selectedClient && isAdmin) && (
                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Vendedor</Label>
                        {seller ? (
                            <div className="w-full min-w-0 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate leading-tight">
                                            {seller.nombres} {seller.apellidos}
                                        </p>
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate">
                                            {seller.codigo}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end mt-2">
                                    <Button
                                        type="button" size="sm" variant="outline"
                                        onClick={() => { onSellerSelect(null); onSellerSearch("") }}
                                        className="h-7 px-3 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 bg-white dark:bg-transparent"
                                    >
                                        Cambiar vendedor
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                type="button" variant="outline" onClick={() => setSellerModalOpen(true)}
                                className="w-full justify-start h-11 px-3 text-left font-normal text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 dark:text-gray-100"
                            >
                                <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                                <span className="truncate text-gray-400 dark:text-gray-500 font-normal">Buscar vendedor...</span>
                            </Button>
                        )}

                        <Dialog open={sellerModalOpen} onOpenChange={(v) => {
                            setSellerModalOpen(v)
                            if (!v) onSellerSearch("")
                        }}>
                            <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
                                fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full
                                sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[520px] sm:h-[65vh] sm:max-w-[95vw]">
                                <DialogTitle className="sr-only">Buscar vendedor</DialogTitle>
                                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900">
                                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                                    <input type="text" autoFocus
                                           placeholder="Nombre o código del vendedor..."
                                           value={sellerSearch}
                                           onChange={(e) => onSellerSearch(e.target.value.toUpperCase())}
                                           className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                                    />
                                    {sellerSearch && (
                                        <button type="button" onClick={() => onSellerSearch("")} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button type="button"
                                            onClick={() => { setSellerModalOpen(false); onSellerSearch("") }}
                                            className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0">
                                        Cancelar
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                                    {sellersFiltered.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Users className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {sellerSearch ? 'No se encontraron vendedores' : 'Escribe para buscar vendedores'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {sellersFiltered.map((s) => (
                                                <button key={s.codigo} type="button"
                                                        onClick={() => { onSellerSelect(s); setSellerModalOpen(false); onSellerSearch("") }}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 active:bg-indigo-100 transition-colors text-left">
                                                    <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-full shrink-0">
                                                        <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{s.nombres} {s.apellidos}</p>
                                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{s.codigo}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}

                {selectedClient && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                        <div className="space-y-4">
                            <ContactInfo
                                client={selectedClient}
                                referenciaDireccion={referenciaDireccion}
                                contactoPedido={contactoPedido}
                                onChangeReferenciaDireccion={onChangeReferenciaDireccion}
                                onChangeContactoPedido={onChangeContactoPedido}
                                onUpdateClient={onUpdateClient}
                            />
                        </div>
                        <div className="space-y-4">
                            <FinancialZone client={selectedClient} nameZone={nameZone} unidadTerritorio={unidadTerritorio}/>
                            <PaymentCondition
                                conditions={conditions} monedas={monedas}
                                onConditionChange={onConditionChange} onCurrencyChange={onCurrencyChange}
                                selectedCondition={condition} selectedCurrency={currency}
                            />
                            <OrderHistory client={selectedClient} />
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between border-t bg-gray-50 py-4 gap-2 px-3 sm:px-6">
                <Button
                    type="button" onClick={handleSaveDraft} disabled={!selectedClient}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
                >
                    <Save className="h-4 w-4 lg:mr-2"/>
                    <span className="hidden lg:inline">Guardar Borrador</span>
                </Button>
                <Button type="button" onClick={onNext} disabled={!isStepValid} className="bg-blue-600 hover:bg-blue-700">
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}