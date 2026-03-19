import {getStatusColor} from "@/app/utils/metas-helpers";

interface MiniGaugeProps {
    pct: number;
    width?: number;
    height?: number;
}

export default function MiniGauge({ pct, width = 64, height = 38 }: MiniGaugeProps) {
    const [c1] = getStatusColor(pct);
    const safePct = Math.min(pct, 100);

    const cx = 30, cy = 30, r = 22;
    const semiCirc = Math.PI * r;

    const zoneRed = (49 / 100) * semiCirc;
    const zoneYellow = (30 / 100) * semiCirc;
    const zoneGreen = (21 / 100) * semiCirc;

    const angle = Math.PI - (safePct / 100) * Math.PI;
    const needleX = cx + r * Math.cos(angle);
    const needleY = cy - r * Math.sin(angle);

    return (
        <div className="flex flex-col items-center gap-0.5">
            <svg width={width} height={height} viewBox="-2 4 64 32" style={{ overflow: 'visible' }}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fee2e2" strokeWidth="7"
                        strokeDasharray={`${zoneRed.toFixed(2)} ${(semiCirc * 2 - zoneRed).toFixed(2)}`}
                        strokeDashoffset={(-semiCirc).toFixed(2)}
                        transform={`rotate(180 ${cx} ${cy})`} strokeLinecap="butt" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fef3c7" strokeWidth="7"
                        strokeDasharray={`${zoneYellow.toFixed(2)} ${(semiCirc * 2 - zoneYellow).toFixed(2)}`}
                        strokeDashoffset={(-semiCirc + zoneRed).toFixed(2)}
                        transform={`rotate(180 ${cx} ${cy})`} strokeLinecap="butt" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1fae5" strokeWidth="7"
                        strokeDasharray={`${zoneGreen.toFixed(2)} ${(semiCirc * 2 - zoneGreen).toFixed(2)}`}
                        strokeDashoffset={(-semiCirc + zoneRed + zoneYellow).toFixed(2)}
                        transform={`rotate(180 ${cx} ${cy})`} strokeLinecap="butt" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="8"
                        strokeDasharray={`0.8 ${(semiCirc * 2 - 0.8).toFixed(2)}`}
                        strokeDashoffset={(-semiCirc + zoneRed - 0.4).toFixed(2)}
                        transform={`rotate(180 ${cx} ${cy})`} />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="8"
                        strokeDasharray={`0.8 ${(semiCirc * 2 - 0.8).toFixed(2)}`}
                        strokeDashoffset={(-semiCirc + zoneRed + zoneYellow - 0.4).toFixed(2)}
                        transform={`rotate(180 ${cx} ${cy})`} />
                <line x1={cx} y1={cy} x2={needleX.toFixed(1)} y2={needleY.toFixed(1)}
                      stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx={cx} cy={cy} r="2.5" fill="#1e293b" />
            </svg>
            <span className="text-[11px] font-bold leading-none" style={{ color: c1 }}>{pct}%</span>
        </div>
    );
}
