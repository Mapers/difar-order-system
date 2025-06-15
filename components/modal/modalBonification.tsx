import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, } from "@/components/ui/dialog"
import { Gift } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { IBonificado } from '@/interface/order/client-interface'


interface ModalBonificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBonification: any
}

const ModalBonification: React.FC<ModalBonificationProps> = ({ open, onOpenChange, currentBonification }) => {
  const [selectedBonifications, setSelectedBonifications] = useState<string[]>([])
  const [selectedProduct, setSelectedProduct] = useState<IBonificado[] | null>(null)
  const toggleBonificationSelection = (id: string) => {
    setSelectedBonifications((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    )
  }

  const handleConfirmBonification = () => {
    console.log("Bonificaciones aplicadas:", selectedBonifications)
    onOpenChange(false)
    setSelectedBonifications([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            Bonificaciones Disponibles
          </DialogTitle>
        </DialogHeader>

        {currentBonification && (
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                    ¡Este producto tiene bonificaciones disponibles!
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Por la compra de{" "}
                    <span className="font-medium">{currentBonification.cantidadSolicitada} unidades</span> de{" "}
                    <span className="font-medium">{currentBonification.nombreProductoSolicitado}</span> puedes obtener
                    las siguientes bonificaciones:
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Producto Solicitado</Label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-sm">{currentBonification.nombreProductoSolicitado}</p>
                  <p className="text-xs text-gray-500">Código: {currentBonification.productoSolicitado}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Cantidad Solicitada</Label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-sm">{currentBonification.cantidadSolicitada} unidades</p>
                </div>
              </div>
            </div>

            <Separator className="mb-4 sm:mb-6" />

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                <Gift className="h-4 w-4 text-yellow-600" />
                Selecciona las bonificaciones que deseas aplicar:
              </h4>

              <div className="grid gap-3 sm:gap-4">
                {currentBonification.bonificaciones.map((bonificacion: any, index: any) => (
                  <div
                    key={bonificacion.index}
                    className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${selectedBonifications.includes(bonificacion.id)
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => toggleBonificationSelection(bonificacion.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center h-5 shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedBonifications.includes(bonificacion.id)}
                          onChange={() => toggleBonificationSelection(bonificacion.id)}
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                          <h5 className="font-medium text-gray-900 text-sm">Bonificación #{index + 1}</h5>
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs w-fit">
                            {bonificacion.TotalBonificados} unidades gratis
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3">
                          <div>
                            <Label className="text-xs text-gray-500">Producto Bonificado</Label>
                            <p className="font-medium text-xs sm:text-sm">{bonificacion.NombreItem}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Presentación</Label>
                            <p className="font-medium text-xs sm:text-sm">{bonificacion.Presentacion}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Principio Activo</Label>
                            <p className="font-medium text-xs sm:text-sm">{bonificacion.PrincipioActivo}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Precio</Label>
                            <p className="font-medium text-xs sm:text-sm text-green-600">
                              ${bonificacion.PrecioBonificado}
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <Label className="text-xs text-gray-500">Condición</Label>
                              <p className="font-medium">{`Por cada ${bonificacion.condicion} unidades compradas`}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Cantidad por Unidad</Label>
                              <p className="font-medium">{Number(bonificacion.CantidadBonificadaPorUnidad)}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Veces que Bonifica</Label>
                              <p className="font-medium">{bonificacion.VecesBonifica}</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedBonifications.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <h5 className="font-medium text-green-800 mb-2 text-sm">
                    Resumen de bonificaciones seleccionadas:
                  </h5>
                  <div className="space-y-2">
                    {selectedBonifications.map((bonificationId) => {
                      const bonificacion = currentBonification.bonificaciones.find(
                        (b: any) => b.id === bonificationId
                      )
                      return (
                        <div key={bonificationId} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="truncate flex-1 mr-2">{bonificacion?.nombreItem}</span>
                          <Badge variant="outline" className="bg-green-100 text-green-700 text-xs shrink-0">
                            +{bonificacion?.totalBonificados} unidades
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmBonification}
            className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto"
            disabled={selectedBonifications.length === 0}
          >
            <Gift className="mr-2 h-4 w-4" />
            Aplicar Bonificaciones ({selectedBonifications.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalBonification
