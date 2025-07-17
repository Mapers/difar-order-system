"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingCart, Users, Home, Menu, X, LogOut, FileText, BarChart2, LineChart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { AuthService } from "@/app/services/auth/AuthService";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"


export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mapeo iconos igual que en SideNav
  const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    "icon-clientes": Users,
    "icon-productos": Package,
    "icon-pedidos": ShoppingCart,
    "icon-dashboard": Home,
    "icon-reportes": BarChart2,
    // Agrega más iconos según tu backend
  };

  useEffect(() => {
    if (!user?.codigo) return;

    setLoading(true);
    AuthService.getMenuByCodVendedor(user.codigo)
      .then((res) => {
        if (res.success) {
          setMenuItems(res.data);
        } else {
          setMenuItems([]);
        }
      })
      .catch(() => setMenuItems([]))
      .finally(() => setLoading(false));
  }, [user?.codigo]);

  const toggleItem = (title: string) => {
    setOpenItem((prev) => (prev === title ? null : title));
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  // Renderizado recursivo para menú y submenús
  const renderMenu = (items: any[]) =>
    items.map((item) => {
      const Icon = iconMap[item.icono] || Home;

      if (item.submenus && item.submenus.length > 0) {
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggleItem(item.nombre)}
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-blue-100",
                pathname.startsWith(item.ruta)
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-gray-700 hover:text-blue-700"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    pathname.startsWith(item.ruta)
                      ? "text-white"
                      : "text-gray-500 group-hover:text-blue-600"
                  )}
                />
                {item.nombre}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  openItem === item.nombre ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
            {openItem === item.nombre && (
              <div className="ml-8 mt-1 flex flex-col gap-1">
                {renderMenu(item.submenus)}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.id}
          href={item.ruta}
          onClick={() => setOpen(false)}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-blue-100",
            pathname === item.ruta
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
              : "text-gray-700 hover:text-blue-700"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              pathname === item.ruta
                ? "text-white"
                : "text-gray-500 group-hover:text-blue-600"
            )}
          />
          {item.nombre}
        </Link>
      );
    });

  return (
    <div className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
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
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <DialogTitle asChild>
            <VisuallyHidden>Menú de navegación</VisuallyHidden>
          </DialogTitle>
          <div className="flex h-16 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <Image
                src="/difar-logo.png"
                alt="Logo difar"
                width={80}
                height={40}
                className="object-contain"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <nav className="grid gap-1 p-4">
            {loading ? (
              <p className="text-center text-gray-500">Cargando menú...</p>
            ) : (
              renderMenu(menuItems)
            )}
            <Button
              variant="outline"
              className="mt-4 w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}