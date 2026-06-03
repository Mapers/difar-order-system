"use client";

import { NavMenu } from "@/components/nav/NavMenu";
import { UserCard } from "@/components/nav/UserCard";
import { LogoutButton } from "@/components/nav/LogoutButton";

/** Sidebar fijo para escritorio. Oculto en móvil (md:flex). */
export function SideNav() {
  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white shadow-sm md:flex">
      <UserCard />
      <NavMenu />
      <div className="mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}
