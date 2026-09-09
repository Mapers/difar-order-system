"use client";

import { Ban } from "lucide-react";
import { NotifCardProps, formatNotifDate } from "./shared";

export function ReciboAnulacionResueltaCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;
  const data = payload?.data || {};
  const aprobado = !!data.aprobado;

  return (
    <div className="flex gap-3 p-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          aprobado
            ? "bg-green-100 dark:bg-green-950/40"
            : "bg-red-100 dark:bg-red-950/40"
        }`}
      >
        <Ban
          className={`h-5 w-5 ${
            aprobado
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {aprobado ? "Anulación aprobada" : "Anulación rechazada"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {payload?.mensaje ||
            (aprobado
              ? `El recibo ${data.numeroRecibo || ""} fue anulado`
              : `No se aprobó anular el recibo ${data.numeroRecibo || ""}`)}
          {data.resueltoNombre ? ` · ${data.resueltoNombre}` : ""}
        </p>

        {!aprobado && data.motivoRechazo && (
          <p className="mt-1 rounded border border-border bg-muted/50 px-2 py-1 text-xs text-foreground">
            <span className="text-muted-foreground">Motivo: </span>
            {data.motivoRechazo}
          </p>
        )}

        <p className="mt-0.5 text-xs text-muted-foreground">{formatNotifDate(receivedAt)}</p>
      </div>
    </div>
  );
}
