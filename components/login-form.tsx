"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Lock, User, ArrowRight, Delete } from "lucide-react"
import { useAuth } from "@/context/authContext"
import { SmsCheck, SmsSend, UserLoginDTO, VendedorRelacionUnico } from "@/app/services/auth/types"
import { AuthService } from "@/app/services/auth/AuthService"
import { decodeToken } from "@/app/utils/tokenUtils"
import { RoleEntryModal } from "@/components/auth/RoleEntryModal"
import Image from "next/image"
import { toast } from "@/app/hooks/useToast"

export function LoginForm() {
  const { signin, sendDni, ingresarComoVendedor, clearPendingRoleSelection, errors } = useAuth();
  const router = useRouter()
  const [dni, setDni] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [showVerification, setShowVerification] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const [vendedorRelacion, setVendedorRelacion] = useState<VendedorRelacionUnico | null>(null)

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
        const token = localStorage.getItem("token")
        const { user } = decodeToken(token)
        if (user?.idRepresentante && user?.vendedorRelacion?.idVendedor) {
          setVendedorRelacion(user.vendedorRelacion)
          setShowRoleModal(true)
        } else {
          router.push("/dashboard")
        }
      }
      if (!response?.success) {
        toast({ title: "Validación Código", description: response.message, variant: "warning" })
        setVerificationCode(["", "", "", "", "", ""]);
        (document.getElementById("code-0") as HTMLInputElement)?.focus();
      }
    } catch (error) {
      console.error(error)
    }
    finally {

      setLoading(false);
    }
  }

  const handleEntrarComoRepresentante = () => {
    setShowRoleModal(false)
    clearPendingRoleSelection()
    router.push("/dashboard")
  }

  const handleEntrarComoVendedor = async () => {
    setRoleLoading(true)
    const ok = await ingresarComoVendedor()
    setRoleLoading(false)
    if (ok) {
      setShowRoleModal(false)
      router.push("/dashboard")
    } else {
      toast({ title: "Ingreso como vendedor", description: "No se pudo ingresar como vendedor.", variant: "warning" })
    }
  }

  /**
   * El foco se mueve fuera del ciclo de render: llamarlo dentro del updater
   * de setState lo ejecutaria durante el render, y en modo estricto ademas
   * dos veces. queueMicrotask lo deja para justo despues, ya con el DOM al día.
   */
  const enfocarCasilla = (index: number) => {
    queueMicrotask(() => document.getElementById(`code-${index}`)?.focus());
  }

  /**
   * Las casillas son readOnly para que el teclado del dispositivo no se abra
   * encima del teclado virtual, asi que no hay onChange. Un input readOnly
   * igual recibe eventos de teclado, y de ahi sale el soporte para teclado
   * fisico en escritorio.
   */
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handleTecladoDigito(e.key);
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      handleTecladoBorrar();
    }
    // Enter, Tab y flechas siguen con su comportamiento normal.
  }

  // Los dos handlers usan la forma funcional del setState a proposito: en
  // tactil es facil pulsar dos teclas dentro del mismo tick, React agrupa las
  // actualizaciones y leer `verificationCode` del closure haria que la segunda
  // pulsacion pise el digito de la primera en vez de avanzar.

  /** Escribe el dígito en la primera casilla vacía. Si ya están las 6, no hace nada. */
  const handleTecladoDigito = (digito: string) => {
    setVerificationCode(prev => {
      const destino = prev.findIndex(d => d === '');
      if (destino === -1) return prev;
      const newCode = [...prev];
      newCode[destino] = digito;
      enfocarCasilla(Math.min(destino + 1, 5));
      return newCode;
    });
  }

  /** Borra la última casilla con contenido. */
  const handleTecladoBorrar = () => {
    setVerificationCode(prev => {
      const ultima = prev.reduce((acc, d, i) => (d !== '' ? i : acc), -1);
      if (ultima === -1) return prev;
      const newCode = [...prev];
      newCode[ultima] = '';
      enfocarCasilla(ultima);
      return newCode;
    });
  }

  const handleTecladoLimpiar = () => {
    setVerificationCode(["", "", "", "", "", ""]);
    enfocarCasilla(0);
  }

  const codigoIncompleto = verificationCode.some(d => d === '');

  return (
    <>
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
        <p className="text-muted-foreground mt-2">Sistema de Gestión de Pedidos</p>
      </div>

      <Card className="w-full border-0 shadow-xl bg-card/90 backdrop-blur-sm">
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
                  <Label htmlFor="dni" className="text-foreground">
                    DNI
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="dni"
                      placeholder="Ingrese su DNI"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      required
                      maxLength={8}
                      pattern="[0-9]{8}"
                      className="pl-10 text-center text-lg h-12 bg-background border-border focus:border-blue-500 focus:ring-blue-500"
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
                  <Label htmlFor="verification-code" className="text-foreground text-center">
                    Código de verificación
                  </Label>
                  <div className="flex justify-center gap-2 mt-2">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="none"
                        maxLength={1}
                        value={digit}
                        readOnly
                        onKeyDown={handleCodeKeyDown}
                        className="w-12 h-14 text-center text-lg font-bold bg-background border-border focus:border-blue-500 focus:ring-blue-500 caret-transparent cursor-default"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">Se ha enviado un código a su dispositivo</p>

                  {/* Teclado numérico: type="button" en todos, si no cada tecla envía el formulario. */}
                  <div className="mx-auto mt-4 grid w-full max-w-[260px] grid-cols-3 gap-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digito => (
                      <Button
                        key={digito}
                        type="button"
                        variant="outline"
                        onClick={() => handleTecladoDigito(digito)}
                        className="h-14 text-xl font-semibold bg-background hover:bg-muted active:scale-95 transition-transform"
                      >
                        {digito}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTecladoLimpiar}
                      className="h-14 text-sm font-semibold bg-background text-muted-foreground hover:bg-muted active:scale-95 transition-transform"
                    >
                      Limpiar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleTecladoDigito('0')}
                      className="h-14 text-xl font-semibold bg-background hover:bg-muted active:scale-95 transition-transform"
                    >
                      0
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTecladoBorrar}
                      aria-label="Borrar"
                      className="h-14 bg-background text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 active:scale-95 transition-transform"
                    >
                      <Delete className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                  disabled={loading || codigoIncompleto}
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
          <p className="text-sm text-muted-foreground">Sistema seguro de gestión de pedidos</p>
        </CardFooter>
      </Card>
    </div>

    <RoleEntryModal
      open={showRoleModal}
      vendedorRelacion={vendedorRelacion}
      loading={roleLoading}
      onSelectRepresentante={handleEntrarComoRepresentante}
      onSelectVendedor={handleEntrarComoVendedor}
    />
    </>
  )
}

















