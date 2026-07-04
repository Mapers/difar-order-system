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
    <div className="flex gap-3 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-5 w-5 text-red-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">
          {payload?.titulo || "Productos con stock bajo"}
        </p>
        {productos.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
            {productos.slice(0, 5).map((p) => (
              <li key={p.Codigo_Art} className="truncate">
                • {p.Codigo_Art} - {p.NombreItem}: {p.Stock} unidades
              </li>
            ))}
            {productos.length > 5 && (
              <li className="text-gray-400">
                y {productos.length - 5} producto(s) más…
              </li>
            )}
          </ul>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatNotifDate(receivedAt)}</span>
        </div>
      </div>
    </div>
  );
}
