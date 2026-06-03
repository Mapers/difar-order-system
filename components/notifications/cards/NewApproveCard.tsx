"use client";

import { CheckCircle2, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotifCardProps, formatNotifDate, formatOrderNumber } from "./shared";

/** Notificación de aprobación (evento existente `notification:newApprove`): solo informativa. */
export function NewApproveCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;

  return (
    <div className="flex gap-3 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
        <CheckCircle2 className="h-5 w-5 text-blue-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-gray-800">
            Aprobación
          </p>
          {(payload?.numeroOrden || payload?.id) && (
            <Badge variant="secondary" className="shrink-0">
              {formatOrderNumber(payload?.numeroOrden || payload?.id)}
            </Badge>
          )}
        </div>
        {payload?.message && (
          <p className="text-xs text-gray-600 break-words">
            {payload.message} {payload?.vendedor}
          </p>
        )}
        {payload?.cliente?.nombre && (
          <div className="mt-1 flex items-start gap-2 text-xs text-gray-600">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="min-w-0 break-words">
              {payload.cliente.nombre}
              {payload?.cliente?.ruc ? ` · ${payload.cliente.ruc}` : ""}
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatNotifDate(payload?.fecha || receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}
