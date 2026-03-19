import { useState, useEffect, useCallback } from "react";
import { ICiclo, IDashboardData, ILabDashboard, IVendedorDashboard, IItemDashboard } from "@/app/types/metas-types";
import {MetasService} from "@/app/services/reports/metasService";

export function useMetasDashboard() {
    const [ciclos, setCiclos] = useState<ICiclo[]>([]);
    const [selectedCiclo, setSelectedCiclo] = useState<ICiclo | null>(null);
    const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    // Cargar ciclos al inicio
    useEffect(() => {
        const loadCiclos = async () => {
            try {
                const res = await MetasService.listarCiclos();
                const data = res?.data?.data || [];
                setCiclos(data);

                const abierto = data.find((c: ICiclo) => c.estado === 'ABIERTO');
                if (abierto) setSelectedCiclo(abierto);
                else if (data.length > 0) setSelectedCiclo(data[0]);
            } catch (error) {
                console.error("Error cargando ciclos:", error);
            } finally {
                setLoading(false);
            }
        };
        loadCiclos();
    }, []);

    // Cargar dashboard cuando cambie el ciclo
    const loadDashboard = useCallback(async () => {
        if (!selectedCiclo) return;
        setLoadingDashboard(true);
        try {
            const res = await MetasService.getDashboard(selectedCiclo.id_ciclo);
            setDashboardData(res?.data || null);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        } finally {
            setLoadingDashboard(false);
        }
    }, [selectedCiclo]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // KPIs globales calculados
    const kpis = dashboardData ? computeKPIs(dashboardData) : null;

    return {
        ciclos,
        selectedCiclo,
        setSelectedCiclo,
        dashboardData,
        loading,
        loadingDashboard,
        refreshDashboard: loadDashboard,
        kpis,
    };
}

function computeKPIs(data: IDashboardData) {
    const labs = data.laboratorios || [];
    const vends = data.vendedores || [];
    const items = data.items || [];

    const totalVendido = labs.reduce((s, l) => s + Number(l.venta_real || 0), 0);
    const totalCuota = labs.reduce((s, l) => s + Number(l.meta_monto || 0), 0);
    const avanceGlobal = totalCuota > 0 ? Math.round((totalVendido / totalCuota) * 100) : 0;

    const totalClientes = labs.reduce((s, l) => s + Number(l.meta_clientes || 0), 0);
    const clientesAtendidos = labs.reduce((s, l) => s + Number(l.clientes_atendidos || 0), 0);
    const pctCobertura = totalClientes > 0 ? Math.round((clientesAtendidos / totalClientes) * 100) : 0;

    const totalMetaCantidad = items.reduce((s, i) => s + Number(i.meta_cantidad || 0), 0);
    const totalUndVendidas = items.reduce((s, i) => s + Number(i.u_vendidas || 0), 0);
    const pctUnidades = totalMetaCantidad > 0 ? Math.round((totalUndVendidas / totalMetaCantidad) * 100) : 0;

    const labsEnMeta = labs.filter(l => Number(l.pct_avance_monto || 0) >= 80).length;
    const labsRiesgo = labs.filter(l => { const p = Number(l.pct_avance_monto || 0); return p >= 50 && p < 80; }).length;
    const labsBajo = labs.filter(l => Number(l.pct_avance_monto || 0) < 50).length;

    const vendEnMeta = vends.filter(v => Number(v.pct_avance_monto || 0) >= 80).length;

    return {
        totalVendido,
        totalCuota,
        avanceGlobal,
        totalClientes,
        clientesAtendidos,
        pctCobertura,
        totalMetaCantidad,
        totalUndVendidas,
        pctUnidades,
        labsEnMeta,
        labsRiesgo,
        labsBajo,
        totalLabs: labs.length,
        vendEnMeta,
        totalVendedores: vends.length,
    };
}
