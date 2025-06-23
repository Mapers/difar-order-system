import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { TrendingUp } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ICurrentScales, IProduct, ISelectedProduct } from '@/interface/order/product-interface'


interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentScales: ICurrentScales | null,
  products: IProduct[],
  setSelectedProducts: React.Dispatch<React.SetStateAction<ISelectedProduct[]>>
  addProductToList: (appliedScale?: any) => void;
  currency: string
}

const ModalEscale: React.FC<ModalVerificationProps> = ({
  open,
  onOpenChange,
  currentScales,
  products,
  setSelectedProducts,
  addProductToList,
  currency
}) => {
  const [selectedScales, setSelectedScales] = useState<string[]>([])


  const toggleEscalaSelection = (id: string) => {
    console.log(">>id: ", id);
    setSelectedScales((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    )
  }

  const handleConfirmScale = () => {
    onOpenChange(false)
    addProductToList()
    // const selectedScaleData = currentScales.escalas.find((s: any) => s.IdArticulo === selectedScales)
    // addProductToList(selectedScaleData)
    if (currentScales && selectedScales.length > 0) {
      selectedScales.forEach((scaleId) => {
        const escale = currentScales.escalas.find((b: any) => b.IdArticulo === scaleId)
        if (escale) {
          const escaleProducto = products.find((p: any) => p.Codigo_Art === escale.IdArticulo)
          if (escaleProducto) {
            setTimeout(() => {
              setSelectedProducts((prev: any) => [
                ...prev,
                {
                  product: escaleProducto,
                  quantity: escale.minimo,
                  bonificationId: escale.IdArticulo,
                  appliedScale: currentScales.escalaAplicable,
                  finalPrice: escale.maximo,
                },
              ])
            }, 800)
          }
        }
      })
    }
  }
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentScales.escalas.map((escala: any, index: number) => {
                        const isApplicable =
                          currentScales.cantidadSolicitada >= escala.minimo &&
                          currentScales.cantidadSolicitada <= escala.maximo
                        const isRecommended = escala.IdArticulo === currentScales.escalaAplicable?.IdArticulo

                        return (
                          <tr
                            key={escala.IdArticulo}
                            className={`cursor-pointer transition-colors ${selectedScales === escala.IdArticulo
                              ? "bg-purple-50 border-purple-200"
                              : isApplicable
                                ? "bg-green-50 hover:bg-green-100"
                                : "hover:bg-gray-50"
                              } ${!isApplicable ? "opacity-60" : ""}`}
                            onClick={() => toggleEscalaSelection(escala.IdArticulo)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="escala"
                                  checked={selectedScales === escala.IdArticulo}
                                  onChange={() => toggleEscalaSelection(escala.IdArticulo)}
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
                              {escala.Descripcion}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col">
                                <span className="line-through text-gray-400 text-xs">
                                  {`${currency} ${escala.precio_contado_actual}`}
                                </span>
                                <span className={`font-medium ${escala.descuento > 0 ? "text-purple-600" : ""}`}>
                                  {`${currency} ${Number(escala.precio_escala).toFixed(2)}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {Number(escala.porcentaje_descuento) > 0 ? (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  {Number(escala?.porcentaje_descuento).toFixed(2)}%
                                </Badge>
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

              {selectedScales.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                  <h5 className="font-medium text-purple-800 mb-2 text-sm">Escala seleccionada:</h5>

                  {selectedScales.map((escaleId) => {
                    const escala = currentScales.escalas.find(
                      (e: any) => e.IdArticulo === escaleId
                    );

                    if (!escala) return null;
                    return (
                      <div
                        key={escala.IdArticulo}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <Label className="text-xs text-purple-600">Rango</Label>
                          <p className="font-medium">{escala?.Descripcion}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-purple-600">Precio Unitario</Label>
                          <p className="font-medium">{`${currency} ${escala?.precio_escala}`}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-purple-600">Total a Pagar</Label>
                          <p className="font-bold text-purple-700">
                            {`${currency} ${currentScales.cantidadSolicitada * Number(escala?.precio_escala)}`}
                          </p>
                        </div>
                      </div>
                    )
                  })}

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
            disabled={!selectedScales}
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
