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
  GitBranch, Receipt, BarChart2, LineChart, UserCog, Notebook, Gift, Map, Settings, User
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { NavItem, NAV_ITEMS, Role } from "@/constants/roles";
import { DialogTitle as RadixDialogTitle } from "@radix-ui/react-dialog";
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
  "/dashboard/escalas-bonificaciones": Gift,
  "/dashboard/ruta-semanal": Map,
  "/dashboard/configuraciones": Settings,
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user, logout } = useAuth();

  const menuItems = useMemo(() => {
    if (!user?.menus || user.menus.length === 0) return [];

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

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setOpen(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleInteractOutside = (event: any) => {
    event.preventDefault();
  };

  const handleEscapeKey = (event: any) => {
    event.preventDefault();
  };

  return (
      <>
        <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
                src="/difar-logo.png"
                alt="Logo difar"
                width={80}
                height={40}
                className="object-contain"
            />
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <RadixDialogTitle asChild>
                <VisuallyHidden>Menú de navegación</VisuallyHidden>
              </RadixDialogTitle>
              <div className="flex flex-col items-center border-b px-4 pt-4 pb-2 gap-2">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image
                      src="/difar-logo.png"
                      alt="Logo difar"
                      width={120}
                      height={60}
                      className="object-contain"
                  />
                </Link>
                <div className="w-full rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-2 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 shadow-inner">
                      <User className="h-6 w-6 text-blue-700" />
                    </div>

                    <div className="flex-1 min-w-0">
                  <span style={{fontSize: '12px'}}>
                    {user?.nombreCompleto || "Usuario"}
                  </span>
                      <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {user?.rolDescripcion || "Sin rol"}
                  </span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-xs text-gray-400 font-mono">
                    {user?.codigo || "N/A"}
                  </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <nav className="grid gap-1 px-2 py-4">
                  {menuItems.map((item) => (
                      <div key={item.id}>
                        {item.children ? (
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
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-blue-100",
                                    pathname === item.href
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                                        : "text-gray-700 hover:text-blue-700",
                                )}
                                onClick={handleNav}
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
                                      onClick={handleNav}
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

              <div className="border-t p-4 shrink-0">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogoutClick}
                >
                  <LogOut className="h-4 w-4"/>
                  Cerrar sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent
              className="sm:max-w-md"
              onInteractOutside={handleInteractOutside}
              onEscapeKeyDown={handleEscapeKey}
          >
            <DialogHeader>
              <DialogTitle>Confirmar cierre de sesión</DialogTitle>
              <DialogDescription>
                ¿Está seguro que desea cerrar su sesión actual?
              </DialogDescription>
            </DialogHeader>

            <div className="text-center py-4">
              <div className="text-3xl font-bold text-orange-500 mb-2">
                <LogOut className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Será redirigido a la página de inicio de sesión
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancelLogout}>
                Cancelar
              </Button>
              <Button
                  onClick={handleConfirmLogout}
                  className="bg-red-600 hover:bg-red-700"
              >
                Cerrar sesión
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
  );
}