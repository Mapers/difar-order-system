export type NotificationKind =
  | "newOrder"
  | "newApprove"
  | "transferApproval"
  | "transferResolved"
  | "stockBajo"
  | "sunatEstado"
  | "borradorPendiente"
  | "reciboPermisoSolicitud"
  | "reciboPermisoResuelto"
  | "reciboAnulacionSolicitud"
  | "reciboAnulacionResuelta";

export type NotificationStatus = "pending" | "approved" | "rejected";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  payload: any;
  receivedAt: string;
  read: boolean;
  status?: NotificationStatus;
}
