"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, ShoppingCart, Users, Home, LogOut, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SideNav() {
  const pathname = usePathname()

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
  ]

  return (
    <div className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-white shadow-sm md:flex">
      <div className="flex h-20 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4PCl6Z3X7LC9rMlLj2kiXPe5RImE88.png"
            alt="DIFAR CHIMBOTE"
            width={120}
            height={60}
            className="object-contain"
          />
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
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
                  pathname === item.href ? "text-white" : "text-gray-500 group-hover:text-blue-600",
                )}
              />
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        <Link href="/">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </Link>
      </div>
    </div>
  )
}

