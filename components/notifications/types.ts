export type NotificationKind =
  | "newOrder"
  | "newApprove"
  | "transferApproval"
  | "transferResolved"
  | "stockBajo";

export type NotificationStatus = "pending" | "approved" | "rejected";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  payload: any;
  receivedAt: string;
  read: boolean;
  status?: NotificationStatus;
}
