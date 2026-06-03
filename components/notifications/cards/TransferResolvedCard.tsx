"use client";

import { CheckCircle2, XCircle, Calendar, RefreshCw } from "lucide-react";
import { NotifCardProps, formatNotifDate } from "./shared";

export function TransferResolvedCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;
  const data = payload?.data || {};
  const aprobada = data?.estado === "aprobada";

  return (
    <div className="flex gap-3 p-3">
      <div
        className={
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
          (aprobada ? "bg-green-100" : "bg-red-100")
        }
      >
        {aprobada ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-gray-800">
            {aprobada ? "Transferencia aprobada" : "Transferencia rechazada"}
          </p>
        </div>
        {payload?.mensaje && (
          <p className="text-xs text-gray-600">{payload.mensaje}</p>
        )}
        {aprobada && (
          <div className="mt-1 flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
            <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Recarga la página para poder usar el cliente nuevo.</span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatNotifDate(receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}
