"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import socket from "@/app/api/socket";
import { useAuth } from "@/context/authContext";
import {
  NOTIFICATION_TYPES,
  PERSISTED_KINDS,
  SINGLETON_KINDS,
  VALID_KINDS,
} from "@/components/notifications/registry";
import type {
  AppNotification,
  NotificationKind,
  NotificationStatus,
} from "@/components/notifications/types";
import { NotificationService } from "@/app/services/notification/NotificationService";

const MAX_NOTIFICATIONS = 50;

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  latestArrival: AppNotification | null;
  markAllRead: () => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
  clearAll: () => void;
  updateStatus: (id: string, status: NotificationStatus) => void;
  dismissArrival: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotifications debe usarse dentro de un NotificationProvider",
    );
  }
  return ctx;
};

const storageKeyFor = (userId: number | string | null | undefined) =>
  userId != null ? `difar:notifications:${userId}` : null;

const mapEstado = (estado?: string): NotificationStatus | undefined => {
  if (estado === "aprobada") return "approved";
  if (estado === "rechazada") return "rejected";
  if (estado === "pendiente") return "pending";
  return undefined;
};

const fromBackendRow = (row: any): AppNotification => ({
  id: `${row.tipo}:${row.id}`,
  kind: row.tipo as NotificationKind,
  payload: row,
  receivedAt: row.fecha_creacion ?? new Date().toISOString(),
  read: !!row.leido,
  status: mapEstado(row.estado),
});

const mergeBackend = (
  prev: AppNotification[],
  backend: AppNotification[],
): AppNotification[] => {
  const local = prev.filter((n) => !PERSISTED_KINDS.has(n.kind));
  const seen = new Set<string>();
  const out: AppNotification[] = [];
  for (const n of [...backend, ...local]) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  out.sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
  );
  return out.slice(0, MAX_NOTIFICATIONS);
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latestArrival, setLatestArrival] = useState<AppNotification | null>(
    null,
  );

  const storageKey = storageKeyFor(user?.idVendedor);

  const authRef = useRef({ user, isAdmin });
  authRef.current = { user, isAdmin };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    audioRef.current = new Audio("/sounds/beep.mp3");
  }, []);

  useEffect(() => {
    if (!storageKey) {
      setNotifications([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      setNotifications(raw ? (JSON.parse(raw) as AppNotification[]) : []);
    } catch {
      setNotifications([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)),
      );
    } catch {
    }
  }, [notifications, storageKey]);

  const refresh = useCallback(async () => {
    const ctx = authRef.current;
    const rol = ctx.isAdmin() ? "admin" : null;
    const codigo = ctx.user?.codigo ?? null;
    // Las notificaciones de borrador se direccionan por usuario web, no por
    // código de vendedor, así que necesitan su propia consulta.
    const codigoUsuario =
      ctx.user?.idUsuarioWeb != null ? `U${ctx.user.idUsuarioWeb}` : null;

    if (!rol && !codigo && !codigoUsuario) return;

    try {
      const respuestas = await Promise.all([
        rol || codigo
          ? NotificationService.listNotifications(rol, codigo)
          : Promise.resolve(null),
        codigoUsuario
          ? NotificationService.listNotifications(null, codigoUsuario)
          : Promise.resolve(null),
      ]);

      const rows: any[] = respuestas.flatMap((res) => res?.data ?? res ?? []);
      const backend = rows
        .filter((r) => r && VALID_KINDS.has(r.tipo))
        .map(fromBackendRow);
      // mergeBackend deduplica por id (`${tipo}:${id}`), así que si una fila
      // viniera en ambas consultas no se duplica.
      setNotifications((prev) => mergeBackend(prev, backend));
    } catch {
    }
  }, []);

  useEffect(() => {
    if (user?.codigo || user?.idVendedor != null || user?.idUsuarioWeb != null) refresh();
  }, [user?.idVendedor, user?.idUsuarioWeb, refresh]);

  useEffect(() => {
    const handlers: Array<[string, (data: any) => void]> = [];

    NOTIFICATION_TYPES.forEach((cfg) => {
      const handler = (data: any) => {
        if (!cfg.shouldReceive(authRef.current, data)) return;

        const baseId =
          data?.id ?? data?.numeroOrden ?? `${new Date().getTime()}`;
        const notif: AppNotification = {
          id: `${cfg.kind}:${baseId}`,
          kind: cfg.kind,
          payload: data,
          receivedAt: new Date().toISOString(),
          read: false,
          status: cfg.actionable ? "pending" : mapEstado(data?.estado),
        };

        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          // Los kinds "singleton" mantienen una sola notificación viva:
          // la nueva reemplaza a cualquier anterior del mismo kind.
          const base = SINGLETON_KINDS.has(notif.kind)
            ? prev.filter((n) => n.kind !== notif.kind)
            : prev;
          return [notif, ...base].slice(0, MAX_NOTIFICATIONS);
        });

        if (cfg.playSound) audioRef.current?.play().catch(() => {});
        if (cfg.showArrivalModal) setLatestArrival(notif);
      };

      socket.on(cfg.socketEvent, handler);
      handlers.push([cfg.socketEvent, handler]);
    });

    return () => {
      handlers.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, []);

  const value = useMemo<NotificationContextType>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;

    const backendReadParams = () => {
      const ctx = authRef.current;
      return {
        rol: ctx.isAdmin() ? "admin" : null,
        codigo: ctx.user?.codigo ?? null,
        codigoUsuario:
          ctx.user?.idUsuarioWeb != null ? `U${ctx.user.idUsuarioWeb}` : null,
      };
    };

    return {
      notifications,
      unreadCount,
      latestArrival,
      refresh,
      markAllRead: () => {
        setNotifications((prev) =>
          prev.some((n) => !n.read)
            ? prev.map((n) => ({ ...n, read: true }))
            : prev,
        );
        const { rol, codigo, codigoUsuario } = backendReadParams();
        if (rol || codigo) {
          NotificationService.markAllRead(rol, codigo).catch(() => {});
        }
        if (codigoUsuario) {
          NotificationService.markAllRead(null, codigoUsuario).catch(() => {});
        }
      },
      markRead: (id) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        const [kind, dbId] = id.split(":");
        if (PERSISTED_KINDS.has(kind as NotificationKind) && dbId) {
          NotificationService.markRead(dbId).catch(() => {});
        }
      },
      remove: (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const [kind, dbId] = id.split(":");
        if (PERSISTED_KINDS.has(kind as NotificationKind) && dbId) {
          NotificationService.deleteNotification(dbId).catch(() => {});
        }
      },
      clearAll: () => {
        // bucle sobre las notificaciones actuales: borra en backend las persistidas
        notifications.forEach((n) => {
          const [kind, dbId] = n.id.split(":");
          if (PERSISTED_KINDS.has(kind as NotificationKind) && dbId) {
            NotificationService.deleteNotification(dbId).catch(() => {});
          }
        });
        setNotifications([]);
      },
      updateStatus: (id, status) =>
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status, read: true } : n)),
        ),
      dismissArrival: () => setLatestArrival(null),
    };
  }, [notifications, latestArrival, refresh]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
