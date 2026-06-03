'use client'

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SideNav } from "@/components/side-nav"
import { MobileNav } from "@/components/mobile-nav"
import { TopBar } from "@/components/layout/TopBar"
import { NotificationArrivalModal } from "@/components/notifications/NotificationArrivalModal"
import { useAuth } from "@/context/authContext"

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const { isAuthenticated, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, loading, router])

    return (
        <div className="flex min-h-screen bg-gradient-to-br">
            <SideNav />
            <MobileNav />
            <div className="flex-1 md:pl-72">
                <TopBar />
                <div className="p-4 pt-20 md:p-8 md:pt-8">{children}</div>
            </div>

            <NotificationArrivalModal />
        </div>
    )
}
