"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { NAME_ROLES, NAV_ITEMS } from "@/constants/roles";

/* ───────── tipos ───────── */
type Role = typeof NAME_ROLES[keyof typeof NAME_ROLES];

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  children?: Omit<NavItem, "children" | "roles">[]; 
}

export function SideNav() {
  const pathname = usePathname();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const { user, logout } = useAuth(); // <-- necesitas exponer `user` en tu contexto

  /* ───────── filtrado por rol ───────── */
  const itemsForRole = useMemo(() => {
    if (!user) return [];

    const role = user.rolDescripcion as Role;

    // el padre se filtra por rol; los hijos heredan implícitamente
    return NAV_ITEMS.filter((item) => item.roles.includes(role));
  }, [user]);

  const toggleItem = (title: string) =>
    setOpenItem((prev) => (prev === title ? null : title));

  /* ───────── UI ───────── */
  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white shadow-sm md:flex">
      <div className="flex h-20 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/difar-logo.png"
            alt="Logo difar"
            width={120}
            height={60}
            className="object-contain"
          />
        </Link>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {itemsForRole.map((item) => (
            <div key={item.href}>
              {item.children ? (
                /* ───── padre con sub‑menú ───── */
                <button
                  type="button"
                  onClick={() => toggleItem(item.title)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-blue-100",
                    pathname.startsWith(item.href)
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:text-blue-700",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        pathname.startsWith(item.href)
                          ? "text-white"
                          : "text-gray-500 group-hover:text-blue-600",
                      )}
                    />
                    {item.title}
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      openItem === item.title ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
              ) : (
                /* ───── enlace simple ───── */
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-blue-100",
                    pathname === item.href
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:text-blue-700",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      pathname === item.href
                        ? "text-white"
                        : "text-gray-500 group-hover:text-blue-600",
                    )}
                  />
                  {item.title}
                </Link>
              )}

              {/* sub‑items */}
              {item.children && openItem === item.title && (
                <div className="ml-8 mt-1 flex flex-col gap-1">
                  {item.children.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-blue-50",
                        pathname === sub.href
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:text-blue-700",
                      )}
                    >
                      <sub.icon
                        className={cn(
                          "h-4 w-4",
                          pathname === sub.href
                            ? "text-blue-700"
                            : "text-gray-400 group-hover:text-blue-600",
                        )}
                      />
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="mt-auto border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
