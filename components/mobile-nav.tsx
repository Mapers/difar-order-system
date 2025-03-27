"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, ShoppingCart, Users, Home, Menu, X, LogOut, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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
              <Link
                key={item.href}
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
                    pathname === item.href ? "text-white" : "text-gray-500 group-hover:text-blue-600",
                  )}
                />
                {item.title}
              </Link>
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

