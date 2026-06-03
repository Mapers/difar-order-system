"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMenuItems } from "@/hooks/useMenuItems";

interface NavMenuProps {
  /** Se llama tras navegar (móvil lo usa para cerrar el drawer). */
  onNavigate?: () => void;
}

/** Lista de navegación compartida por SideNav (escritorio) y MobileNav (drawer). */
export function NavMenu({ onNavigate }: NavMenuProps) {
  const pathname = usePathname();
  const menuItems = useMenuItems();
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (title: string) =>
    setOpenItem((prev) => (prev === title ? null : title));

  return (
    <ScrollArea className="flex-1">
      <nav className="grid gap-1 px-2 py-4">
        {menuItems.map((item) => (
          <div key={item.id}>
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
              <Link
                href={item.href}
                onClick={onNavigate}
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
                    key={sub.id}
                    href={sub.href}
                    onClick={onNavigate}
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
  );
}
