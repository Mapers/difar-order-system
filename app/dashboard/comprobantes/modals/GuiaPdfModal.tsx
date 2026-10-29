"use client"

import { useEffect, useState } from "react"
import apiClient from "@/app/api/client"
import { toast } from "@/app/hooks/useToast"
import { PdfViewerModal } from "./PdfViewerModal"

interface GuiaPdfModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    idGuiaRemCab: number | null
    fileName?: string
}

export function GuiaPdfModal({ open, onOpenChange, idGuiaRemCab, fileName }: GuiaPdfModalProps) {
    const [pdfUrl, setPdfUrl] = useState("")

    useEffect(() => {
        if (!open) {
            setPdfUrl("")
            return
        }
        if (!idGuiaRemCab) {
            onOpenChange(false)
            return
        }

        const fetchPdf = async () => {
            try {
                const res = await apiClient.get(`/pedidos/pdfPorGuia?idGuiaRemCab=${idGuiaRemCab}`)
                const { pdf_zip_base64, estado_sunat } = res.data.data

                if (pdf_zip_base64) {
                    setPdfUrl(`data:application/pdf;base64,${pdf_zip_base64}`)
                } else {
                    toast({
                        title: "PDF todavía no disponible",
                        description: String(estado_sunat ?? '').trim() === '101'
                            ? "SUNAT todavía está procesando la guía. El PDF se guarda solo cuando la acepte; también puedes usar Ver Estado SUNAT dentro de un rato."
                            : "Esta guía no tiene PDF guardado. Prueba con Ver Estado SUNAT.",
                        variant: "destructive",
                    })
                    onOpenChange(false)
                }
            } catch (error) {
                toast({ title: "Sin visualización", description: "No se pudo obtener el PDF de la guía", variant: "destructive" })
                onOpenChange(false)
            }
        }

        fetchPdf()
    }, [open, idGuiaRemCab])

    return (
        <PdfViewerModal
            open={open}
            onOpenChange={onOpenChange}
            pdfUrl={pdfUrl}
            fileName={fileName ?? "guia.pdf"}
        />
    )
}
