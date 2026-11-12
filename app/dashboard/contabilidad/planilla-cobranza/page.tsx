'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ClipboardCheck, ClipboardList, FilePlus2 } from 'lucide-react'
import { useAuth } from '@/context/authContext'
import { usePlanillaCobranza } from '@/app/hooks/usePlanillaCobranza'
import { fetchAvailableZones } from '@/app/api/reports'
import {AdminInfo, CatalogosBanco, TipoComprobante, VendedorInfo, ZonaOption} from "@/app/types/planilla-types";
import SeccionAdmin from "@/components/contabilidad/planilla-cobranza/SeccionAdmin";
import SeccionVendedor from "@/components/contabilidad/planilla-cobranza/SeccionVendedor";
import CrearPlanillaAdmin from "@/components/contabilidad/planilla-cobranza/CrearPlanillaAdmin";
import apiClient from "@/app/api/client";
import {EmpresaOption, TipoAmortizacion} from "@/app/types/amortizacion-types";

function buildVendedorInfo(user: any): VendedorInfo {
    return {
        id_vendedor:     user.idVendedor ?? user.codigo,
        codigo_vendedor: user.codigo,
        nombre_vendedor: user.nombreCompleto,
        ciudad:          user.Ciudad ?? 'LIMA',
    }
}

function buildAdminInfo(user: any): AdminInfo {
    return { id_admin: user.idUsuarioWeb ?? user.idVendedor ?? user.id }
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

/** Roles (id del rol del JWT) que pueden crear planillas a nombre de un vendedor. */
const ROLES_CREAR_PLANILLA = [2, 3, 5, 6]
/** Contabilidad Chimbote: solo crea planillas, no valida. */
const ROL_SOLO_CREAR = 6
const ROL_VENDEDOR = 1

export default function PlanillaCobranzaPage() {
    const { user, isVendedor, isAdmin } = useAuth()
    const hook = usePlanillaCobranza()

    const [loading, setLoading] = useState(true)
    const [zones,   setZones]   = useState<ZonaOption[]>([])
    const [tiposAmort,  setTiposAmort]  = useState<TipoAmortizacion[]>([])
    const [empresas,    setEmpresas]    = useState<EmpresaOption[]>([])

    const tiposComprobante = useMemo(() => normTipos(hook.tiposComprobante ?? []), [hook.tiposComprobante])
    const bancos           = useMemo(() => normBancos(hook.bancos           ?? []), [hook.bancos])

    const vendedorInfo = useMemo(() => user ? buildVendedorInfo(user) : null, [user])
    const adminInfo    = useMemo(() => user ? buildAdminInfo(user)    : null, [user])

    // Se decide por el id del rol (no por el nombre).
    const idRol       = Number(user?.idRol)
    const esVendedor  = idRol === ROL_VENDEDOR || (isVendedor() && !ROLES_CREAR_PLANILLA.includes(idRol))
    const puedeCrear  = !esVendedor && ROLES_CREAR_PLANILLA.includes(idRol)
    const puedeValidar = !esVendedor && isAdmin() && idRol !== ROL_SOLO_CREAR
    const [tabAdmin, setTabAdmin] = useState<'validar' | 'crear'>('validar')
    const tabActiva = puedeValidar ? (puedeCrear ? tabAdmin : 'validar') : 'crear'

    useEffect(() => {
        if (!user) return
        Promise.all([
            hook.fetchCatalogos(),
            fetchAvailableZones()
                .then(res => setZones(res.data?.data ?? []))
                .catch(() => { /* silencioso: input libre sigue disponible */ }),
            apiClient.get('/amortizacion/combos/tipo-amortizacion')
                .then(res => setTiposAmort(res.data?.data?.data ?? []))
                .catch(() => {}),
            apiClient.get('/laboratorios/combos/laboratorios/empresas')
                .then(res => setEmpresas(res.data?.data?.data ?? []))
                .catch(() => {}),
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
            <div className="grid grid-cols-1 gap-6 p-4 md:p-6">
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
        <div className="grid grid-cols-1 gap-6 p-4 md:p-6">

            <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/30">
                    <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Planilla de Cobranza
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {esVendedor
                            ? 'Crea y envía tus planillas de cobranza diarias.'
                            : puedeValidar
                                ? 'Gestiona y valida las planillas de cobranza de los vendedores.'
                                : 'Crea planillas de cobranza a nombre de los vendedores.'}
                    </p>
                </div>
            </div>

            {esVendedor && vendedorInfo && (
                <SeccionVendedor
                    tiposComprobante={tiposComprobante}
                    bancos={bancos}
                    zones={zones}
                    planillaActiva={hook.planillaActiva}
                    detalle={hook.detalle}
                    onGenerarCorrelativo={hook.generarCorrelativo}
                    onLimpiar={hook.limpiarPlanillaActiva}
                    onAgregarDetalle={hook.agregarDetalle}
                    onRecargarDetalle={hook.recargarDetalle}
                    onEliminarDetalle={hook.eliminarDetalle}
                    onEnviarPlanilla={hook.enviarPlanilla}
                    misPlanillas={hook.misPlanillas}
                    loadingMisPlanillas={hook.loadingMisPlanillas}
                    onFetchMisPlanillas={hook.fetchMisPlanillas}
                    onFetchDetalle={hook.consultarDetalle}
                    onReenviar={hook.reenviarPlanilla}
                    onCargarBorrador={hook.cargarBorrador}
                    onEliminarPlanilla={hook.eliminarPlanilla}
                    vendedorInfo={vendedorInfo}
                />
            )}

            {puedeValidar && puedeCrear && (
                <div className="flex bg-background border border-border rounded-lg overflow-hidden shadow-sm">
                    {([
                        { id: 'validar', label: 'Validar planillas', icono: ClipboardCheck },
                        { id: 'crear',   label: 'Crear planilla',    icono: FilePlus2 },
                    ] as const).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTabAdmin(t.id)}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold
                                whitespace-nowrap transition-all border-b-2
                                ${tabActiva === t.id
                                ? 'text-violet-700 border-violet-600 bg-violet-50/50 dark:text-violet-300 dark:bg-violet-950/30'
                                : 'text-muted-foreground border-transparent hover:text-violet-600'}`}
                        >
                            <t.icono className="h-3.5 w-3.5" /> {t.label}
                        </button>
                    ))}
                </div>
            )}

            {puedeCrear && (
                <div className={tabActiva === 'crear' ? '' : 'hidden'}>
                    <CrearPlanillaAdmin
                        tiposComprobante={tiposComprobante}
                        bancos={bancos}
                        zones={zones}
                        nombreUsuario={user?.nombreCompleto ?? ''}
                    />
                </div>
            )}

            {puedeValidar && adminInfo && (
                <div className={tabActiva === 'validar' ? '' : 'hidden'}>
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
                    onEliminar={(p) => hook.eliminarPlanillaAdmin(p, adminInfo)}
                    tiposAmort={tiposAmort}
                    empresas={empresas}
                />
                </div>
            )}

            {!esVendedor && !puedeValidar && !puedeCrear && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No tienes permisos para acceder a este módulo.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}