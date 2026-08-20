import { useCallback, useEffect, useState } from "react";
import { PriceService } from "@/app/services/price/PriceService";

export function useImagenesProducto(activo: boolean) {
    const [imagenes, setImagenes] = useState<Map<string, string>>(new Map());
    const [cargando, setCargando] = useState(false);

    const cargar = useCallback(async () => {
        if (!activo) return;

        setCargando(true);
        try {
            const res = await PriceService.getImagenesArticulo();
            const filas = res?.data?.data ?? [];

            const mapa = new Map<string, string>();
            for (const fila of filas) {
                if (fila?.codigo_articulo && fila?.ruta) {
                    mapa.set(String(fila.codigo_articulo), String(fila.ruta));
                }
            }
            setImagenes(mapa);
        } catch (error) {
            console.error("Error al cargar las imágenes de productos:", error);
        } finally {
            setCargando(false);
        }
    }, [activo]);

    useEffect(() => {
        if (!activo) {
            setImagenes(new Map());
            return;
        }
        cargar();
    }, [activo, cargar]);

    const actualizarImagen = useCallback((codigo: string, ruta: string | null) => {
        setImagenes(previo => {
            const copia = new Map(previo);
            if (ruta) copia.set(codigo, ruta);
            else copia.delete(codigo);
            return copia;
        });
    }, []);

    return { imagenes, cargandoImagenes: cargando, actualizarImagen, recargarImagenes: cargar };
}
