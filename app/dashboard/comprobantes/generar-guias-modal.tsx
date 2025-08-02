'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Truck } from "lucide-react"
import {Pedido} from "@/app/dashboard/comprobantes/page";

interface GenerarGuiasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido | null
  isProcessing: boolean
  onGenerarGuias: () => Promise<void>
}

export function GenerarGuiasModal({
                                    open,
                                    onOpenChange,
                                    pedido,
                                    isProcessing,
                                    onGenerarGuias
                                  }: GenerarGuiasModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Generar Guías de Remisión
          </DialogTitle>
        </DialogHeader>

        {pedido && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Datos del Pedido</h4>
              <div className="text-sm space-y-1">
                <p><strong>Pedido:</strong> {pedido.nroPedido}</p>
                <p><strong>Cliente:</strong> {pedido.nombreCliente}</p>
                <p><strong>Documento:</strong> {pedido.codigoCliente}</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>¿Confirmas la generación de guías?</strong>
                <br/>
                Se generará la guía de remisión electrónica para este pedido.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={onGenerarGuias}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Truck className="mr-2 h-4 w-4" />
                Generar Guías
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}