import { VentasTresMeses } from "@/app/dashboard/lista-precios-lote/types";

interface VentasSparklineProps {
    ventas?: VentasTresMeses;
    /** Etiquetas de los tres meses, del más antiguo al más reciente. Para el tooltip. */
    etiquetas: string[];
    /** En la tarjeta móvil el bloque va en línea, sin el ancho fijo de la columna. */
    compacto?: boolean;
}

const ALTURA_MAX = 26;
const ALTURA_MIN = 4;

/** La barra del mes más alto llega al tope; el resto se escala contra ese máximo. */
function alturaBarra(cantidad: number, max: number): number {
    if (cantidad <= 0) return 0;
    return Math.max(ALTURA_MIN, Math.round((cantidad / max) * ALTURA_MAX));
}

const fmt = (n: number) => n.toLocaleString('es-PE', { maximumFractionDigits: 2 });

export const VentasSparkline = ({ ventas, etiquetas, compacto = false }: VentasSparklineProps) => {
    const meses = ventas?.meses ?? [0, 0, 0];
    const total = Number(ventas?.total_3m ?? 0);

    // Sin ventas: barras fantasma para que la columna no se desalinee, y el
    // texto en gris. No se dibuja nada azul.
    if (total === 0) {
        return (
            <div className="flex items-end gap-2">
                <div className="flex h-[26px] items-end gap-[3px]" aria-hidden="true">
                    {[0, 1, 2].map(i => (
                        <span key={i} className="w-2 rounded-sm bg-muted-foreground/30" style={{ height: 8 }} />
                    ))}
                </div>
                <span className="self-center text-xs text-muted-foreground">Sin ventas</span>
            </div>
        );
    }

    const max = Math.max(1, ...meses);
    const tooltip = meses
        .map((cantidad, i) => `${etiquetas[i] ?? `Mes ${i + 1}`}: ${fmt(cantidad)}`)
        .join('  ·  ');

    // Tendencia: último mes contra el promedio de los dos anteriores. Sin flecha
    // cuando son iguales o cuando no hay con qué comparar.
    const previos = meses.slice(0, 2).filter(v => v > 0);
    const promedioPrevio = previos.length > 0 ? previos.reduce((a, b) => a + b, 0) / previos.length : null;
    const ultimo = meses[2] ?? 0;
    const tendencia = promedioPrevio === null || ultimo === promedioPrevio
        ? null
        : ultimo > promedioPrevio ? 'sube' : 'baja';

    return (
        <div className={`flex items-end gap-2 ${compacto ? '' : 'min-w-[110px]'}`}>
            <div className="flex h-[26px] items-end gap-[3px]" title={tooltip}>
                {meses.map((cantidad, i) => (
                    <span
                        key={i}
                        className="w-2 rounded-sm bg-blue-600 dark:bg-blue-500"
                        style={{ height: alturaBarra(cantidad, max) }}
                        title={`${etiquetas[i] ?? `Mes ${i + 1}`}: ${fmt(cantidad)}`}
                    />
                ))}
            </div>
            <div className="leading-none">
                <span className="text-[15px] font-medium text-foreground">{fmt(total)}</span>
                {tendencia && (
                    <span className={`ml-1 text-xs font-bold ${
                        tendencia === 'sube'
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-red-600 dark:text-red-500'
                    }`}>
                        {tendencia === 'sube' ? '↑' : '↓'}
                    </span>
                )}
                <span className="mt-0.5 block text-[11px] text-muted-foreground">und</span>
            </div>
        </div>
    );
};
