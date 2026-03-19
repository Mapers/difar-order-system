import {getStatusColor} from "@/app/utils/metas-helpers";

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
    const safePct = Math.min(pct, 100);
    const dashArray = `${(safePct / 100) * circumference} ${circumference - (safePct / 100) * circumference}`;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
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
                    <span className="font-bold" style={{ color: c1, fontSize: size * 0.22 }}>
                        {label || `${pct}%`}
                    </span>
                </div>
            )}
        </div>
    );
}
