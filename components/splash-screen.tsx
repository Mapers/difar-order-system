"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function SplashScreen() {
  const router = useRouter()
  const [opacity, setOpacity] = useState(0)
  const [scale, setScale] = useState(0.8)

  useEffect(() => {
    // Animación de entrada
    const animationTimeout = setTimeout(() => {
      setOpacity(1)
      setScale(1)
    }, 100)

    // Verificar si es la primera vez
    const checkFirstTime = () => {
      const firstTime = localStorage.getItem("first_time") === null

      // Redirigir después de 3 segundos
      setTimeout(() => {
        if (firstTime) {
          router.push("/onboarding")
        } else {
          router.push("/")
        }
      }, 3000)
    }

    // Ejecutar verificación después de la animación
    const redirectTimeout = setTimeout(checkFirstTime, 500)

    return () => {
      clearTimeout(animationTimeout)
      clearTimeout(redirectTimeout)
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600">
      <div
        className="flex flex-col items-center justify-center transition-all duration-1000 ease-out"
        style={{ opacity, transform: `scale(${scale})` }}
      >
        <div className="mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-white p-5 shadow-lg">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-4PCl6Z3X7LC9rMlLj2kiXPe5RImE88.png"
            alt="DIFAR CHIMBOTE"
            width={120}
            height={60}
            className="object-contain"
          />
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-wider text-white">DIFAR CHIMBOTE</h1>
        <p className="text-white/70">Sistema de Gestión de Pedidos</p>

        <div className="mt-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        </div>
      </div>
    </div>
  )
}

