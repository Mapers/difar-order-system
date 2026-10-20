"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { useMenuItems } from "@/hooks/useMenuItems";
import { useSidebar } from "@/context/sidebarContext";

interface NavMenuProps {
  /** Se llama tras navegar (móvil lo usa para cerrar el drawer). */
  onNavigate?: () => void;
}

/** Lista de navegación compartida por SideNav (escritorio) y MobileNav (drawer). */
export function NavMenu({ onNavigate }: NavMenuProps) {
  const pathname = usePathname();
  const menuItems = useMenuItems();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const { collapsed } = useSidebar();

  const toggleItem = (title: string) =>
    setOpenItem((prev) => (prev === title ? null : title));

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={100}>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col items-center gap-1 py-4">
            {menuItems.map((item) => {
              const isActive = item.children
                ? pathname.startsWith(item.href)
                : pathname === item.href;
              const href = item.children ? item.children[0]?.href ?? item.href : item.href;
              const claseIcono = cn(
                "relative flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:bg-blue-100 dark:hover:bg-blue-950",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-blue-700",
              );

              // Con submenú: al pasar el mouse se abre un panel a la derecha
              // con el título y sus opciones, porque colapsado no hay espacio
              // para desplegarlas debajo.
              if (item.children) {
                return (
                  <HoverCard key={item.id} openDelay={60} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <Link href={href} onClick={onNavigate} className={claseIcono} aria-label={item.title}>
                        <item.icon className="h-5 w-5" />
                        <ChevronRight
                          className={cn(
                            "absolute -right-0.5 bottom-0.5 h-3 w-3",
                            isActive ? "text-white/80" : "text-muted-foreground/70",
                          )}
                        />
                      </Link>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" sideOffset={10} className="w-64 overflow-hidden p-0">
                      <div className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-3 text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold">{item.title}</span>
                        <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
                          {item.children.length}
                        </span>
                      </div>
                      <div className="flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto p-1.5">
                        {item.children.map((sub) => {
                          const subActivo = pathname === sub.href;
                          return (
                            <Link
                              key={sub.id}
                              href={sub.href}
                              onClick={onNavigate}
                              className={cn(
                                "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                                subActivo
                                  ? "bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                  : "text-foreground/80 hover:bg-muted hover:text-blue-700",
                              )}
                            >
                              <sub.icon
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  subActivo ? "text-blue-700 dark:text-blue-300" : "text-muted-foreground group-hover:text-blue-600",
                                )}
                              />
                              <span className="leading-tight">{sub.title}</span>
                              {subActivo && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                            </Link>
                          );
                        })}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              }

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link href={href} onClick={onNavigate} className={claseIcono}>
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </ScrollArea>
      </TooltipProvider>
    );
  }

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
                    : "text-muted-foreground hover:text-blue-700",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      pathname.startsWith(item.href)
                        ? "text-white"
                        : "text-muted-foreground group-hover:text-blue-600",
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
                    : "text-muted-foreground hover:text-blue-700",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    pathname === item.href
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-blue-600",
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
                        : "text-muted-foreground hover:text-blue-700",
                    )}
                  >
                    <sub.icon
                      className={cn(
                        "h-4 w-4",
                        pathname === sub.href
                          ? "text-blue-700"
                          : "text-muted-foreground group-hover:text-blue-600",
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
