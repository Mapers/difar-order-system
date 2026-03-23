'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { usePlanillaCobranza } from '@/app/hooks/usePlanillaCobranza'
import { fetchAvailableZones } from '@/app/api/reports'
import {AdminInfo, CatalogosBanco, TipoComprobante, VendedorInfo, ZonaOption} from "@/app/types/planilla-types";
import SeccionAdmin from "@/components/contabilidad/planilla-cobranza/SeccionAdmin";
import SeccionVendedor from "@/components/contabilidad/planilla-cobranza/SeccionVendedor";

function buildVendedorInfo(user: any): VendedorInfo {
    return {
        id_vendedor:     user.idVendedor ?? user.codigo,
        codigo_vendedor: user.codigo,
        nombre_vendedor: user.nombreCompleto,
        ciudad:          user.Ciudad ?? 'LIMA',
    }
}

function buildAdminInfo(user: any): AdminInfo {
    return { id_admin: user.idVendedor ?? user.id ?? user.codigo }
}

function normTipos(raw: any[]): TipoComprobante[] {
    return raw.map(t => ({
        codigo:      t.codigo      ?? t.Cod_Tipo  ?? t.cod_comprobante ?? '',
        descripcion: t.descripcion ?? t.Descripcion ?? t.descripcion   ?? '',
    }))
}

function normBancos(raw: any[]): CatalogosBanco[] {
    return raw;
}

export default function PlanillaCobranzaPage() {
    const { user, isVendedor, isAdmin } = useAuth()
    const hook = usePlanillaCobranza()

    const [loading, setLoading] = useState(true)
    const [zones,   setZones]   = useState<ZonaOption[]>([])

    const tiposComprobante = useMemo(() => normTipos(hook.tiposComprobante ?? []), [hook.tiposComprobante])
    const bancos           = useMemo(() => normBancos(hook.bancos           ?? []), [hook.bancos])

    const vendedorInfo = useMemo(() => user ? buildVendedorInfo(user) : null, [user])
    const adminInfo    = useMemo(() => user ? buildAdminInfo(user)    : null, [user])

    useEffect(() => {
        if (!user) return
        Promise.all([
            hook.fetchCatalogos(),
            fetchAvailableZones()
                .then(res => setZones(res.data?.data ?? []))
                .catch(() => { /* silencioso: input libre sigue disponible */ }),
        ]).finally(() => setLoading(false))
    }, [user])

    const handleValidar = async (
        id: number,
        admin: AdminInfo,
        accion: 'validado' | 'rechazado',
        obs?: string
    ) => hook.validarPlanilla(id, admin, accion, obs)

    if (loading) {
        return (
            <div className="grid gap-6 p-4 md:p-6">
                <Skeleton className="h-10 w-72" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-40 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="grid gap-6 p-4 md:p-6">

            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                    Planilla de Cobranza
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {isVendedor()
                        ? 'Crea y envía tus planillas de cobranza diarias.'
                        : 'Gestiona y valida las planillas de cobranza de los vendedores.'}
                </p>
            </div>

            {isVendedor() && vendedorInfo && (
                <SeccionVendedor
                    tiposComprobante={tiposComprobante}
                    bancos={bancos}
                    zones={zones}
                    planillaActiva={hook.planillaActiva}
                    detalle={hook.detalle}
                    onGenerarCorrelativo={hook.generarCorrelativo}
                    onLimpiar={hook.limpiarPlanillaActiva}
                    onAgregarDetalle={hook.agregarDetalle}
                    onEliminarDetalle={hook.eliminarDetalle}
                    onEnviarPlanilla={hook.enviarPlanilla}
                    misPlanillas={hook.misPlanillas}
                    loadingMisPlanillas={hook.loadingMisPlanillas}
                    onFetchMisPlanillas={hook.fetchMisPlanillas}
                    onFetchDetalle={hook.fetchDetalle}
                    onReenviar={hook.reenviarPlanilla}
                    onCargarBorrador={hook.cargarBorrador}
                    vendedorInfo={vendedorInfo}
                />
            )}

            {isAdmin() && adminInfo && (
                <SeccionAdmin
                    tiposComprobante={tiposComprobante}
                    bancos={bancos}
                    planillasAdmin={hook.planillasAdmin}
                    resumenDia={hook.resumenDia}
                    loadingAdmin={hook.loadingAdmin}
                    adminInfo={adminInfo}
                    onFetchAdmin={hook.fetchPlanillasAdmin}
                    onFetchResumen={hook.fetchResumenDia}
                    onFetchDetalle={hook.fetchDetalle}
                    onValidar={handleValidar}
                />
            )}

            {!isVendedor() && !isAdmin() && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No tienes permisos para acceder a este módulo.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}