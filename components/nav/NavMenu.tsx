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

// ── Estilos del menú (los mismos colores del resto del sistema: azul → índigo) ──
const FILA = "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition-all duration-200 active:scale-[0.98]";
// Activa: degradado con un brillo que la recorre cada pocos segundos.
const FILA_ACTIVA = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25 after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-1/3 after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent after:[animation:nav-brillo_3.6s_ease-in-out_infinite]";
const FILA_NORMAL = "text-slate-600 hover:translate-x-1 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white";
const CHAPA = "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6";

/** Animaciones del menú: entrada en cascada, despliegue de submenús y brillo de la opción activa. */
const ANIMACIONES = `
@keyframes nav-entra { from { opacity: 0; transform: translateX(-10px) } to { opacity: 1; transform: none } }
@keyframes nav-abre { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
@keyframes nav-brillo { 0%, 55% { transform: translateX(-120%) } 100% { transform: translateX(420%) } }
`;
/** Cada fila entra un poco después de la anterior. */
const entrada = (i: number) => ({ animation: `nav-entra .38s cubic-bezier(.2,.8,.2,1) ${Math.min(i, 14) * 38}ms both` });
const CHAPA_ACTIVA = "bg-white/20 text-white";
const CHAPA_NORMAL = "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-blue-500/20 dark:group-hover:text-blue-300";
const HIJO = "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium leading-tight transition-all duration-200 [&>svg]:transition-transform [&>svg]:duration-200 hover:[&>svg]:scale-110";
// La barrita azul a la izquierda del hijo activo se apoya en la línea guía del grupo.
const HIJO_ACTIVO = "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200 before:absolute before:-left-[13px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-blue-500 before:to-indigo-600";
const HIJO_NORMAL = "text-slate-500 hover:translate-x-0.5 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white";
const GUIA = "ml-[25px] mt-1 flex flex-col gap-0.5 border-l border-slate-200 pl-3 dark:border-white/10 [animation:nav-abre_.24s_ease-out_both]";

/** Lista de navegación compartida por SideNav (escritorio) y MobileNav (drawer). */
export function NavMenu({ onNavigate }: NavMenuProps) {
  const pathname = usePathname();
  const menuItems = useMenuItems();
  // null = todavía no tocó nada: se muestra abierto el menú de la pantalla donde está.
  const [openItem, setOpenItem] = useState<string | null>(null);
  const { collapsed } = useSidebar();

  const abiertoPorRuta = menuItems.find((i) => i.children && pathname.startsWith(i.href))?.title ?? "";
  const abierto = openItem ?? abiertoPorRuta;
  const toggleItem = (title: string) => setOpenItem(abierto === title ? "" : title);

  // Grupos del tercer nivel: el usuario los abre y cierra; el que contiene la pantalla actual empieza abierto.
  const [gruposManual, setGruposManual] = useState<Record<string, boolean>>({});
  const toggleGrupo = (id: string) =>
    setGruposManual((prev) => ({ ...prev, [id]: !grupoAbiertoPorId(id, prev) }));
  const grupoAbiertoPorId = (id: string, estado: Record<string, boolean>) => {
    if (id in estado) return estado[id];
    const grupo = menuItems.flatMap((i) => i.children ?? []).find((s) => s.id === id);
    return !!grupo?.children?.some((n) => n.href === pathname);
  };
  const grupoAbierto = (sub: { id: string }) => grupoAbiertoPorId(sub.id, gruposManual);

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={100}>
        <ScrollArea className="flex-1">
          <style>{ANIMACIONES}</style>
          <nav className="flex flex-col items-center gap-1.5 py-4">
            {menuItems.map((item) => {
              const isActive = item.children
                ? pathname.startsWith(item.href)
                : pathname === item.href;
              const href = item.children ? item.children[0]?.href ?? item.href : item.href;
              const claseIcono = cn(
                "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 active:scale-95",
                isActive
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
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
                    <HoverCardContent side="right" align="start" sideOffset={10} className="w-64 overflow-hidden rounded-xl p-0 shadow-xl">
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
                        {item.children.flatMap((sub) => sub.children ? [
                          { ...sub, esTitulo: true },
                          ...sub.children.map((n) => ({ ...n, esTitulo: false })),
                        ] : [{ ...sub, esTitulo: false }]).map((sub) => {
                          if (sub.esTitulo) {
                            return (
                              <div key={`grupo-${sub.id}`} className="mt-1.5 flex items-center gap-2 px-2.5 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
                                <sub.icon className="h-3.5 w-3.5" />
                                {sub.title}
                              </div>
                            );
                          }
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
      <style>{ANIMACIONES}</style>
      <nav className="grid gap-1 px-3 py-3">
        <p className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Menú</p>
        {menuItems.map((item, i) => {
          const activo = item.children ? pathname.startsWith(item.href) : pathname === item.href;
          const estaAbierto = !!item.children && abierto === item.title;
          return (
            <div key={item.id} style={entrada(i)}>
              {item.children ? (
                /* ───── padre con sub‑menú ───── */
                <button
                  type="button"
                  onClick={() => toggleItem(item.title)}
                  aria-expanded={estaAbierto}
                  className={cn(FILA, activo ? FILA_ACTIVA : FILA_NORMAL)}
                >
                  <span className={cn(CHAPA, activo ? CHAPA_ACTIVA : CHAPA_NORMAL)}>
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="relative z-[1] flex-1 truncate text-left">{item.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      activo ? "text-white/80" : "text-slate-400",
                      estaAbierto ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={activo ? "page" : undefined}
                  className={cn(FILA, activo ? FILA_ACTIVA : FILA_NORMAL)}
                >
                  <span className={cn(CHAPA, activo ? CHAPA_ACTIVA : CHAPA_NORMAL)}>
                    <item.icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="relative z-[1] flex-1 truncate">{item.title}</span>
                </Link>
              )}

              {/* sub‑items */}
              {item.children && estaAbierto && (
                <div className={GUIA}>
                  {item.children.map((sub) => sub.children ? (
                    /* ───── grupo (tercer nivel) ───── */
                    <div key={sub.id} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => toggleGrupo(sub.id)}
                        aria-expanded={grupoAbierto(sub)}
                        className={cn(
                          "group flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors duration-200",
                          sub.children.some((n) => n.href === pathname)
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-500 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2 text-left">
                          <sub.icon className="h-4 w-4 shrink-0" />
                          <span className="leading-tight">{sub.title}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">{sub.children.length}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", grupoAbierto(sub) ? "rotate-180" : "rotate-0")} />
                        </span>
                      </button>
                      {grupoAbierto(sub) && (
                        <div className="ml-[9px] flex flex-col gap-0.5 border-l border-slate-200 pl-3 dark:border-white/10 [animation:nav-abre_.24s_ease-out_both]">
                          {sub.children.map((nieto) => (
                            <Link
                              key={nieto.id}
                              href={nieto.href}
                              onClick={onNavigate}
                              aria-current={pathname === nieto.href ? "page" : undefined}
                              className={cn(HIJO, pathname === nieto.href ? HIJO_ACTIVO : HIJO_NORMAL)}
                            >
                              <nieto.icon className="h-4 w-4 shrink-0" />
                              <span>{nieto.title}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={sub.id}
                      href={sub.href}
                      onClick={onNavigate}
                      aria-current={pathname === sub.href ? "page" : undefined}
                      className={cn(HIJO, pathname === sub.href ? HIJO_ACTIVO : HIJO_NORMAL)}
                    >
                      <sub.icon className="h-4 w-4 shrink-0" />
                      <span>{sub.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </ScrollArea>
  );
}
