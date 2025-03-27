import type React from "react"
import { SideNav } from "@/components/side-nav"
import { MobileNav } from "@/components/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <SideNav />
      <MobileNav />
      <div className="flex-1 p-4 pt-20 md:p-8 md:pl-72 md:pt-8">{children}</div>
    </div>
  )
}

