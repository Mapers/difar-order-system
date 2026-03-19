import {getStatusColor} from "@/app/utils/metas-helpers";

interface ProgressBarProps {
    pct: number;
    height?: string;
    showLabel?: boolean;
    className?: string;
}

export default function ProgressBar({ pct, height = "h-1.5", showLabel = false, className = "" }: ProgressBarProps) {
    const [c1, c2] = getStatusColor(pct);
    const safeWidth = Math.min(pct, 100);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex-1 bg-slate-200 rounded-full overflow-hidden ${height}`}>
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${safeWidth}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs font-bold shrink-0" style={{ color: c1 }}>{pct}%</span>
            )}
        </div>
    );
}
