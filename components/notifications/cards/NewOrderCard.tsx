"use client";

import { ShoppingCart, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotifCardProps, formatNotifDate, formatOrderNumber } from "./shared";

/** Notificación de nueva orden: solo informativa. */
export function NewOrderCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;

  return (
    <div className="flex gap-3 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
        <ShoppingCart className="h-5 w-5 text-green-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            ¡Nueva orden recibida!
          </p>
          {(payload?.numeroOrden || payload?.id) && (
            <Badge variant="secondary" className="shrink-0">
              {formatOrderNumber(payload?.numeroOrden || payload?.id)}
            </Badge>
          )}
        </div>
        {payload?.message && (
          <p className="text-xs text-muted-foreground break-words">
            {payload.message} {payload?.vendedor}
          </p>
        )}
        <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 break-words">
            {payload?.cliente?.nombre || "Cliente"}
            {payload?.cliente?.ruc ? ` · ${payload.cliente.ruc}` : ""}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatNotifDate(receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}
