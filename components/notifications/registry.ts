import { ShoppingCart, CheckCircle2, ArrowLeftRight, AlertTriangle, FileWarning } from "lucide-react";
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
];

export const PERSISTED_KINDS = new Set(
  NOTIFICATION_TYPES.filter((t) => t.persisted).map((t) => t.kind),
);

export const SINGLETON_KINDS = new Set(
  NOTIFICATION_TYPES.filter((t) => t.singleton).map((t) => t.kind),
);

export const VALID_KINDS = new Set(NOTIFICATION_TYPES.map((t) => t.kind));
