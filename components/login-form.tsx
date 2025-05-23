"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Lock, User, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { toast } from "@/hooks/use-toast"

export function LoginForm() {
  const router = useRouter()
  const { signin, loading, errors } = useAuth()
  const [dni, setDni] = useState("")
  const [password, setPassword] = useState("")

  const [loadingLogin, setLoadingLogin] = useState(false)

  useEffect(() => {
    // Si el usuario viene del onboarding, mostrar un mensaje de bienvenida
    const fromOnboarding = sessionStorage.getItem("from_onboarding")
    if (fromOnboarding) {
      sessionStorage.removeItem("from_onboarding")
      // Aquí podrías mostrar un toast de bienvenida o alguna animación
    }
  }, [])

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoadingLogin(true)
      const formData = { dni, password }
      const response = await signin(formData);
      if (response?.status === 200) {
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.log("errror:", error);
      const message = error.response?.data.error.message
      console.log("> message error signin:", message);
    }
    finally {
      setLoadingLogin(false)
    }

  }
  useEffect(() => {
    if (errors.length > 0) {
      errors.forEach(err => {
        toast({ title: "Iniciar Sesión", description: err, variant: "error" })
      });
    }
  }, [errors]);


  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-4 shadow-lg">
          <ShoppingCart className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          DIFAR CHIMBOTE
        </h1>
        <p className="text-gray-500 mt-2">Sistema de Gestión de Pedidos</p>
      </div>

      <Card className="w-full border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl -z-10"></div>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-center">
            Ingrese su DNI para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDniSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dni" className="text-gray-700">
                  DNI
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="dni"
                    placeholder="Ingrese su DNI"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    required
                    maxLength={8}
                    pattern="[0-9]{8}"
                    className="pl-10 text-center text-lg h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />

                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Ingrese su Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 text-center text-lg h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loadingLogin ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Iniciar sesión
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-gray-500">Sistema seguro de gestión de pedidos</p>
        </CardFooter>
      </Card>
    </div>
  )
}

