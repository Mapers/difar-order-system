'use client'

import { useState, useEffect, useCallback } from "react";
import { ICiclo, IVendedorResumenDashboard } from "@/app/types/metas-types";
import { MetasService } from "@/app/services/reports/metasService";

export function useMetasDashboard() {
    const [ciclos, setCiclos] = useState<ICiclo[]>([]);
    const [selectedCiclo, setSelectedCiclo] = useState<ICiclo | null>(null);
    const [vendedores, setVendedores] = useState<IVendedorResumenDashboard[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

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

    const loadVendedores = useCallback(async () => {
        if (!selectedCiclo) return;
        setLoadingDashboard(true);
        try {
            const res = await MetasService.getResumenVendedorLabs(selectedCiclo.id_ciclo);
            const data: IVendedorResumenDashboard[] = res?.data?.data?.[0] ?? res?.data?.data ?? [];
            setVendedores(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando resumen vendedores:", error);
        } finally {
            setLoadingDashboard(false);
        }
    }, [selectedCiclo]);

    useEffect(() => {
        loadVendedores();
    }, [loadVendedores]);

    return {
        ciclos,
        selectedCiclo,
        setSelectedCiclo,
        vendedores,
        loading,
        loadingDashboard,
        refreshDashboard: loadVendedores,
    };
}
