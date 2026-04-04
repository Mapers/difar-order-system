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
            <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep
                    const isLast = index === steps.length - 1

                    return (
                        <div key={index} className="relative flex flex-col items-center">
                            {/* Connector line — drawn from center of this circle to center of next */}
                            {!isLast && (
                                <div className="absolute top-4 sm:top-5 left-1/2 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            {!isLast && isCompleted && (
                                <div className="absolute top-4 sm:top-5 left-1/2 right-0 h-0.5 bg-blue-600 transition-all duration-300" />
                            )}

                            {/* Circle */}
                            <div
                                className={cn(
                                    "relative z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-200 shrink-0 bg-white dark:bg-gray-800",
                                    isCompleted
                                        ? "border-blue-600 bg-blue-600 dark:bg-blue-600"
                                        : isCurrent
                                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                            : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500",
                                )}
                                onClick={() => {
                                    if (onStepClick && isCompleted) onStepClick(index)
                                }}
                                style={{ cursor: onStepClick && isCompleted ? "pointer" : "default" }}
                            >
                                {isCompleted
                                    ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                                    : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                }
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "mt-1.5 text-[10px] sm:text-xs font-medium text-center leading-tight px-0.5 w-full",
                                    isCurrent
                                        ? "text-blue-600 dark:text-blue-400"
                                        : isCompleted
                                            ? "text-blue-500 dark:text-blue-500"
                                            : "text-gray-400 dark:text-gray-500",
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
