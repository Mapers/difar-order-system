'use client'

import { useState, useEffect, useCallback } from "react";
import { ICiclo, IDashboardData } from "@/app/types/metas-types";
import { MetasService } from "@/app/services/reports/metasService";
import { useAuth } from "@/context/authContext";

function unwrap(arr: any): any[] {
    if (!arr) return [];
    return Array.isArray(arr[0]) ? arr[0] : Array.isArray(arr) ? arr : [];
}

function computeKpis(data: IDashboardData) {
    const labs  = data.laboratorios || [];
    const vends = data.vendedores   || [];
    const items = data.items        || [];

    const totalVendido = vends.reduce((s, v) => s + Number(v.venta_real), 0);
    const totalCuota   = vends.reduce((s, v) => s + Number(v.meta_monto), 0);
    const avanceGlobal = totalCuota > 0 ? Math.round(totalVendido / totalCuota * 100) : 0;

    const totalUndVendidas  = items.reduce((s, i) => s + Number(i.u_vendidas), 0);
    const totalMetaCantidad = items.reduce((s, i) => s + Number(i.meta_cantidad), 0);
    const pctUnidades = totalMetaCantidad > 0 ? Math.round(totalUndVendidas / totalMetaCantidad * 100) : 0;

    const clientesAtendidos = labs.reduce((s, l) => s + Number(l.clientes_atendidos || 0), 0);
    const totalClientes     = labs.reduce((s, l) => s + Number(l.meta_clientes || 0), 0);
    const pctCobertura = totalClientes > 0 ? Math.round(clientesAtendidos / totalClientes * 100) : 0;

    const labsEnMeta  = labs.filter(l => Number(l.pct_avance_monto) >= 80).length;
    const labsBajo    = labs.filter(l => Number(l.pct_avance_monto) < 50).length;
    const labsRiesgo  = labs.filter(l => Number(l.pct_avance_monto) >= 50 && Number(l.pct_avance_monto) < 80).length;
    const totalLabs   = labs.length;

    const uniqueVends     = [...new Set(vends.map(v => v.cod_vendedor))];
    const vendEnMeta      = uniqueVends.filter(cod => {
        const rows  = vends.filter(v => v.cod_vendedor === cod);
        const venta = rows.reduce((s, v) => s + Number(v.venta_real), 0);
        const meta  = rows.reduce((s, v) => s + Number(v.meta_monto), 0);
        return meta > 0 && venta / meta >= 0.8;
    }).length;
    const totalVendedores = uniqueVends.length;

    return {
        avanceGlobal, totalVendido, totalCuota,
        pctCobertura, clientesAtendidos, totalClientes,
        pctUnidades, totalUndVendidas, totalMetaCantidad,
        labsEnMeta, totalLabs, labsBajo, labsRiesgo,
        vendEnMeta, totalVendedores,
    };
}

export function useMetasDashboard() {
    const { user, isVendedor } = useAuth();
    const [ciclos, setCiclos]               = useState<ICiclo[]>([]);
    const [selectedCiclo, setSelectedCiclo] = useState<ICiclo | null>(null);
    const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
    const [loading, setLoading]             = useState(true);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    const isVendedorView = isVendedor();
    const codVend = isVendedorView ? (user?.codigo || undefined) : undefined;

    useEffect(() => {
        const loadCiclos = async () => {
            try {
                const res = await MetasService.listarCiclos();
                const data: ICiclo[] = res?.data?.data || [];
                setCiclos(data);
                const abierto = data.find(c => c.estado === 'ABIERTO');
                if (abierto) setSelectedCiclo(abierto);
                else if (data.length > 0) setSelectedCiclo(data[0]);
            } catch { /* ignore */ } finally {
                setLoading(false);
            }
        };
        loadCiclos();
    }, []);

    const loadDashboard = useCallback(async () => {
        if (!selectedCiclo) return;
        setLoadingDashboard(true);
        try {
            const res = await MetasService.getDashboard(selectedCiclo.id_ciclo, codVend, undefined);
            const raw = res?.data ?? {};
            setDashboardData({
                laboratorios: unwrap(raw.laboratorios),
                vendedores:   unwrap(raw.vendedores),
                items:        unwrap(raw.items),
            });
        } catch { /* ignore */ } finally {
            setLoadingDashboard(false);
        }
    }, [selectedCiclo, codVend]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const kpis = dashboardData ? computeKpis(dashboardData) : null;

    return {
        ciclos,
        selectedCiclo,
        setSelectedCiclo,
        dashboardData,
        loading,
        loadingDashboard,
        refreshDashboard: loadDashboard,
        kpis,
        isVendedorView,
    };
}
