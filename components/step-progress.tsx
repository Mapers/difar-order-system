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
    const progress = (currentStep / (steps.length - 1)) * 100

    return (
        <div className="w-full overflow-hidden">
            {/* Relative container so the line sits behind the circles */}
            <div className="relative flex items-start justify-between">

                {/* Background line */}
                <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4 sm:mx-5" />
                {/* Progress line */}
                <div
                    className="absolute top-4 sm:top-5 left-4 sm:left-5 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
                    style={{ width: `calc(${progress}% - ${progress > 0 ? '2rem' : '0px'})` }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                        <div
                            key={index}
                            className="relative z-10 flex flex-col items-center flex-1 min-w-0"
                        >
                            <div
                                className={cn(
                                    "flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-200 shrink-0",
                                    isCompleted
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : isCurrent
                                            ? "border-blue-600 bg-white dark:bg-gray-800 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500",
                                )}
                                onClick={() => {
                                    if (onStepClick && isCompleted) onStepClick(index)
                                }}
                                style={{ cursor: onStepClick && isCompleted ? "pointer" : "default" }}
                            >
                                {isCompleted
                                    ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                }
                            </div>
                            <span
                                className={cn(
                                    "mt-1.5 text-[10px] sm:text-xs font-medium text-center w-full px-0.5 leading-tight",
                                    isCurrent
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-500 dark:text-gray-400",
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
