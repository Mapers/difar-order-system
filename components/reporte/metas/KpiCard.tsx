import {getStatusColor} from "@/app/utils/metas-helpers";


interface KpiCardProps {
    label: string;
    value: string | number;
    subtitle: string;
    delta?: string;
    deltaType?: 'success' | 'warning' | 'danger';
    accentColor?: string;
    useSemaphore?: boolean;
    pct?: number;
}

export default function KpiCard({ label, value, subtitle, delta, deltaType = 'success', accentColor, useSemaphore, pct }: KpiCardProps) {
    const color = useSemaphore && pct !== undefined ? getStatusColor(pct)[0] : (accentColor || '#0284c7');

    const deltaClasses = {
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        danger: 'bg-red-100 text-red-800'
    };

    return (
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            {/*<div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />*/}
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
            {delta && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${deltaClasses[deltaType]}`}>
                    {delta}
                </span>
            )}
        </div>
    );
}
