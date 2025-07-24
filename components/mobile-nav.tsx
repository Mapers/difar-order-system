"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/authContext";
import { NavItem, NAV_ITEMS, Role } from "@/constants/roles";
import { DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);

  /* ───────── auth & filtrado ───────── */
  const { user, logout } = useAuth();
  const itemsForRole = useMemo<NavItem[]>(() => {
    if (!user) return [];
    const role = user.rolDescripcion as Role;
    return NAV_ITEMS.filter((i) => i.roles.includes(role));
  }, [user]);

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
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={handleNav}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>

          {/* Navegación */}
          <nav className="grid gap-1 p-4">
            {itemsForRole.map((item) => (
              <div key={item.href}>
                {/* Con submenú */}
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
                  /* Ítem simple */
                  <Link
                    href={item.href}
                    onClick={handleNav}
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

                {/* Sub‑ítems */}
                {item.children && openItem === item.title && (
                  <div className="ml-8 mt-1 flex flex-col gap-1">
                    {item.children.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={handleNav}
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

            {/* Cerrar sesión */}
            <Button
              variant="outline"
              onClick={() => {
                logout();
                handleNav();
              }}
              className="mt-4 w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
