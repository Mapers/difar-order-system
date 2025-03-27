"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si debemos mostrar el splash screen
    const lastVisit = localStorage.getItem("last_visit")
    const currentTime = new Date().getTime()

    // Si no hay visita previa o han pasado más de 24 horas
    if (!lastVisit || currentTime - Number.parseInt(lastVisit) > 24 * 60 * 60 * 1000) {
      localStorage.setItem("last_visit", currentTime.toString())
      router.push("/splash")
      return
    }

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="absolute inset-0 bg-grid-blue-500/[0.05] -z-10"></div>
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-3/4 h-3/4 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  )
}

