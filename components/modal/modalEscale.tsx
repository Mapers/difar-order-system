import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Badge, Loader2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button' // Corrige aquí la importación del botón
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface Escala {
  id: number
  descripcion: string
  minimo: number
  maximo: number
  precio: number
  descuento: number
  ahorro: number
}

interface Producto {
  codigo: string
  precio: number
}

interface CurrentScales {
  cantidadSolicitada: number
  nombreProductoSolicitado: string
  productoSolicitado: string
  escalaAplicable?: Escala
  escalas: Escala[]
}

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentScales?: CurrentScales
  productos: Producto[]
  handleConfirmScale: () => void
}

const ModalEscale: React.FC<ModalVerificationProps> = ({
  open,
  onOpenChange,
  currentScales,
  productos,
  handleConfirmScale,
}) => {
  const [selectedScale, setSelectedScale] = useState<number | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            ¡Este producto tiene escalas disponibles!
          </DialogTitle>
        </DialogHeader>

        {currentScales && (
          <div className="py-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-full shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                    ¡Este producto tiene escalas de precios!
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Para <span className="font-medium">{currentScales.cantidadSolicitada} unidades</span> de{" "}
                    <span className="font-medium">{currentScales.nombreProductoSolicitado}</span>, puedes obtener
                    mejores precios según la cantidad:
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Producto Solicitado</Label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-sm">{currentScales.nombreProductoSolicitado}</p>
                  <p className="text-xs text-gray-500">Código: {currentScales.productoSolicitado}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Cantidad Solicitada</Label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-sm">{currentScales.cantidadSolicitada} unidades</p>
                </div>
              </div>
            </div>

            <Separator className="mb-4 sm:mb-6" />

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Selecciona las escalas que deseas aplicar:
              </h4>

              {/* Mobile View - Cards */}
              <div className="block sm:hidden space-y-3">
                {currentScales.escalas.map((escala: any, index: number) => {
                  const isApplicable =
                    currentScales.cantidadSolicitada >= escala.minimo &&
                    currentScales.cantidadSolicitada <= escala.maximo
                  const isRecommended = escala.id === currentScales.escalaAplicable?.id
                  const totalSavings = escala.ahorro * currentScales.cantidadSolicitada

                  return (
                    <div
                      key={escala.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${selectedScale === escala.id
                        ? "border-purple-500 bg-purple-50"
                        : isApplicable
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                        } ${!isApplicable ? "opacity-60" : ""}`}
                      onClick={() => isApplicable && setSelectedScale(escala.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center h-5 shrink-0">
                          <input
                            type="radio"
                            name="escala"
                            checked={selectedScale === escala.id}
                            onChange={() => setSelectedScale(escala.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                            disabled={!isApplicable}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-2 mb-3">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900 text-sm">{escala.descripcion}</h5>
                              {isRecommended && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                  Recomendado
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Precio Unitario:</span>
                              <div className="text-right">
                                {escala.descuento > 0 && (
                                  <span className="line-through text-gray-400 text-xs block">
                                    $
                                    {productos
                                      .find((p) => p.codigo === currentScales.productoSolicitado)
                                      ?.precio.toFixed(2)}
                                  </span>
                                )}
                                <span
                                  className={`font-medium text-sm ${escala.descuento > 0 ? "text-purple-600" : ""}`}
                                >
                                  ${escala.precio.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {escala.descuento > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Descuento:</span>
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                                  {escala.descuento.toFixed(1)}%
                                </Badge>
                              </div>
                            )}

                            {totalSavings > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Ahorro Total:</span>
                                <span className="text-green-600 font-bold text-sm">${totalSavings.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-hidden border border-gray-200 rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Seleccionar
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Rango de Cantidad
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Precio Unitario
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Descuento
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ahorro por Unidad
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ahorro Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentScales.escalas.map((escala: any, index: number) => {
                        const isApplicable =
                          currentScales.cantidadSolicitada >= escala.minimo &&
                          currentScales.cantidadSolicitada <= escala.maximo
                        const isRecommended = escala.id === currentScales.escalaAplicable?.id
                        const totalSavings = escala.ahorro * currentScales.cantidadSolicitada

                        return (
                          <tr
                            key={escala.id}
                            className={`cursor-pointer transition-colors ${selectedScale === escala.id
                              ? "bg-purple-50 border-purple-200"
                              : isApplicable
                                ? "bg-green-50 hover:bg-green-100"
                                : "hover:bg-gray-50"
                              } ${!isApplicable ? "opacity-60" : ""}`}
                            onClick={() => isApplicable && setSelectedScale(escala.id)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="escala"
                                  checked={selectedScale === escala.id}
                                  onChange={() => setSelectedScale(escala.id)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                  disabled={!isApplicable}
                                />
                                {isRecommended && (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 text-xs">
                                    Recomendado
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {escala.descripcion}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                {escala.descuento > 0 && (
                                  <span className="line-through text-gray-400 text-xs">
                                    $
                                    {productos
                                      .find((p) => p.codigo === currentScales.productoSolicitado)
                                      ?.precio.toFixed(2)}
                                  </span>
                                )}
                                <span className={`font-medium ${escala.descuento > 0 ? "text-purple-600" : ""}`}>
                                  ${escala.precio.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {escala.descuento > 0 ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  {escala.descuento.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {escala.ahorro > 0 ? (
                                <span className="text-green-600 font-medium">${escala.ahorro.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {totalSavings > 0 ? (
                                <span className="text-green-600 font-bold">${totalSavings.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedScale && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                  <h5 className="font-medium text-purple-800 mb-2 text-sm">Escala seleccionada:</h5>
                  {(() => {
                    const selectedScaleData = currentScales.escalas.find((s: any) => s.id === selectedScale)
                    const totalPrice = selectedScaleData.precio * currentScales.cantidadSolicitada
                    const originalPrice =
                      productos.find((p) => p.codigo === currentScales.productoSolicitado)?.precio || 0
                    const originalTotal = originalPrice * currentScales.cantidadSolicitada
                    const totalSavings = originalTotal - totalPrice

                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <Label className="text-xs text-purple-600">Rango</Label>
                          <p className="font-medium">{selectedScaleData.descripcion}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-purple-600">Precio Unitario</Label>
                          <p className="font-medium">${selectedScaleData.precio.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-purple-600">Total a Pagar</Label>
                          <p className="font-bold text-purple-700">${totalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-purple-600">Ahorro Total</Label>
                          <p className="font-bold text-green-600">${totalSavings.toFixed(2)}</p>
                        </div>
                      </div>
                    )
                  })()}
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
            onClick={handleConfirmScale}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
            disabled={!selectedScale}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Aplicar Escala
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ModalEscale
