export const fmtMoney = (n: number) => "S/" + n.toLocaleString("es-PE", { minimumFractionDigits: 0 });

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
