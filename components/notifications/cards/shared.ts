import type { AppNotification } from "../types";

export interface NotifCardProps {
  notification: AppNotification;
  /** cierra el popover/modal contenedor tras una acción de navegación. */
  onClose?: () => void;
}

export const formatNotifDate = (dateString: string) =>
  new Date(dateString).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatOrderNumber = (value: unknown) =>
  `#${String(value ?? "").padStart(10, "0")}`;
