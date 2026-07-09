"use client";

import { AlertTriangle, Calendar } from "lucide-react";
import { NotifCardProps, formatNotifDate } from "./shared";

interface ProductoBajoStock {
  Codigo_Art: string;
  NombreItem: string;
  Stock: number;
}

export function StockBajoCard({ notification }: NotifCardProps) {
  const { payload, receivedAt } = notification;
  const productos: ProductoBajoStock[] = payload?.data || [];

  return (
    <div className="flex w-full max-w-full gap-3 overflow-hidden p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
      <div className="min-w-0 flex-1 pr-5">
        <p className="truncate text-sm font-semibold text-foreground">
          {payload?.titulo || "Productos con stock bajo"}
        </p>
        {productos.length > 0 && (
          <ul className="mt-1 list-none space-y-0.5 pl-0 text-xs text-muted-foreground">
            {productos.slice(0, 5).map((p) => (
              <li key={p.Codigo_Art} className="truncate">
                • {p.Codigo_Art} - {p.NombreItem}: {p.Stock} unidades
              </li>
            ))}
            {productos.length > 5 && (
              <li className="truncate text-muted-foreground">
                y {productos.length - 5} producto(s) más…
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
