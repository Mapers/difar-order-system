"use client";

import { FileWarning, Calendar } from "lucide-react";
import { NotifCardProps, formatNotifDate } from "./shared";
import { getEstadoSunatConfig } from "@/app/utils/sunat";

interface ComprobanteProblema {
  idComprobanteCab: number;
  tipoDoc: string;
  serie: string;
  numero: string;
  estado: number;
  estadoDesc: string;
  motivo?: string;
  cliente?: string | null;
}

/** Color del badge según el estado SUNAT. Ver app/utils/sunat.ts */
function estadoBadgeClass(estado: number): string {
  return getEstadoSunatConfig(estado)?.badgeClass ?? "bg-muted text-muted-foreground";
}

export function SunatEstadoCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;
  const comprobantes: ComprobanteProblema[] = payload?.data || [];

  return (
    <div className="flex w-full max-w-full gap-3 overflow-hidden p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
        <FileWarning className="h-5 w-5 text-red-600" />
      </div>
      <div className="min-w-0 flex-1 pr-5">
        <p className="truncate text-sm font-semibold text-foreground">
          {payload?.titulo || "Comprobantes con problema en SUNAT"}
        </p>
        {comprobantes.length > 0 && (
          <ul className="mt-1 list-none space-y-1 pl-0 text-xs text-muted-foreground">
            {comprobantes.slice(0, 5).map((c) => (
              <li key={c.idComprobanteCab} className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">
                    {c.serie}-{c.numero}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${estadoBadgeClass(
                      c.estado,
                    )}`}
                  >
                    {c.estadoDesc}
                  </span>
                </div>
                {c.motivo ? (
                  <span className="block truncate">{c.motivo}</span>
                ) : null}
              </li>
            ))}
            {comprobantes.length > 5 && (
              <li className="truncate text-muted-foreground">
                y {comprobantes.length - 5} comprobante(s) más…
              </li>
            )}
          </ul>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{formatNotifDate(receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}
