"use client";

import { useState } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/app/providers/notification-provider";
import { NOTIFICATION_CARDS } from "./cards";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, remove, clearAll } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && unreadCount > 0) markAllRead();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        collisionPadding={8}
        className="w-[calc(100vw-1rem)] max-w-sm overflow-hidden p-0 sm:w-96"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar todas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center text-muted-foreground">
            <BellOff className="h-8 w-8" />
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            <ul className="divide-y">
              {notifications.map((notification) => {
                const Card = NOTIFICATION_CARDS[notification.kind];
                if (!Card) return null;
                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "group relative",
                      !notification.read && "bg-blue-50/50",
                    )}
                  >
                    <Card
                      notification={notification}
                      onClose={() => setOpen(false)}
                    />
                    <button
                      type="button"
                      aria-label="Quitar notificación"
                      onClick={() => remove(notification.id)}
                      className="absolute right-2 top-2 hidden rounded px-1 text-xs text-muted-foreground hover:text-foreground group-hover:block"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
