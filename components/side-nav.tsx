"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  Home,
  LogOut,
  FileText,
  BarChart2,
  LineChart,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/authContext";
import { AuthService } from "@/app/services/auth/AuthService";

export function SideNav() {
  const pathname = usePathname();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const { logout, user } = useAuth();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Mapeo de iconos recibidos a componentes React
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
  };

  // Renderizado recursivo del menú
  const renderMenu = (items: any[]) =>
    items.map((item) => {
      const Icon = iconMap[item.icono] || Home; // Icono por defecto

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
          {loading ? (
            <p className="text-center text-gray-500">Cargando menú...</p>
          ) : (
            renderMenu(menuItems)
          )}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}