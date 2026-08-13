import { useState, useEffect, useMemo } from "react";
import { PriceService } from "@/app/services/price/PriceService";
import { VentasTresMeses } from "../types";

/** Etiqueta corta del periodo 'YYYY-MM' → 'Jun'. */
const MESES_CORTO = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                     'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

export function etiquetaPeriodo(periodo: string): string {
    const [anio, mes] = String(periodo || '').split('-');
    const n = Number(mes);
    if (!n || n < 1 || n > 12) return periodo || '';
    // El año solo se muestra si el periodo no es del año en curso, para no
    // repetirlo tres veces en un tooltip que casi siempre cae en el mismo año.
    return Number(anio) === new Date().getFullYear()
        ? MESES_CORTO[n]
        : `${MESES_CORTO[n]} ${String(anio).slice(2)}`;
}

/**
 * Trae las ventas de los últimos 3 meses de TODOS los artículos en una sola
 * llamada y las deja en un Map por código.
 *
 * Se carga una vez y en paralelo al listado de precios: son datos que no
 * dependen de los filtros, así que refiltrar en pantalla no vuelve a pedirlos.
 * Si la llamada falla, el Map queda vacío y la columna se pinta como
 * "Sin ventas" — la pantalla no se rompe por esto.
 */
export function useVentasTresMeses(isAuthenticated: boolean) {
    const [ventas, setVentas]     = useState<Map<string, VentasTresMeses>>(new Map());
    const [periodos, setPeriodos] = useState<string[]>([]);
    const [loading, setLoading]   = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelado = false;

        const cargar = async () => {
            setLoading(true);
            try {
                const res  = await PriceService.getVentasTresMeses();
                const body = res?.data ?? {};
                if (cancelado) return;

                const mapa = new Map<string, VentasTresMeses>();
                for (const fila of (body.data || [])) {
                    mapa.set(String(fila.cod_articulo), {
                        meses: Array.isArray(fila.meses) ? fila.meses.map(Number) : [0, 0, 0],
                        total_3m: Number(fila.total_3m || 0),
                    });
                }
                setVentas(mapa);
                setPeriodos(body.periodos || []);
            } catch (error) {
                console.error("Error al cargar las ventas de 3 meses:", error);
            } finally {
                if (!cancelado) setLoading(false);
            }
        };

        cargar();
        return () => { cancelado = true; };
    }, [isAuthenticated]);

    const etiquetas = useMemo(() => periodos.map(etiquetaPeriodo), [periodos]);

    return { ventas, periodos, etiquetas, loadingVentas: loading };
}
