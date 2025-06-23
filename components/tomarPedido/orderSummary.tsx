import React from 'react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react'

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const OrderSummary: React.FC<ModalVerificationProps> = ({ open, onOpenChange }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tomar Pedido</h1>
        <p className="text-sm sm:text-base text-gray-600">Revisa y confirma los detalles del pedido</p>
      </div>

      {/* Steps - Responsive */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between space-x-2 sm:space-x-4">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-600">Cliente</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-600">Condiciones</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-600">Productos</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                4
              </div>
              <span className="text-xs sm:text-sm font-medium text-blue-600">Resumen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary Card */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle className="text-lg sm:text-xl text-blue-600 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Resumen del Pedido
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">{currentDate}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Client Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Información del Cliente</h3>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Cliente</Label>
                    <p className="font-medium text-sm sm:text-base">{cliente.nombre}</p>
                    <p className="text-xs text-gray-500">Documento: {cliente.documento}</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <Label className="text-xs text-gray-500">Teléfono</Label>
                      <p className="text-sm">{cliente.telefono}</p>
                    </div>
                  </div>

                  {cliente.contactoPedido && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <Label className="text-xs text-gray-500">Contacto para el Pedido</Label>
                        <p className="text-sm">{cliente.contactoPedido}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                    <div>
                      <Label className="text-xs text-gray-500">Dirección de Entrega</Label>
                      <p className="text-sm">{cliente.direccion}</p>
                      {cliente.referenciaDireccion && (
                        <p className="text-xs text-gray-600 mt-1">Ref: {cliente.referenciaDireccion}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div>
                      <Label className="text-xs text-gray-500">Zona</Label>
                      <p className="text-sm">
                        {cliente.zona.nombre} - {cliente.zona.provincia}
                      </p>
                      <p className="text-xs text-gray-600">{cliente.zona.departamento}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Conditions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Condiciones de Pago</h3>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <Label className="text-xs text-gray-500">Condición</Label>
                    <p className="font-medium text-sm">{condicionesPago.condicionLabel}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <Label className="text-xs text-gray-500">Moneda</Label>
                    <p className="font-medium text-sm">{condicionesPago.monedaLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Productos Seleccionados</h3>
            </div>

            {/* Mobile View - Cards */}
            <div className="block sm:hidden space-y-3">
              {productosSeleccionados.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.isBonification && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                              Bonificado
                            </Badge>
                          )}
                          {item.appliedScale && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                              Escala {item.appliedScale.descuento}% desc.
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm truncate">{item.product.nombreItem}</h4>
                        <p className="text-xs text-gray-500">Código: {item.product.codigo}</p>
                        <p className="text-xs text-gray-500">{item.product.laboratorio}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">Cantidad</Label>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Precio Unit.</Label>
                        <div className="flex flex-col">
                          {item.appliedScale && (
                            <span className="line-through text-gray-400 text-xs">
                              {condicionesPago.simbolo}
                              {item.product.precio.toFixed(2)}
                            </span>
                          )}
                          <span
                            className={
                              item.appliedScale
                                ? "text-purple-600 font-medium text-xs"
                                : item.isBonification
                                  ? "text-green-600 text-xs"
                                  : "text-xs"
                            }
                          >
                            {condicionesPago.simbolo}
                            {item.isBonification ? "0.00" : (item.finalPrice || item.product.precio).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Subtotal</Label>
                        <p className="font-bold text-sm">
                          {condicionesPago.simbolo}
                          {((item.finalPrice || item.product.precio) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Código
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Producto
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Laboratorio
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Cantidad
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Precio Unit.
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productosSeleccionados.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product.codigo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            {item.isBonification && (
                              <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-700">
                                Bonificado
                              </Badge>
                            )}
                            {item.appliedScale && (
                              <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700">
                                Escala {item.appliedScale.descuento}% desc.
                              </Badge>
                            )}
                            {item.product.nombreItem}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {item.product.laboratorio}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            {item.appliedScale && (
                              <span className="line-through text-gray-400 text-xs">
                                {condicionesPago.simbolo}
                                {item.product.precio.toFixed(2)}
                              </span>
                            )}
                            <span
                              className={
                                item.appliedScale
                                  ? "text-purple-600 font-medium"
                                  : item.isBonification
                                    ? "text-green-600"
                                    : ""
                              }
                            >
                              {condicionesPago.simbolo}
                              {item.isBonification ? "0.00" : (item.finalPrice || item.product.precio).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {condicionesPago.simbolo}
                          {((item.finalPrice || item.product.precio) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Totals - Responsive */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">
                    {condicionesPago.simbolo}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">IGV (18%):</span>
                  <span className="text-sm font-medium">
                    {condicionesPago.simbolo}
                    {impuesto.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-blue-700">
                    {condicionesPago.simbolo}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div className="space-y-2">
              <Label htmlFor="orderNote" className="text-sm font-medium">
                Notas del Pedido (Opcional)
              </Label>
              <Textarea
                id="orderNote"
                placeholder="Agregar instrucciones especiales o comentarios para este pedido..."
                className="h-24"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-0">
          <Button
            variant="outline"
            className="w-full sm:w-auto order-2 sm:order-1"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
            onClick={() => setShowConfirmDialog(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Confirmar y Registrar Pedido
          </Button>
        </CardFooter>
      </Card>
    </div>

    {/* Confirmation Dialog */}
    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">¿Confirmar Pedido?</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-gray-600 mb-4">
            ¿Estás seguro de que deseas registrar este pedido para{" "}
            <span className="font-medium">{cliente.nombre}</span>?
          </p>
          <div className="bg-blue-50 p-3 rounded-md text-center">
            <p className="text-sm font-medium">
              Total a pagar:{" "}
              <span className="text-blue-700">
                {condicionesPago.simbolo}
                {total.toFixed(2)}
              </span>
            </p>
            <p className="text-xs text-gray-600 mt-1">Condición: {condicionesPago.condicionLabel}</p>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmOrder}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Success Dialog */}
    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
      <DialogContent className="sm:max-w-md">
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Pedido Registrado!</h2>
          <p className="text-center text-gray-600 mb-4">Tu pedido ha sido registrado exitosamente.</p>
          <div className="bg-gray-50 p-4 rounded-md w-full mb-4">
            <p className="text-center">
              <span className="text-sm text-gray-500">Número de Pedido:</span>
              <br />
              <span className="text-lg font-bold text-blue-700">{orderNumber}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => (window.location.href = "/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Inicio
            </Button>
            {/* Componente mejorado con vista previa */}
            <ReceiptGenerator orderData={receiptData} buttonLabel="Ver Comprobante" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  )
}

export default OrderSummary
