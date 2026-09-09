"use client";

import { useState } from "react";
import { Ban, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/app/hooks/useToast";
import { NotificationService } from "@/app/services/notification/NotificationService";
import { useNotifications } from "@/app/providers/notification-provider";
import { useAuth } from "@/context/authContext";
import { NotifCardProps, formatNotifDate } from "./shared";

export function ReciboAnulacionCard({ notification }: NotifCardProps) {
  const { payload, receivedAt, status } = notification;
  const data = payload?.data || {};
  const { updateStatus } = useNotifications();
  const { user } = useAuth();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  const idSolicitud = data?.idSolicitud;
  const resolved = status === "approved" || status === "rejected";

  const simbolo = Number(data?.moneda) === 2 ? "US$" : "S/";
  const total = data?.total != null && Number.isFinite(Number(data.total))
    ? `${simbolo} ${Number(data.total).toFixed(2)}`
    : null;

  const handle = async (action: "approve" | "reject") => {
    if (pending || resolved || !idSolicitud) return;
    setPending(action);
    try {
      await NotificationService.resolverAnulacionRecibo(
        idSolicitud,
        action === "approve",
        user?.idUsuarioWeb ?? null,
        user?.nombreCompleto ?? null,
      );
      updateStatus(notification.id, action === "approve" ? "approved" : "rejected");
      toast({
        title: "Anulación de recibo",
        description: action === "approve"
          ? `Recibo ${data.numeroRecibo || ""} anulado`
          : "Solicitud rechazada",
        variant: action === "approve" ? "success" : "warning",
      });
    } catch (error: any) {
      toast({
        title: "Anulación de recibo",
        description: error?.response?.data?.message || "No se pudo procesar la solicitud",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex gap-3 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
        <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            Anular recibo {data.numeroRecibo || ""}
          </p>
          {resolved && (
            <Badge
              variant="secondary"
              className={
                status === "approved"
                  ? "shrink-0 bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : "shrink-0 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              }
            >
              {status === "approved" ? "Aprobada" : "Rechazada"}
            </Badge>
          )}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {data.nombreVendedor || data.codVendedor || "Un vendedor"}
          {data.nombreCliente && <> · {data.nombreCliente}</>}
          {total && <> · {total}</>}
        </p>

        {data.motivo && (
          <p className="mt-1 rounded border border-border bg-muted/50 px-2 py-1 text-xs text-foreground">
            <span className="text-muted-foreground">Motivo: </span>
            {data.motivo}
          </p>
        )}

        <p className="mt-0.5 text-xs text-muted-foreground">{formatNotifDate(receivedAt)}</p>

        {!resolved && (
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              className="h-7 gap-1 bg-green-600 hover:bg-green-700"
              disabled={!!pending}
              onClick={() => handle("approve")}
            >
              {pending === "approve"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Check className="h-3.5 w-3.5" />}
              Aprobar y anular
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-red-600 dark:text-red-400"
              disabled={!!pending}
              onClick={() => handle("reject")}
            >
              {pending === "reject"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <X className="h-3.5 w-3.5" />}
              Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
