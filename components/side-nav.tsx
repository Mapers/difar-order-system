"use client";

import { NavMenu } from "@/components/nav/NavMenu";
import { UserCard } from "@/components/nav/UserCard";
import { LogoutButton } from "@/components/nav/LogoutButton";
import { useSidebar } from "@/context/sidebarContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Sidebar fijo para escritorio. Oculto en móvil (md:flex). */
export function SideNav() {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r bg-background shadow-sm transition-all duration-300 md:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <UserCard />
      <NavMenu />
      <div className="mt-auto">
        <LogoutButton />
      </div>

      {/* Botón colapso */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
