"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepProgressProps {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                index < currentStep
                  ? "border-blue-600 bg-blue-600 text-white"
                  : index === currentStep
                    ? "border-blue-600 text-blue-600"
                    : "border-gray-300 text-gray-400",
              )}
              onClick={() => {
                if (onStepClick && index < currentStep) {
                  onStepClick(index)
                }
              }}
              style={{ cursor: onStepClick && index < currentStep ? "pointer" : "default" }}
            >
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span className={cn("mt-2 text-xs", index === currentStep ? "font-medium text-blue-600" : "text-gray-500")}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex w-full items-center">
        {steps.map((_, index) => {
          if (index === steps.length - 1) return null
          return (
            <div
              key={index}
              className={cn("h-1 flex-1 transition-colors", index < currentStep ? "bg-blue-600" : "bg-gray-200")}
            />
          )
        })}
      </div>
    </div>
  )
}

