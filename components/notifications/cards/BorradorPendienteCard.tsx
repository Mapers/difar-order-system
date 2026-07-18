"use client";

import { FileClock, Calendar } from "lucide-react";
import { NotifCardProps, formatNotifDate } from "./shared";

export function BorradorPendienteCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;
  const cantidad: number = Number(payload?.data?.cantidad) || 0;

  return (
    <div className="flex w-full max-w-full gap-3 overflow-hidden p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <FileClock className="h-5 w-5 text-amber-600" />
      </div>
      <div className="min-w-0 flex-1 pr-5">
        <p className="truncate text-sm font-semibold text-foreground">
          {payload?.titulo ||
            (cantidad === 1 ? "Tienes 1 pedido sin enviar" : `Tienes ${cantidad} pedidos sin enviar`)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {payload?.mensaje || 'Quedó guardado como borrador. Retómalo desde "Tomar pedido".'}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{formatNotifDate(receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}
