'use client'

import { useState, useEffect } from "react";
import { ICiclo, IVisitasSemana } from "@/app/types/metas-types";
import { MetasService } from "@/app/services/reports/metasService";

function getSemanaCiclo(ciclo: ICiclo): { inicio: string; fin: string; label: string } {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const lunesOffset = diaSemana === 0 ? -6 : 1 - diaSemana;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + lunesOffset);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    const cicloInicio = new Date(ciclo.fecha_inicio + 'T00:00:00');
    const cicloFin = new Date(ciclo.fecha_fin + 'T00:00:00');

    let inicio: Date;
    let fin: Date;

    if (ciclo.estado === 'CERRADO') {
        // Para ciclos cerrados: la semana que contiene la fecha_fin del ciclo
        const diaCierre = cicloFin.getDay();
        const lunesOffset2 = diaCierre === 0 ? -6 : 1 - diaCierre;
        const lunesCierre = new Date(cicloFin);
        lunesCierre.setDate(cicloFin.getDate() + lunesOffset2);
        const domingoCierre = new Date(lunesCierre);
        domingoCierre.setDate(lunesCierre.getDate() + 6);

        inicio = new Date(Math.max(lunesCierre.getTime(), cicloInicio.getTime()));
        fin = new Date(Math.min(domingoCierre.getTime(), cicloFin.getTime()));
    } else {
        inicio = new Date(Math.max(lunes.getTime(), cicloInicio.getTime()));
        fin = new Date(Math.min(domingo.getTime(), cicloFin.getTime(), hoy.getTime()));
    }

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const fmtLabel = (d: Date) =>
        d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });

    return {
        inicio: fmt(inicio),
        fin: fmt(fin),
        label: `${fmtLabel(inicio)} – ${fmtLabel(fin)}`,
    };
}

export function useVisitasSemana(codVendedor: string | null, ciclo: ICiclo | null) {
    const [data, setData] = useState<IVisitasSemana | null>(null);
    const [loading, setLoading] = useState(false);
    const [semana, setSemana] = useState<{ inicio: string; fin: string; label: string } | null>(null);

    useEffect(() => {
        if (!codVendedor || !ciclo) {
            setData(null);
            return;
        }

        const s = getSemanaCiclo(ciclo);
        setSemana(s);
        setLoading(true);

        MetasService.getVisitasSemana(codVendedor, s.inicio, s.fin)
            .then((res: any) => setData(res?.data ?? null))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [codVendedor, ciclo?.id_ciclo]);

    return { data, loading, semana };
}
