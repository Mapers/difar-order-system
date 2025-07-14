'use client'

import React, { useState, useEffect } from 'react'
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'
import { Save, X, FileText } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { TabsContent } from '@/components/ui/tabs'
import { fetchCreateEvaluationDocument } from '@/app/api/clients'

/* ─── Tipos ──────────────────────────────────────────────────────────── */
interface DocumentoData {
    codCliente: string
    tipoId: number
    detalle: string
    observaciones: string
}

interface DireccionTecnicaData {
    autorizacion: DocumentoData
    situacion: DocumentoData
    registro: DocumentoData
    certificaciones: DocumentoData
}

interface DireccionTecnicaProps {
    codClient: string              // ← vuelve a ser prop obligatoria
    onClose: () => void
    initialData: DireccionTecnicaData
}

/* ─── Utilidad: copia con nuevo código ───────────────────────────────── */
const withCodigo = (doc: DocumentoData, codCliente: string): DocumentoData => ({
    ...doc,
    codCliente,
})

const sameContent = (a: DocumentoData, b: DocumentoData) =>
    a.detalle === b.detalle && a.observaciones === b.observaciones

/* ─── Componente ─────────────────────────────────────────────────────── */
const TabDireccionTecnica: React.FC<DireccionTecnicaProps> = ({
    codClient,
    onClose,
    initialData,
}) => {
    /* Estado local inicializado con el código correcto */
    const [autorizacion, setAutorizacion] = useState(() =>
        withCodigo(initialData.autorizacion, codClient),
    )
    const [situacion, setSituacion] = useState(() =>
        withCodigo(initialData.situacion, codClient),
    )
    const [registro, setRegistro] = useState(() =>
        withCodigo(initialData.registro, codClient),
    )
    const [certificaciones, setCertificaciones] = useState(() =>
        withCodigo(initialData.certificaciones, codClient),
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    /* Si cambian los props, refresca el estado (p.e. abres otro cliente) */
    useEffect(() => {
        setAutorizacion(withCodigo(initialData.autorizacion, codClient))
        setSituacion(withCodigo(initialData.situacion, codClient))
        setRegistro(withCodigo(initialData.registro, codClient))
        setCertificaciones(withCodigo(initialData.certificaciones, codClient))
    }, [codClient, initialData])

    /* ------------------------------------------------------------------ */
    const handleSaveAll = async () => {
        setIsSubmitting(true)
        try {
            const queue: Promise<any>[] = []

            const pushIfChanged = (curr: DocumentoData, base: DocumentoData) => {
                if (!sameContent(curr, base)) queue.push(fetchCreateEvaluationDocument(curr))
            }

            pushIfChanged(autorizacion, initialData.autorizacion)
            pushIfChanged(situacion, initialData.situacion)
            pushIfChanged(registro, initialData.registro)
            pushIfChanged(certificaciones, initialData.certificaciones)

            if (queue.length === 0) {
                toast({ title: 'Sin cambios', description: 'No hay nada que guardar', variant: 'warning' })
                setIsSubmitting(false)
                return
            }

            const results = await Promise.all(queue)
            const ok = results.filter(r => r.status === 201 && r.data?.success).length

            if (ok === queue.length) {
                toast({ title: 'Éxito', description: 'Documentos actualizados', variant: 'success' })
                onClose()
            } else {
                toast({ title: 'Atención', description: 'Algunos documentos no se actualizaron', variant: 'warning' })
            }
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar', variant: 'error' })
        } finally {
            setIsSubmitting(false)
        }
    }

    /* ------------------------------------------------------------------ */
    const renderCard = (
        doc: DocumentoData,
        set: React.Dispatch<React.SetStateAction<DocumentoData>>,
        title: string,
        color: 'blue' | 'green' | 'yellow' | 'purple',
    ) => (
        <Card className={`bg-${color}-50 border-${color}-200`}>
            <CardHeader className="pb-3">
                <CardTitle className={`text-sm font-medium text-${color}-900`}>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Detalle</Label>
                        <Input
                            placeholder="Detalle"
                            value={doc.detalle}
                            onChange={e => set({ ...doc, detalle: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea
                            placeholder="Observaciones"
                            rows={2}
                            value={doc.observaciones}
                            onChange={e => set({ ...doc, observaciones: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    /* ------------------------------------------------------------------ */
    return (
        <TabsContent value="direccion-tecnica" className="space-y-6 mt-6">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Documentación Obligatoria
            </h4>

            {renderCard(autorizacion, setAutorizacion, 'N° Resolución Directoral de Autorización Sanitaria', 'blue')}
            {renderCard(situacion, setSituacion, 'Situación de Funcionamiento', 'green')}
            {renderCard(registro, setRegistro, 'Número de Registro', 'yellow')}
            {renderCard(certificaciones, setCertificaciones, 'Certificaciones', 'purple')}

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                </Button>
                <Button
                    onClick={handleSaveAll}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Guardando…
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </DialogFooter>
        </TabsContent>
    )
}

export default TabDireccionTecnica
