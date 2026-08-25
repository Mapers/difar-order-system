"use client";

import { useState } from "react";
import { FileCheck, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/app/hooks/useToast";
import { NotificationService } from "@/app/services/notification/NotificationService";
import { useNotifications } from "@/app/providers/notification-provider";
import { useAuth } from "@/context/authContext";
import { NotifCardProps, formatNotifDate } from "./shared";

export function ReciboPermisoCard({ notification }: NotifCardProps) {
  const { payload, receivedAt, status } = notification;
  const data = payload?.data || {};
  const { updateStatus } = useNotifications();
  const { user } = useAuth();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  const idPermiso = data?.idPermiso;
  const resolved = status === "approved" || status === "rejected";

  const handle = async (action: "approve" | "reject") => {
    if (pending || resolved || !idPermiso) return;
    setPending(action);
    try {
      await NotificationService.resolverPermisoRecibo(
        idPermiso,
        action === "approve",
        user?.codigo ?? null,
        user?.nombreCompleto ?? null,
      );
      updateStatus(notification.id, action === "approve" ? "approved" : "rejected");
      toast({
        title: "Permiso de recibo",
        description: action === "approve" ? "Permiso aprobado" : "Solicitud rechazada",
        variant: action === "approve" ? "success" : "warning",
      });
    } catch (error: any) {
      toast({
        title: "Permiso de recibo",
        description: error?.response?.data?.message || "No se pudo procesar la solicitud",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex gap-3 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
        <FileCheck className="h-5 w-5 text-blue-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            Permiso para emitir recibo
          </p>
          {resolved && (
            <Badge
              variant="secondary"
              className={
                status === "approved"
                  ? "shrink-0 bg-green-100 text-green-700"
                  : "shrink-0 bg-red-100 text-red-700"
              }
            >
              {status === "approved" ? "Aprobado" : "Rechazado"}
            </Badge>
          )}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {data.nombreVendedor || data.codVendedor || "Un vendedor"} pide habilitar el formulario
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatNotifDate(receivedAt)}</p>

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
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-red-600"
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
