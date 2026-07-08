"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ComprobantePdfModal } from "@/app/dashboard/comprobantes/modals/ComprobantePdfModal"

interface DocumentoPdfLinkProps {
    /** Número de comprobante concatenado, ej. "F001-00012553". */
    numeroComprobante?: string | null
    className?: string
    fallback?: React.ReactNode
}

export function DocumentoPdfLink({ numeroComprobante, className, fallback = "-" }: DocumentoPdfLinkProps) {
    const [open, setOpen] = useState(false)

    if (!numeroComprobante || !numeroComprobante.includes("-")) {
        return <>{fallback}</>
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={cn("text-blue-700 hover:text-blue-900 hover:underline cursor-pointer", className)}
            >
                {numeroComprobante}
            </button>
            <ComprobantePdfModal
                open={open}
                onOpenChange={setOpen}
                numeroComprobante={numeroComprobante}
            />
        </>
    )
}
