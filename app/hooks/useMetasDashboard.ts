'use client'

import { useState, useEffect, useCallback, useMemo } from "react";
import { ICiclo, IDashboardData, IItemDashboard, ILabDashboard, IVendedorDashboard } from "@/app/types/metas-types";
import { MetasService } from "@/app/services/reports/metasService";
import { PriceService } from "@/app/services/price/PriceService";
import { fetchAvailableZones } from "@/app/api/reports";
import { useAuth } from "@/context/authContext";
import { User } from "@/app/services/auth/types";

/** Para representante: acota el dashboard a SUS laboratorios y SUS vendedores. */
async function filterDashboardForRepresentante(
    data: IDashboardData,
    user: User | null,
): Promise<IDashboardData> {
    const allowedVendCods = new Set((user?.vendedores || []).map(v => v.codigo));

    let allowedLabLineas = new Set<number>();
    try {
        const res = await PriceService.getLaboratoriesRepres(user?.codRepres || '');
        const labs: any[] = res?.data || [];
        allowedLabLineas = new Set(labs.map(l => Number(l.IdLineaGe)));
    } catch (e) {
        console.error("Error cargando laboratorios del representante:", e);
    }

    const laboratorios = (data.laboratorios || []).filter(l =>
        allowedLabLineas.size === 0 ? true : allowedLabLineas.has(Number(l.id_linea_ge)),
    );
    const keptLabMetaIds = new Set(laboratorios.map(l => l.id_meta_lab));

    const vendedores = (data.vendedores || []).filter(v =>
        allowedVendCods.has(v.cod_vendedor) && keptLabMetaIds.has(v.id_meta_lab),
    );
    const keptVendIds = new Set(vendedores.map(v => v.id_meta_lab_vend));

    const items = (data.items || []).filter(i => keptVendIds.has(i.id_meta_lab_vend));

    return { laboratorios, vendedores, items };
}

export function useMetasDashboard() {
    const { user, isVendedor, isRepresentante } = useAuth();

    const [ciclos, setCiclos] = useState<ICiclo[]>([]);
    const [selectedCiclo, setSelectedCiclo] = useState<ICiclo | null>(null);
    const [baseData, setBaseData] = useState<IDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    const [selectedLab, setSelectedLab] = useState<string>("");
    const [selectedVend, setSelectedVend] = useState<string>("");
    // Zona (filtra server-side las ventas/clientes del vendedor por zona del cliente)
    const [selectedZona, setSelectedZona] = useState<string>("");
    const [zonaOptions, setZonaOptions] = useState<{ value: string; label: string }[]>([]);

    const codVendedor: string | undefined = isVendedor() ? user?.codigo : undefined;

    useEffect(() => {
        fetchAvailableZones()
            .then(res => {
                const list: any[] = res?.data?.data || res?.data || [];
                setZonaOptions(list.map(z => ({ value: String(z.IdZona), label: z.NombreZona })));
            })
            .catch(console.error);
    }, []);

    // Resetea los filtros de cliente (lab/vend) al cambiar de ciclo
    useEffect(() => {
        setSelectedLab("");
        setSelectedVend("");
    }, [selectedCiclo]);

    useEffect(() => {
        const loadCiclos = async () => {
            try {
                const res = await MetasService.listarCiclos();
                const data: ICiclo[] = res?.data?.data || [];
                setCiclos(data);
                const abierto = data.find((c) => c.estado === 'ABIERTO');
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

    const loadDashboard = useCallback(async () => {
        if (!selectedCiclo) return;
        setLoadingDashboard(true);
        try {
            const res = await MetasService.getDashboard(selectedCiclo.id_ciclo, codVendedor, selectedZona);
            let data: IDashboardData | null = res?.data || null;
            if (data && isRepresentante()) {
                data = await filterDashboardForRepresentante(data, user);
            }
            setBaseData(data);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        } finally {
            setLoadingDashboard(false);
        }
    }, [selectedCiclo, codVendedor, selectedZona]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const labOptions = useMemo(() => {
        const map = new Map<string, string>();
        (baseData?.laboratorios || []).forEach(l => {
            map.set(String(l.id_linea_ge), l.nombre_lab || `Lab ${l.id_linea_ge}`);
        });
        return Array.from(map, ([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [baseData]);

    const vendOptions = useMemo(() => {
        const map = new Map<string, string>();
        (baseData?.vendedores || []).forEach(v => {
            map.set(v.cod_vendedor, v.nombre_vendedor || v.cod_vendedor);
        });
        return Array.from(map, ([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [baseData]);

    const dashboardData = useMemo<IDashboardData | null>(() => {
        if (!baseData) return null;
        let labs = baseData.laboratorios || [];
        let vends = baseData.vendedores || [];
        let items = baseData.items || [];

        if (selectedLab) {
            labs = labs.filter(l => String(l.id_linea_ge) === selectedLab);
            const labMetaIds = new Set(labs.map(l => l.id_meta_lab));
            vends = vends.filter(v => labMetaIds.has(v.id_meta_lab));
            items = items.filter(i => labMetaIds.has(i.id_meta_lab));
        }
        if (selectedVend) {
            vends = vends.filter(v => v.cod_vendedor === selectedVend);
            const vendLabIds = new Set(vends.map(v => v.id_meta_lab));
            labs = labs.filter(l => vendLabIds.has(l.id_meta_lab));
            const vendIds = new Set(vends.map(v => v.id_meta_lab_vend));
            items = items.filter(i => vendIds.has(i.id_meta_lab_vend));
        }
        return { laboratorios: labs, vendedores: vends, items };
    }, [baseData, selectedLab, selectedVend]);

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
        isVendedorView: !!codVendedor,
        showRepresFilters: isRepresentante() && !codVendedor,
        labOptions,
        vendOptions,
        selectedLab,
        setSelectedLab,
        selectedVend,
        setSelectedVend,
        zonaOptions,
        selectedZona,
        setSelectedZona,
    };
}

function computeKPIs(data: IDashboardData) {
    const labs  = data.laboratorios || [];
    const vends = data.vendedores   || [];
    const items = data.items        || [];

    const totalVendido  = labs.reduce((s, l) => s + Number(l.venta_real || 0), 0);
    const totalCuota    = labs.reduce((s, l) => s + Number(l.meta_monto || 0), 0);
    const avanceGlobal  = totalCuota > 0 ? Math.round((totalVendido / totalCuota) * 100) : 0;

    const totalClientes    = labs.reduce((s, l) => s + Number(l.meta_clientes || 0), 0);
    const clientesAtendidos = labs.reduce((s, l) => s + Number(l.clientes_atendidos || 0), 0);
    const pctCobertura     = totalClientes > 0 ? Math.round((clientesAtendidos / totalClientes) * 100) : 0;

    const totalMetaCantidad = items.reduce((s, i) => s + Number(i.meta_cantidad || 0), 0);
    const totalUndVendidas  = items.reduce((s, i) => s + Number(i.u_vendidas || 0), 0);
    const pctUnidades       = totalMetaCantidad > 0 ? Math.round((totalUndVendidas / totalMetaCantidad) * 100) : 0;

    const labsEnMeta  = labs.filter(l => Number(l.pct_avance_monto || 0) >= 80).length;
    const labsRiesgo  = labs.filter(l => { const p = Number(l.pct_avance_monto || 0); return p >= 50 && p < 80; }).length;
    const labsBajo    = labs.filter(l => Number(l.pct_avance_monto || 0) < 50).length;
    const vendEnMeta  = vends.filter(v => Number(v.pct_avance_monto || 0) >= 80).length;

    return {
        totalVendido, totalCuota, avanceGlobal,
        totalClientes, clientesAtendidos, pctCobertura,
        totalMetaCantidad, totalUndVendidas, pctUnidades,
        labsEnMeta, labsRiesgo, labsBajo,
        totalLabs: labs.length,
        vendEnMeta,
        totalVendedores: vends.length,
    };
}