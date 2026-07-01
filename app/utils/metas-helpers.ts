import { IVendedorDashboard } from "@/app/types/metas-types";

export const fmtMoney = (n: number) => "S/" + n.toLocaleString("es-PE", { minimumFractionDigits: 0 });

/**
 * El backend devuelve `vendedores` como una fila por vendedor×laboratorio.
 * Aquí se agrupan por `cod_vendedor` para el dashboard admin:
 *  - meta_monto / venta_real / monto_pendiente  -> se SUMAN (son por laboratorio)
 *  - meta_clientes / clientes_atendidos / pct_cobertura_clientes -> son a nivel
 *    vendedor (vienen repetidos idénticos en cada fila), se toman una sola vez
 *  - pct_avance_monto -> se recalcula sobre los totales sumados
 * Cada resultado conserva sus filas originales en `labs` para poder desplegarlas.
 */
export function agruparVendedores(vends: IVendedorDashboard[]): IVendedorDashboard[] {
    const map = new Map<string, IVendedorDashboard>();

    for (const v of vends) {
        const key = v.cod_vendedor;
        let g = map.get(key);
        if (!g) {
            g = {
                id_linea_ge: 0,               // 0 = agregado (todos los labs)
                cod_vendedor: v.cod_vendedor,
                nombre_vendedor: v.nombre_vendedor,
                nombre_lab: "",
                meta_monto: 0,
                meta_clientes: Number(v.meta_clientes || 0),
                venta_real: 0,
                clientes_atendidos: Number(v.clientes_atendidos || 0),
                pct_avance_monto: 0,
                pct_cobertura_clientes: Number(v.pct_cobertura_clientes || 0),
                monto_pendiente: 0,
                esAgrupado: true,
                labs: [],
            };
            map.set(key, g);
        }
        g.meta_monto      = Number(g.meta_monto)      + Number(v.meta_monto || 0);
        g.venta_real      = Number(g.venta_real)      + Number(v.venta_real || 0);
        g.monto_pendiente = Number(g.monto_pendiente) + Number(v.monto_pendiente || 0);
        g.labs!.push(v);
    }

    const list = Array.from(map.values());
    for (const g of list) {
        const meta = Number(g.meta_monto);
        g.pct_avance_monto = meta > 0 ? Math.round(Number(g.venta_real) / meta * 100) : 0;
        g.total_labs = g.labs!.length;
        g.labs!.sort((a, b) => Number(b.meta_monto) - Number(a.meta_monto));
    }
    return list;
}

export const calcPct = (value: number, total: number) => total > 0 ? Math.min(Math.round((value / total) * 100), 999) : 0;

export const getStatusColor = (pct: number): [string, string] => {
    if (pct >= 80) return ["#059669", "#34d399"];
    if (pct >= 50) return ["#d97706", "#fbbf24"];
    return ["#dc2626", "#f87171"];
};

export const getStatusChip = (pct: number): { label: string; className: string } => {
    if (pct >= 80) return { label: "✓ Meta", className: "bg-emerald-100 text-emerald-800" };
    if (pct >= 50) return { label: "⚠ Riesgo", className: "bg-amber-100 text-amber-800" };
    return { label: "✗ Bajo", className: "bg-red-100 text-red-800" };
};

export const getStatusBg = (pct: number): string => {
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
};

export const LAB_COLORS: Record<string, string> = {
    default: "#0284c7",
};

export const getLabColor = (index: number): string => {
    const colors = ["#0284c7", "#7c3aed", "#d97706", "#059669", "#dc2626", "#0891b2", "#be185d", "#4f46e5"];
    return colors[index % colors.length];
};

export const getInitials = (name: string): string => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const MONTH_NAMES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
