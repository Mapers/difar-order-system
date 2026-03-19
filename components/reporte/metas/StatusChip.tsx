import {getStatusChip} from "@/app/utils/metas-helpers";
import {Badge} from "@/components/ui/badge";

interface StatusChipProps {
    pct: number;
}

export default function StatusChip({ pct }: StatusChipProps) {
    const { label, className } = getStatusChip(pct);
    return (
        <Badge variant="outline" className={`text-[11px] font-bold ${className}`}>
            {label}
        </Badge>
    );
}
