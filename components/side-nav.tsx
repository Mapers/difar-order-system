"use client";

import { NavMenu } from "@/components/nav/NavMenu";
import { UserCard } from "@/components/nav/UserCard";
import { LogoutButton, LogoutConfirmDialog } from "@/components/nav/LogoutButton";
import { useSidebar } from "@/context/sidebarContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

/** Sidebar fijo para escritorio. Oculto en móvil (md:flex). */
export function SideNav() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-border/60 bg-background/80 shadow-[4px_0_24px_-12px_rgba(30,64,175,0.25)] backdrop-blur-xl transition-all duration-300 md:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <UserCard />
      <NavMenu />
      <div className="mt-auto">
        <LogoutButton onClick={() => setShowLogoutConfirm(true)} />
      </div>
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
      />

      {/* Botón colapso */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-all duration-200 hover:scale-110 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-600 hover:to-indigo-600 hover:text-white"
        title={collapsed ? "Expandir menú" : "Comprimir menú"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
