"use client";

import { useState } from "react";
import { ArrowLeftRight, User, Calendar, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/app/hooks/useToast";
import { NotificationService } from "@/app/services/notification/NotificationService";
import { useNotifications } from "@/app/providers/notification-provider";
import { useAuth } from "@/context/authContext";
import { NotifCardProps, formatNotifDate } from "./shared";

/** Notificación de solicitud de transferencia: solo admins, con Aprobar / Rechazar.
 *  payload = fila de la tabla `notificaciones` ({ id, mensaje, data:{...}, ... }). */
export function TransferApprovalCard({ notification }: NotifCardProps) {
  const { payload, receivedAt, status } = notification;
  const data = payload?.data || {};
  const { updateStatus } = useNotifications();
  const { user } = useAuth();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  // el :id del endpoint aprobar/rechazar es el id de la notificación
  const notifId = payload?.id;
  const resolved = status === "approved" || status === "rejected";

  const handle = async (action: "approve" | "reject") => {
    if (pending || resolved) return;
    setPending(action);
    try {
      const resueltoPor = user?.codigo ?? null;
      if (action === "approve") {
        await NotificationService.approveTransfer(notifId, resueltoPor);
        updateStatus(notification.id, "approved");
        toast({ title: "Transferencia", description: "Transferencia aprobada", variant: "success" });
      } else {
        await NotificationService.rejectTransfer(notifId, resueltoPor);
        updateStatus(notification.id, "rejected");
        toast({ title: "Transferencia", description: "Transferencia rechazada", variant: "warning" });
      }
    } catch (error: any) {
      toast({
        title: "Transferencia",
        description: error?.response?.data?.message || "No se pudo procesar la solicitud",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex gap-3 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <ArrowLeftRight className="h-5 w-5 text-amber-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            Transferencia de cliente
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
              {status === "approved" ? "Aprobada" : "Rechazada"}
            </Badge>
          )}
        </div>
        {payload?.mensaje && (
          <p className="text-xs text-muted-foreground break-words">{payload.mensaje}</p>
        )}
        {data?.clienteNombre && (
          <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 break-words">
              {data.clienteNombre}
              {data?.clienteRuc ? ` · ${data.clienteRuc}` : ""}
            </span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatNotifDate(receivedAt)}</span>
        </div>

        {!resolved && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-7 min-w-[6rem] flex-1 gap-1 whitespace-nowrap bg-green-600 px-2 hover:bg-green-700"
              disabled={!!pending}
              onClick={() => handle("approve")}
            >
              {pending === "approve" ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 shrink-0" />
              )}
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 min-w-[6rem] flex-1 gap-1 whitespace-nowrap px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={!!pending}
              onClick={() => handle("reject")}
            >
              {pending === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              Rechazar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
