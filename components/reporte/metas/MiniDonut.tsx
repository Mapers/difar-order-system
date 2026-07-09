import {capPct, getStatusColor} from "@/app/utils/metas-helpers";

interface MiniDonutProps {
    pct: number;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
    label?: string;
}

export default function MiniDonut({ pct, size = 40, strokeWidth = 5, showLabel = true, label }: MiniDonutProps) {
    const [c1] = getStatusColor(pct);
    const center = size / 2;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const safePct = capPct(pct);
    const dashArray = `${(safePct / 100) * circumference} ${circumference - (safePct / 100) * circumference}`;
    // Tamaño de fuente derivado del espacio interior real (no de `size` a secas),
    // para que "100%" (el string más largo posible tras topar el porcentaje) siempre
    // entre en el círculo sin desbordarse, incluso en los tamaños más chicos (28-36px).
    const innerClearDiameter = Math.max(1, radius * 2 - strokeWidth);
    const labelFontSize = innerClearDiameter * 0.28;

    return (
        <div className="relative flex items-center justify-center overflow-hidden" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx={center} cy={center} r={radius}
                    fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth}
                />
                <circle
                    cx={center} cy={center} r={radius}
                    fill="none" stroke={c1} strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold whitespace-nowrap" style={{ color: c1, fontSize: labelFontSize }}>
                        {label || `${safePct}%`}
                    </span>
                </div>
            )}
        </div>
    );
}
