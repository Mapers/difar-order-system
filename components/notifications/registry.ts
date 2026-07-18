import { ShoppingCart, CheckCircle2, ArrowLeftRight, AlertTriangle, FileWarning, FileClock } from "lucide-react";
import type { User } from "@/app/services/auth/types";
import type { NotificationKind } from "./types";

type NotifIcon = React.ComponentType<{ className?: string }>;

export interface NotifGuardCtx {
  user: User | null;
  isAdmin: () => boolean;
}

export interface NotificationTypeConfig {
  kind: NotificationKind;
  socketEvent: string;
  title: string;
  icon: NotifIcon;
  actionable: boolean;
  showArrivalModal: boolean;
  playSound: boolean;
  persisted: boolean;
  /** Si es true, solo se mantiene una notificación viva de este kind: la nueva reemplaza a la anterior. */
  singleton?: boolean;
  shouldReceive: (ctx: NotifGuardCtx, payload?: any) => boolean;
}

export const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    kind: "newOrder",
    socketEvent: "notification:newOrder",
    title: "Nueva orden",
    icon: ShoppingCart,
    actionable: false,
    showArrivalModal: true,
    playSound: true,
    persisted: false,
    shouldReceive: ({ isAdmin }) => isAdmin(),
  },
  {
    kind: "newApprove",
    socketEvent: "notification:newApprove",
    title: "Aprobación",
    icon: CheckCircle2,
    actionable: false,
    showArrivalModal: true,
    playSound: true,
    persisted: false,
    shouldReceive: ({ isAdmin }) => isAdmin(),
  },
  {
    kind: "transferApproval",
    socketEvent: "notification:transfer",
    title: "Transferencia de cliente",
    icon: ArrowLeftRight,
    actionable: true,
    showArrivalModal: true,
    playSound: false,
    persisted: true,
    shouldReceive: ({ isAdmin }) => isAdmin(),
  },
  {
    kind: "transferResolved",
    socketEvent: "notification:transferResolved",
    title: "Respuesta de transferencia",
    icon: ArrowLeftRight,
    actionable: false,
    showArrivalModal: true,
    playSound: false,
    persisted: true,
    shouldReceive: ({ user }, payload) =>
      !!user?.codigo && payload?.destinatario_codigo === user.codigo,
  },
  {
    kind: "stockBajo",
    socketEvent: "notification:stockBajo",
    title: "Stock bajo",
    icon: AlertTriangle,
    actionable: false,
    showArrivalModal: true,
    playSound: false,
    persisted: true,
    shouldReceive: ({ isAdmin }) => isAdmin(),
  },
  {
    kind: "sunatEstado",
    socketEvent: "notification:sunatEstado",
    title: "Estado SUNAT",
    icon: FileWarning,
    actionable: false,
    showArrivalModal: true,
    playSound: false,
    persisted: true,
    singleton: true,
    shouldReceive: ({ isAdmin }) => isAdmin(),
  },
  {
    kind: "borradorPendiente",
    socketEvent: "notification:borradorPendiente",
    title: "Pedido sin enviar",
    icon: FileClock,
    actionable: false,
    showArrivalModal: true,
    playSound: false,
    persisted: true,
    singleton: true,
    // Se compara contra idUsuarioWeb y NO contra codigo: el borrador es del
    // usuario web, y codigo cambia cuando un representante simula a un
    // vendedor (authController.js:44-47). Mismo molde que transferResolved.
    shouldReceive: ({ user }, payload) =>
      user?.idUsuarioWeb != null &&
      payload?.destinatario_codigo === `U${user.idUsuarioWeb}`,
  },
];

export const PERSISTED_KINDS = new Set(
  NOTIFICATION_TYPES.filter((t) => t.persisted).map((t) => t.kind),
);

export const SINGLETON_KINDS = new Set(
  NOTIFICATION_TYPES.filter((t) => t.singleton).map((t) => t.kind),
);

export const VALID_KINDS = new Set(NOTIFICATION_TYPES.map((t) => t.kind));
