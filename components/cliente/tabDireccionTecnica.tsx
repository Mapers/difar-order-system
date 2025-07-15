'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'
import { Save, X, FileText } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { TabsContent } from '@/components/ui/tabs'
import { ClientMethodsService } from '@/app/dashboard/clientes/services/clientMethodsService'
import { ClientService } from '@/app/services/client/ClientService'
import { Evaluation } from '@/app/dashboard/clientes/types'


interface DireccionTecnicaProps {
    codClient: string
    onClose: () => void
    evaluationClient: any
}

const TabDireccionTecnica: React.FC<DireccionTecnicaProps> = ({
    codClient,
    onClose,
    evaluationClient,
}) => {

    // Estados locales inicializados con datos existentes o vacíos
    const [autorizacion, setAutorizacion] = useState<Evaluation>(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 1));
    const [situacion, setSituacion] = useState<Evaluation>(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 2));
    const [registro, setRegistro] = useState<Evaluation>(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 3));
    const [certificaciones, setCertificaciones] = useState<Evaluation>(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 4));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Actualizar estados si cambian evaluationClient o codClient
    useEffect(() => {
        setAutorizacion(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 1));
        setSituacion(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 2));
        setRegistro(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 3))
        setCertificaciones(ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 4));
    }, [evaluationClient, codClient]);

    // Función para comparar documentos y detectar cambios
    const sameContent = (a: Evaluation, b: Evaluation) =>
        a.detalle === b.detalle && a.observaciones === b.observaciones;

    // Guardar solo documentos modificados
    const handleSaveAll = async () => {
        setIsSubmitting(true);
        try {
            const queue: Promise<any>[] = [];
            const pushIfChanged = (curr: Evaluation, base: Evaluation) => {
                if (!sameContent(curr, base)) {
                    queue.push(ClientService.createUpdateEvaluationDocument(curr));
                }
            };
            // Busca el documento base en evaluationClient para comparar
            const baseAutorizacion = ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 1);
            const baseSituacion = ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 2);
            const baseRegistro = ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 3);
            const baseCertificaciones = ClientMethodsService.findDocByTipeId(codClient, evaluationClient, 4);

            pushIfChanged(autorizacion, baseAutorizacion);
            pushIfChanged(situacion, baseSituacion);
            pushIfChanged(registro, baseRegistro);
            pushIfChanged(certificaciones, baseCertificaciones);

            if (queue.length === 0) {
                toast({ title: 'Sin cambios', description: 'No hay nada que guardar', variant: 'warning' });
                setIsSubmitting(false);
                return;
            }
            const results = await Promise.all(queue);
            const ok = results.filter(r => r.success).length;
            if (ok === queue.length) {
                toast({ title: 'Éxito', description: 'Documentos actualizados', variant: 'success' });
            } else {
                toast({ title: 'Atención', description: 'Algunos documentos no se actualizaron', variant: 'warning' });
            }
        } catch {
            toast({ title: 'Error', description: 'No se pudo guardar', variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Renderizado de cada tarjeta editable
    const renderCard = (
        doc: Evaluation,
        set: React.Dispatch<React.SetStateAction<Evaluation>>,
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
    );

    return (
        <TabsContent value="direccion-tecnica" className="space-y-6 mt-6">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Documentación Obligatoria
            </h4>
            {(!evaluationClient || evaluationClient.length === 0) ? (
                <Card className="bg-yellow-50 border-yellow-200 p-6">
                    <p className="text-yellow-800 font-medium">
                        No existe evaluación para este cliente.
                    </p>
                </Card>
            ) : (
                <>
                    {renderCard(autorizacion, setAutorizacion, 'N° Resolución Directoral de Autorización Sanitaria', 'blue')}
                    {renderCard(situacion, setSituacion, 'Situación de Funcionamiento', 'green')}
                    {renderCard(registro, setRegistro, 'Número de Registro', 'yellow')}
                    {renderCard(certificaciones, setCertificaciones, 'Certificaciones', 'purple')}
                </>
            )}
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
                    disabled={isSubmitting || !evaluationClient || evaluationClient.length === 0}
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
    );
};

export default TabDireccionTecnica;