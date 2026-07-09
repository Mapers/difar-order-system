import {capPct, getStatusColor} from "@/app/utils/metas-helpers";

interface ProgressBarProps {
    pct: number;
    height?: string;
    showLabel?: boolean;
    className?: string;
}

export default function ProgressBar({ pct, height = "h-1.5", showLabel = false, className = "" }: ProgressBarProps) {
    const [c1, c2] = getStatusColor(pct);
    const safePct = capPct(pct);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex-1 bg-muted rounded-full overflow-hidden ${height}`}>
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${safePct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-bold shrink-0 whitespace-nowrap" style={{ color: c1 }}>{safePct}%</span>
            )}
        </div>
    );
}
