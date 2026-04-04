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
    const n = steps.length
    // The center of the first circle is at (1/(2n)) of the total width,
    // and the center of the last circle is at (1 - 1/(2n)).
    // The background line spans between these two centers.
    const firstCenterPct = 100 / (2 * n)
    const lineSpanPct = 100 - 100 / n // distance between first and last center
    const progressPct = n > 1 ? (currentStep / (n - 1)) * lineSpanPct : 0

    return (
        <div className="w-full">
            <div
                className="relative grid w-full"
                style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
            >
                {/* Background track — from first circle center to last circle center */}
                <div
                    className="absolute h-0.5 bg-gray-200 dark:bg-gray-700 pointer-events-none"
                    style={{
                        top: '16px',
                        left: `${firstCenterPct}%`,
                        right: `${firstCenterPct}%`,
                    }}
                />

                {/* Progress fill */}
                <div
                    className="absolute h-0.5 bg-blue-600 transition-all duration-300 ease-in-out pointer-events-none"
                    style={{
                        top: '16px',
                        left: `${firstCenterPct}%`,
                        width: `${progressPct}%`,
                    }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                        <div key={index} className="relative z-10 flex flex-col items-center pb-1">
                            {/* Circle */}
                            <div
                                role={onStepClick && isCompleted ? "button" : undefined}
                                tabIndex={onStepClick && isCompleted ? 0 : undefined}
                                onClick={() => onStepClick && isCompleted && onStepClick(index)}
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 shrink-0",
                                    isCompleted
                                        ? "border-blue-600 bg-blue-600 cursor-pointer"
                                        : isCurrent
                                            ? "border-blue-600 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400"
                                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default",
                                )}
                            >
                                {isCompleted
                                    ? <Check className="h-3.5 w-3.5 text-white" />
                                    : <Icon className="h-3.5 w-3.5" />
                                }
                            </div>

                            {/* Label */}
                            <span
                                className={cn(
                                    "mt-1.5 text-[10px] font-medium text-center leading-tight w-full",
                                    isCurrent
                                        ? "text-blue-600 dark:text-blue-400"
                                        : isCompleted
                                            ? "text-blue-500 dark:text-blue-400"
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
