"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  Home,
  Users,
  Tags,
  Package,
  ShoppingCart,
  FileText,
  GitBranch, Receipt, BarChart2, LineChart, UserCog, Notebook
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { NavItem, NAV_ITEMS, Role } from "@/constants/roles";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {ScrollArea} from "@/components/ui/scroll-area";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": Home,
  "/dashboard/clientes": Users,
  "/dashboard/lista-precios-lote": Tags,
  "/dashboard/productos": Package,
  "/dashboard/tomar-pedido": ShoppingCart,
  "/dashboard/mis-pedidos": FileText,
  "/dashboard/estados-pedidos": GitBranch,
  "/dashboard/comprobantes": Receipt,
  "/dashboard/reportes": BarChart2,
  "/dashboard/reportes/documento-cliente": LineChart,
  "/dashboard/reportes/cobrar-cliente": LineChart,
  "/dashboard/reportes/cobrar-vendedor": LineChart,
  "/dashboard/usuarios": UserCog,
  "/dashboard/roles": Notebook,
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const { user, logout } = useAuth();

  /* ───────── estructuración de menús ───────── */
  const menuItems = useMemo(() => {
    if (!user?.menus || user.menus.length === 0) return [];

    // Convertir la lista plana de menús en una estructura jerárquica
    const rootMenus = user.menus.filter(menu => !menu.id_padre);
    const childMenus = user.menus.filter(menu => menu.id_padre);

    return rootMenus.map(menu => {
      const children = childMenus
        .filter(child => child.id_padre === menu.id)
        .map(child => ({
          id: child.id,
          title: child.nombre,
          href: child.ruta,
          icon: ICON_MAP[child.ruta] || LineChart,
        }));

      return {
        id: menu.id,
        title: menu.nombre,
        href: menu.ruta,
        icon: ICON_MAP[menu.ruta] || Home,
        children: children.length > 0 ? children : undefined,
      };
    });
  }, [user?.menus]);

  const toggleItem = (title: string) =>
    setOpenItem((prev) => (prev === title ? null : title));

  const handleNav = () => setOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="/difar-logo.png"
          alt="Logo difar"
          width={80}
          height={40}
          className="object-contain"
        />
      </Link>

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0">
          {/* Header dentro del drawer */}
          <DialogTitle asChild>
            <VisuallyHidden>Menú de navegación</VisuallyHidden>
          </DialogTitle>
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNav}>
              <Image
                src="/difar-logo.png"
                alt="Logo difar"
                width={80}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Navegación */}
          <ScrollArea className="flex-1 py-4">
            <nav className="grid gap-1 px-2">
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
                          key={sub.id}
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
              <LogOut className="h-4 w-4"/>
              Cerrar sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
