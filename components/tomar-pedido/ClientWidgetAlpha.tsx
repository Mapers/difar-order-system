'use client'

import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { User, MapPin } from 'lucide-react'

import ContactInfoAlpha from '@/components/cliente/ContactInfoAlpha'
import FinancialZoneAlpha from '@/components/cliente/financialZoneAlpha'
import PaymentConditionAlpha from '@/components/cliente/paymentConditionAlpha'
import CreditLineChip from '@/components/cliente/CreditLineChip'
import InlineAutocomplete from '@/components/tomar-pedido/InlineAutocomplete'
import CollapsibleWidget from '@/components/tomar-pedido/CollapsibleWidget'

import { IClient, ICondicion, IMoneda, ITerritorio } from '@/app/types/order/client-interface'
import { Seller } from '@/app/types/order/order-interface'
import { monedas } from '@/constants'

// Widget "Seleccionar Cliente" de la sección única de Tomar Pedido Alpha.
// Reemplaza el modal de búsqueda por un autocompletado inline: se escribe
// directo en el input y las coincidencias aparecen debajo, sin abrir nada.
interface ClientWidgetAlphaProps {
    search: { client: string; product: string; condition: string }
    setSearch: React.Dispatch<
        React.SetStateAction<{ client: string; product: string; condition: string }>
    >
    loadingClients: boolean
    loadingSellers?: boolean
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
    /** Modo controlado (acordeón con Producto: solo uno abierto a la vez).
     * El cambio de qué widget está abierto solo pasa por click manual del
     * usuario en el header — nada se cierra ni se abre automáticamente. */
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const DEFAULT_CONDITION_HINT = '30'

export default function ClientWidgetAlpha({
    search, setSearch, loadingClients, loadingSellers = false, clientsFiltered,
    selectedClient, onClientSelect, isAdmin, seller, sellersFiltered, sellerSearch,
    onSellerSearch, onSellerSelect, referenciaDireccion, contactoPedido,
    onChangeReferenciaDireccion, onChangeContactoPedido, onUpdateClient,
    nameZone, unidadTerritorio, conditions, condition, currency,
    onConditionChange, onCurrencyChange, open, onOpenChange,
}: ClientWidgetAlphaProps) {
    // Si el cliente no trae condición propia asignada, se preselecciona
    // "30 días" (la más usada) para no obligar a elegirla a mano siempre.
    useEffect(() => {
        if (!selectedClient || condition || conditions.length === 0) return
        const treintaDias = conditions.find((c) => c.Descripcion?.includes(DEFAULT_CONDITION_HINT))
        if (treintaDias) onConditionChange(treintaDias)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClient, condition, conditions])

    return (
        <CollapsibleWidget icon={User} title="Seleccionar Cliente" open={open} onOpenChange={onOpenChange}>
                {selectedClient ? (
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
                        <div className="flex items-center justify-between gap-2 mt-2.5">
                            <CreditLineChip client={selectedClient} />
                            <Button
                                type="button" size="sm" variant="outline"
                                onClick={() => onClientSelect(null)}
                                className="h-7 px-3 text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 bg-background dark:bg-transparent shrink-0"
                            >
                                Cambiar cliente
                            </Button>
                        </div>
                    </div>
                ) : (
                    <InlineAutocomplete<IClient>
                        variant="tile"
                        tileIcon={User}
                        tileTitle="Seleccionar cliente"
                        tileDescription="Tocá para buscar por RUC, DNI o nombre"
                        placeholder="RUC, DNI o nombre del cliente..."
                        value={search.client}
                        onValueChange={(v) => setSearch((prev) => ({ ...prev, client: v.toUpperCase() }))}
                        loading={loadingClients}
                        items={clientsFiltered}
                        pageSize={30}
                        getKey={(c) => c.codigo}
                        getItemLabel={(c) => c.Nombre}
                        onSelect={(c) => onClientSelect(c)}
                        isItemDisabled={(c) => !c.isMine && !c.mismaZona}
                        emptyMessage="No se encontraron clientes"
                        idleMessage="Escribe para buscar clientes"
                        renderItem={(c) => (
                            <div className="flex items-start gap-3 px-3 py-2.5">
                                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full shrink-0 mt-0.5">
                                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                    <span className="font-semibold text-sm text-foreground line-clamp-1 leading-tight">
                                        {c.Nombre}
                                    </span>
                                    {c.NombreComercial && (
                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                            {c.NombreComercial}
                                        </span>
                                    )}
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                                        {c.RUC && (
                                            <span className="text-xs text-muted-foreground">
                                                <span className="font-medium">RUC:</span> {c.RUC}
                                            </span>
                                        )}
                                        {c.Dirección && (
                                            <span className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                {c.Dirección}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                )}

                {selectedClient && isAdmin && (
                    <div className="space-y-1.5">
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
                                        onClick={() => { onSellerSelect(null); onSellerSearch('') }}
                                        className="h-7 px-3 text-xs text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 bg-background dark:bg-transparent"
                                    >
                                        Cambiar vendedor
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <InlineAutocomplete<Seller>
                                variant="tile"
                                tileIcon={User}
                                tileTitle="Seleccionar vendedor"
                                tileDescription="Tocá para buscar por nombre o código"
                                placeholder="Nombre o código del vendedor..."
                                value={sellerSearch}
                                onValueChange={onSellerSearch}
                                loading={loadingSellers}
                                items={sellersFiltered}
                                pageSize={30}
                                getKey={(s) => s.codigo}
                                getItemLabel={(s) => `${s.nombres} ${s.apellidos}`}
                                onSelect={(s) => onSellerSelect(s)}
                                emptyMessage="No se encontraron vendedores"
                                idleMessage="Escribe para buscar vendedores"
                                renderItem={(s) => (
                                    <div className="flex items-center gap-3 px-3 py-2.5">
                                        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-full shrink-0">
                                            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground truncate">
                                                {s.nombres} {s.apellidos}
                                            </p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                                                {s.codigo}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            />
                        )}
                    </div>
                )}

                {selectedClient && (
                    <div className="space-y-4">
                        <ContactInfoAlpha
                            client={selectedClient}
                            referenciaDireccion={referenciaDireccion}
                            contactoPedido={contactoPedido}
                            onChangeReferenciaDireccion={onChangeReferenciaDireccion}
                            onChangeContactoPedido={onChangeContactoPedido}
                            onUpdateClient={onUpdateClient}
                        />

                        <FinancialZoneAlpha
                            nameZone={nameZone}
                            unidadTerritorio={unidadTerritorio}
                        />

                        <PaymentConditionAlpha
                            conditions={conditions}
                            monedas={monedas}
                            onConditionChange={onConditionChange}
                            onCurrencyChange={onCurrencyChange}
                            selectedCondition={condition}
                            selectedCurrency={currency}
                        />
                    </div>
                )}
        </CollapsibleWidget>
    )
}
