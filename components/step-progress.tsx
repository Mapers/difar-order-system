"use client"

import { cn } from "@/lib/utils"
import { Check, LucideIcon } from "lucide-react"

interface Step {
    label: string
    icon: LucideIcon
}

interface StepProgressProps {
    steps: Step[]
    currentStep: number
    onStepClick?: (step: number) => void
}

export function StepProgress({ steps, currentStep, onStepClick }: StepProgressProps) {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between relative z-10">
                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div
                                className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200 bg-white",
                                    isCompleted
                                        ? "border-blue-600 bg-blue-600 text-white" // Completado
                                        : isCurrent
                                            ? "border-blue-600 text-blue-600" // Actual
                                            : "border-gray-300 text-gray-400", // Futuro
                                )}
                                onClick={() => {
                                    if (onStepClick && isCompleted) {
                                        onStepClick(index)
                                    }
                                }}
                                style={{ cursor: onStepClick && isCompleted ? "pointer" : "default" }}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <Icon className="h-5 w-5" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    "mt-2 text-xs font-medium transition-colors duration-200",
                                    isCurrent ? "text-blue-600" : "text-gray-500",
                                )}
                            >
                {step.label}
              </span>
                        </div>
                    )
                })}
            </div>

            <div className="relative -top-9 mx-auto w-[85%]">
                <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 bg-gray-200" />
                <div
                    className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-blue-600 transition-all duration-300 ease-in-out"
                    style={{
                        width: `${(currentStep / (steps.length - 1)) * 100}%`
                    }}
                />
            </div>
        </div>
    )
}