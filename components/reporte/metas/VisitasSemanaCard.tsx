import { MapPin } from "lucide-react"
import { IVisitasSemana } from "@/app/types/metas-types"
import { getStatusColor, getStatusChip } from "@/app/utils/metas-helpers"
import ProgressBar from "./ProgressBar"

interface Props {
    data: IVisitasSemana;
    loading: boolean;
    onClick: () => void;
}

export default function VisitasSemanaCard({ data, loading, onClick }: Props) {
    if (loading) {
        return (
            <div className="bg-background rounded-lg p-3 border border-border animate-pulse">
                <div className="h-3 w-24 bg-muted rounded mb-2" />
                <div className="h-6 w-16 bg-muted rounded mb-1" />
                <div className="h-3 w-20 bg-muted rounded" />
            </div>
        );
    }

    if (!data?.tiene_rutas) return null;

    const pct = data.pct;
    const [color] = getStatusColor(pct);
    const chip = getStatusChip(pct);

    return (
        <button
            onClick={onClick}
            className="bg-background rounded-lg p-3 border border-border text-left hover:border-sky-300 hover:shadow-sm transition-all group"
        >
            <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Visitas Semana</p>
                <MapPin className="h-3 w-3 text-muted-foreground/50 group-hover:text-sky-400 transition-colors" />
            </div>
            <p className="text-lg font-bold mt-0.5" style={{ color }}>
                {data.visitados} / {data.asignados}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{pct}% cumplimiento</p>
            <ProgressBar pct={pct} height="h-1" className="mt-1.5" />
            <span className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${chip.className}`}>
                {chip.label}
            </span>
        </button>
    );
}
