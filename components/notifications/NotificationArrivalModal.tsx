"use client";

import { ShoppingCart, User, Calendar, ArrowLeftRight, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/app/providers/notification-provider";
import type { AppNotification } from "./types";
import { TransferApprovalCard } from "./cards/TransferApprovalCard";
import { TransferResolvedCard } from "./cards/TransferResolvedCard";
import { StockBajoCard } from "./cards/StockBajoCard";
import { formatNotifDate, formatOrderNumber } from "./cards/shared";

function OrderArrivalBody({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  const data = notification.payload;
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-green-100 p-2">
            <ShoppingCart className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <DialogTitle className="text-lg">¡Nueva Orden Recibida!</DialogTitle>
            <DialogDescription>
              {data ? data.message : "Sin asignación"} {data?.vendedor}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-semibold">{data?.cliente?.nombre || "Cliente"}</p>
                <p className="text-sm text-gray-600">{data?.cliente?.ruc || "Sin RUC"}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {formatOrderNumber(data?.numeroOrden || data?.id)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>{formatNotifDate(data?.fecha || new Date().toISOString())}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </>
  );
}

function TransferArrivalBody({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-amber-100 p-2">
            <ArrowLeftRight className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <DialogTitle className="text-lg">
              Aprobación de transferencia
            </DialogTitle>
            <DialogDescription>
              {notification.payload?.mensaje || "Revisa y gestiona la solicitud"}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="rounded-lg border">
        <TransferApprovalCard notification={notification} onClose={onClose} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </>
  );
}

function TransferResolvedArrivalBody({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">Resultado de transferencia</DialogTitle>
        <DialogDescription>
          {notification.payload?.mensaje || "Tu solicitud de transferencia fue resuelta"}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border">
        <TransferResolvedCard notification={notification} onClose={onClose} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </>
  );
}

function StockBajoArrivalBody({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="shrink-0 rounded-full bg-red-100 p-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg">Stock bajo</DialogTitle>
            <DialogDescription className="truncate">
              {notification.payload?.titulo || "Hay productos por debajo del stock mínimo"}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="overflow-hidden rounded-lg border">
        <StockBajoCard notification={notification} onClose={onClose} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </>
  );
}

export function NotificationArrivalModal() {
  const { latestArrival, dismissArrival } = useNotifications();

  if (!latestArrival) return null;

  const body = () => {
    switch (latestArrival.kind) {
      case "transferApproval":
        return (
          <TransferArrivalBody notification={latestArrival} onClose={dismissArrival} />
        );
      case "transferResolved":
        return (
          <TransferResolvedArrivalBody notification={latestArrival} onClose={dismissArrival} />
        );
      case "stockBajo":
        return (
          <StockBajoArrivalBody notification={latestArrival} onClose={dismissArrival} />
        );
      default:
        return <OrderArrivalBody notification={latestArrival} onClose={dismissArrival} />;
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && dismissArrival()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">{body()}</DialogContent>
    </Dialog>
  );
}
