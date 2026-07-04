import type { NotificationKind } from "../types";
import type { NotifCardProps } from "./shared";
import { NewOrderCard } from "./NewOrderCard";
import { NewApproveCard } from "./NewApproveCard";
import { TransferApprovalCard } from "./TransferApprovalCard";
import { TransferResolvedCard } from "./TransferResolvedCard";
import { StockBajoCard } from "./StockBajoCard";

/** Mapa visual kind → card de la lista. Agregar un tipo nuevo = una línea aquí. */
export const NOTIFICATION_CARDS: Record<
  NotificationKind,
  React.ComponentType<NotifCardProps>
> = {
  newOrder: NewOrderCard,
  newApprove: NewApproveCard,
  transferApproval: TransferApprovalCard,
  transferResolved: TransferResolvedCard,
  stockBajo: StockBajoCard,
};
