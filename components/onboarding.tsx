"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, FileText, TabletsIcon as Devices, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Onboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Bienvenido a DIFAR CHIMBOTE",
      description: "Sistema de gestión de pedidos diseñado para optimizar tu trabajo diario.",
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Gestiona tus Pedidos",
      description: "Crea, visualiza y administra pedidos de manera sencilla y eficiente.",
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      title: "Todo en un Solo Lugar",
      description: "Accede a clientes, productos y pedidos desde cualquier dispositivo.",
      icon: Devices,
      color: "bg-purple-500",
    },
  ]

  const completeOnboarding = () => {
    localStorage.setItem("first_time", "false")
    router.push("/")
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Contenido del paso actual */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className={`mb-12 flex h-48 w-48 items-center justify-center rounded-full ${steps[currentStep].color}/10`}>
          {(() => {
            const IconComponent = steps[currentStep].icon
            return <IconComponent className={`h-24 w-24 text-${steps[currentStep].color.split("-")[0]}-500`} />
          })()}
        </div>

        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">{steps[currentStep].title}</h1>
        <p className="max-w-md text-center text-lg text-gray-600">{steps[currentStep].description}</p>
      </div>

      {/* Indicadores y botones */}
      <div className="border-t border-gray-100 bg-white p-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Button variant="ghost" onClick={completeOnboarding}>
            Omitir
          </Button>

          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-blue-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" size="icon" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <Button onClick={nextStep}>
              {currentStep === steps.length - 1 ? "Comenzar" : "Siguiente"}
              {currentStep !== steps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

