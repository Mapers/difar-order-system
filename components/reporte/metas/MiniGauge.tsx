import { PieChart, Pie, Cell } from "recharts";
import {capPct, getStatusColor} from "@/app/utils/metas-helpers";

interface MiniGaugeProps {
    pct: number;
    width?: number;
    height?: number;
}

/** Zonas fijas del velocímetro (rojo/amarillo/verde), igual que el diseño original. */
const ZONES = [
    { value: 49, color: "#fee2e2" },
    { value: 30, color: "#fef3c7" },
    { value: 21, color: "#d1fae5" },
];

export default function MiniGauge({ pct, width = 64, height = 38 }: MiniGaugeProps) {
    const [c1] = getStatusColor(pct);
    const safePct = capPct(pct);

    // El pivote de la aguja va abajo-centro: solo se dibuja la mitad superior del círculo.
    const cx = width / 2;
    const cy = height - 2;
    const outerR = Math.max(8, Math.min(cx, cy) - 2);
    const innerR = Math.max(4, outerR - Math.max(5, outerR * 0.32));

    const angle = Math.PI - (safePct / 100) * Math.PI;
    const needleLen = outerR - 1;
    const needleX = cx + needleLen * Math.cos(angle);
    const needleY = cy - needleLen * Math.sin(angle);

    return (
        <div className="flex flex-col items-center gap-0.5 max-w-full overflow-hidden">
            <div style={{ width, height, position: "relative" }}>
                <PieChart width={width} height={height}>
                    <Pie
                        data={ZONES}
                        dataKey="value"
                        cx={cx}
                        cy={cy}
                        startAngle={180}
                        endAngle={0}
                        innerRadius={innerR}
                        outerRadius={outerR}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={false}
                        rootTabIndex={-1}
                    >
                        {ZONES.map((zone, i) => (
                            <Cell key={i} fill={zone.color} />
                        ))}
                    </Pie>
                </PieChart>
                <svg
                    width={width}
                    height={height}
                    style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
                >
                    <line x1={cx} y1={cy} x2={needleX.toFixed(1)} y2={needleY.toFixed(1)}
                          stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="2.2" fill="#1e293b" />
                </svg>
            </div>
            <span className="text-[11px] font-bold leading-none whitespace-nowrap" style={{ color: c1 }}>{safePct}%</span>
        </div>
    );
}
