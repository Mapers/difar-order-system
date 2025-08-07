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
import { SmsCheck, SmsSend, UserLoginDTO } from "@/app/services/auth/types"
import { AuthService } from "@/app/services/auth/AuthService"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

export function LoginForm() {
  const { signin, sendDni, errors } = useAuth();
  const router = useRouter()
  const [dni, setDni] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [showVerification, setShowVerification] = useState(false)
  const [loading, setLoading] = useState(false)

  // useEffect(() => {
  //   // Si el usuario viene del onboarding, mostrar un mensaje de bienvenida
  //   const fromOnboarding = sessionStorage.getItem("from_onboarding")
  //   if (fromOnboarding) {
  //     sessionStorage.removeItem("from_onboarding")
  //     // Aquí podrías mostrar un toast de bienvenida o alguna animación
  //   }
  // }, [])

  const handleDniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData: UserLoginDTO = { dni };
      const numTelefono = await sendDni(formData);
      if (numTelefono) {
        const smsSend: SmsSend = {
          dni: dni,
          telefono: numTelefono,
        };
        const resInsert = await AuthService.insertToken(smsSend);
        if (resInsert.success) {
          setShowVerification(true);
          setVerificationCode(["", "", "", "", "", ""]);
        }
      }
    } catch (error: any) {
      console.error(error);
      setShowVerification(true);
      setVerificationCode(["", "", "", "", "", ""]);
    }
    finally {
      setLoading(false);
    }
  };


  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const smsCheck: SmsCheck = {
        dni,
        codigo: verificationCode.join('')
      }
      const response = await signin(smsCheck)

      if (response && response?.success) {
        router.push("/dashboard")
      }
      if (!response?.success) {
        toast({ title: "Validación Código", description: response.message, variant: "warning" })
        setVerificationCode(["", "", "", "", "", ""]);
        (document.getElementById("code-0") as HTMLInputElement)?.focus();
        setLoading(false);
      }
    } catch (error) {
      console.error(error)
    }
    finally {

      setLoading(false);
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode]
      newCode[index] = value
      setVerificationCode(newCode)
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-60 h-24 mb-2 relative">
          <Image
            src="/difar-logo.png"
            alt="Logo difar"
            fill
            style={{ objectFit: 'contain' }}
            sizes="130px"
          />
        </div>
        <p className="text-gray-500 mt-2">Sistema de Gestión de Pedidos</p>
      </div>

      <Card className="w-full border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl -z-10"></div>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-2xl text-center font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {showVerification ? "Verificación" : "Iniciar Sesión"}
          </CardTitle>
          <CardDescription className="text-center">
            {showVerification ? "Ingrese el código de verificación" : "Ingrese su DNI para continuar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showVerification ? (
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
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Enviando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Enviar código
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="verification-code" className="text-gray-700 text-center">
                    Código de verificación
                  </Label>
                  <div className="flex justify-center gap-2 mt-2">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        className="w-12 h-14 text-center text-lg font-bold bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2">Se ha enviado un código a su dispositivo</p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verificando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Verificar
                      <Lock className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-gray-500">Sistema seguro de gestión de pedidos</p>
        </CardFooter>
      </Card>
    </div>
  )
}

















