"use client";

import { NotificationBell } from "@/components/notifications/NotificationBell";

/** Barra superior de escritorio (oculta en móvil; en móvil la campanita va en MobileNav). */
export function TopBar() {
  return (
    <header className="sticky top-0 z-10 hidden h-14 items-center justify-end border-b bg-white/80 px-6 backdrop-blur md:flex">
      <NotificationBell />
    </header>
  );
}
