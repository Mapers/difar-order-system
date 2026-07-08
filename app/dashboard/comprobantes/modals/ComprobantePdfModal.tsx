"use client"

import { useEffect, useState } from "react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { PdfViewerModal } from "./PdfViewerModal"

interface ComprobantePdfModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Número de comprobante concatenado, ej. "F001-00012553" */
    numeroComprobante: string
    fileName?: string
}

export function ComprobantePdfModal({ open, onOpenChange, numeroComprobante, fileName }: ComprobantePdfModalProps) {
    const [pdfUrl, setPdfUrl] = useState("")

    useEffect(() => {
        if (!open) {
            setPdfUrl("")
            return
        }

        const [serie, numero] = numeroComprobante.split("-")

        if (!serie || !numero) {
            toast({ title: "Error", description: `Número de comprobante inválido: ${numeroComprobante}`, variant: "destructive" })
            onOpenChange(false)
            return
        }

        const fetchPdf = async () => {
            try {
                const res = await apiClient.get(
                    `/pedidos/pdfPorComprobante?serie=${serie}&numero=${numero}`
                )
                const { enlace, enlace_pdf } = res.data.data

                if (enlace) {
                    setPdfUrl(enlace)
                } else if (enlace_pdf) {
                    setPdfUrl(`data:application/pdf;base64,${enlace_pdf}`)
                } else {
                    toast({ title: "Sin visualización", description: "Este comprobante no tiene visualización disponible", variant: "destructive" })
                    onOpenChange(false)
                }
            } catch (error) {
                toast({ title: "Sin visualización", description: "Este comprobante no tiene visualización disponible", variant: "destructive" })
                onOpenChange(false)
            }
        }

        fetchPdf()
    }, [open, numeroComprobante])

    return (
        <PdfViewerModal
            open={open}
            onOpenChange={onOpenChange}
            pdfUrl={pdfUrl}
            fileName={fileName ?? `${numeroComprobante}.pdf`}
        />
    )
}
