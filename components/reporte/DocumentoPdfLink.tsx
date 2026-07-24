"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ComprobantePdfModal } from "@/app/dashboard/comprobantes/modals/ComprobantePdfModal"

interface DocumentoPdfLinkProps {
    /** Número de comprobante concatenado, ej. "F001-00012553". */
    numeroComprobante?: string | null
    className?: string
    fallback?: React.ReactNode
    /**
     * Indica si el documento existe en vta_comprobante_sunat (tiene PDF).
     * Si es false, se muestra el número como texto plano, sin link.
     * Default true para no romper usos que no lo pasen.
     */
    existeComprobante?: boolean
}

export function DocumentoPdfLink({ numeroComprobante, className, fallback = "-", existeComprobante = true }: DocumentoPdfLinkProps) {
    const [open, setOpen] = useState(false)

    if (!numeroComprobante || !numeroComprobante.includes("-")) {
        return <>{fallback}</>
    }

    // Hay número pero el comprobante no existe (no tiene PDF) → texto plano, sin link.
    if (!existeComprobante) {
        return <span className={className}>{numeroComprobante}</span>
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
