"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  ShoppingCart,
  Users,
  Home,
  Menu,
  X,
  LogOut,
  FileText,
  BarChart2,
  LineChart,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [openItem, setOpenItem] = useState<string | null>(null)

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Clientes",
      href: "/dashboard/clientes",
      icon: Users,
    },
    {
      title: "Productos",
      href: "/dashboard/productos",
      icon: Package,
    },
    {
      title: "Tomar Pedido",
      href: "/dashboard/pedido",
      icon: ShoppingCart,
    },
    {
      title: "Mis Pedidos",
      href: "/dashboard/mis-pedidos",
      icon: FileText,
    },
    {
      title: "Reportes",
      href: "/dashboard/reportes",
      icon: BarChart2,
      children: [
        {
          title: "Consulta Documento Cliente",
          href: "/dashboard/reportes/documento-cliente",
          icon: LineChart,
        },
        {
          title: "Consulta Cobrar Cliente",
          href: "/dashboard/reportes/cobrar-cliente",
          icon: LineChart,
        },
        {
          title: "Consulta Cobrar Vendedor",
          href: "/dashboard/reportes/cobrar-vendedor",
          icon: LineChart,
        },
      ],
    },
  ]

  const toggleItem = (title: string) => {
    setOpenItem((prev) => (prev === title ? null : title))
  }

  return (
    <div className="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4PCl6Z3X7LC9rMlLj2kiXPe5RImE88.png"
          alt="DIFAR CHIMBOTE"
          width={100}
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
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4PCl6Z3X7LC9rMlLj2kiXPe5RImE88.png"
                alt="DIFAR CHIMBOTE"
                width={100}
                height={40}
                className="object-contain"
              />
            </Link>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <nav className="grid gap-1 p-4">
            {navItems.map((item) => (
              <div key={item.href}>
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
                    onClick={() => setOpen(false)}
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

                {item.children && openItem === item.title && (
                  <div className="ml-8 mt-1 flex flex-col gap-1">
                    {item.children.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-blue-50",
                          pathname === subItem.href
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:text-blue-700",
                        )}
                      >
                        <subItem.icon
                          className={cn(
                            "h-4 w-4",
                            pathname === subItem.href
                              ? "text-blue-700"
                              : "text-gray-400 group-hover:text-blue-600",
                          )}
                        />
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link href="/" onClick={() => setOpen(false)}>
              <Button
                variant="outline"
                className="mt-4 w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
