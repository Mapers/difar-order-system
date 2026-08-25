"use client";

import { FileCheck } from "lucide-react";
import { NotifCardProps, formatNotifDate } from "./shared";

export function ReciboPermisoResueltoCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;
  const data = payload?.data || {};
  const aprobado = !!data.aprobado;

  return (
    <div className="flex gap-3 p-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          aprobado ? "bg-green-100" : "bg-red-100"
        }`}
      >
        <FileCheck className={`h-5 w-5 ${aprobado ? "text-green-600" : "text-red-600"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {aprobado ? "Permiso aprobado" : "Permiso rechazado"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {payload?.mensaje || (aprobado ? "Ya puedes emitir recibos" : "Tu solicitud fue rechazada")}
          {data.resueltoNombre ? ` · ${data.resueltoNombre}` : ""}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatNotifDate(receivedAt)}</p>
      </div>
    </div>
  );
}
