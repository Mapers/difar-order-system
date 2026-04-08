import React from 'react'
import { Badge, Calendar, Coins, CreditCard, DollarSign, MapPin, Package, Phone, Table, User } from 'lucide-react'
import { CardContent } from '../ui/card'
import { Label } from 'recharts'
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from 'react-day-picker'

interface ModalVerificationProps {
  selectedClient: any
  contactoPedido: any
  nameZone: any
  condition:any
  currency:any
}

const OrderSummary: React.FC<ModalVerificationProps> = ({ selectedClient, contactoPedido, nameZone, condition, currency, selectedProducts }) => {
  return (
    <CardContent className="space-y-6 pt-6">
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
                <p className="font-medium text-sm sm:text-base">{selectedClient?.Nombre}</p>
                <p className="text-xs text-gray-500">Documento: doc nro</p>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Teléfono</Label>
                  <p className="text-sm">{selectedClient?.telefono ?? '+52 ---------'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Contacto para el Pedido</Label>
                  <p className="text-sm">{contactoPedido ?? '-----'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Dirección de Entrega</Label>
                  <p className="text-sm">{selectedClient?.Dirección ?? 'test direccion entrega ----'}</p>
                  {selectedClient?.referenciaDireccion && (
                    <p className="text-xs text-gray-600 mt-1">Ref: {selectedClient.referenciaDireccion}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <Label className="text-xs text-gray-500">Zona</Label>
                  <p className="text-sm">
                    {nameZone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* condiciones de pago */}
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
                <p className="font-medium text-sm"> {condition?.Descripcion}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              {currency?.value === "PEN" ? (
                <Coins className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <DollarSign className="w-4 h-4 text-green-600 mt-0.5" />
              )}
              <div>
                <Label className="text-xs text-gray-500">Moneda</Label>
                <p className="font-medium text-sm">{currency?.label}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Productos Seleccionados</h3>
        </div>
        {/* <h3 className="text-lg font-medium text-gray-900">Productos</h3> */}
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProducts.map((item, index) => {
                const precioOriginal = item.product.PUContado;
                const precioEscala = item.appliedScale?.precio_escala;
                const precioUnitario = item.isBonification ? 0 : precioEscala ?? precioOriginal;
                const subtotal = precioUnitario * item.quantity;
                return (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center flex-wrap gap-1">
                        {item.isBonification && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            Bonificado
                          </Badge>
                        )}
                        {item.appliedScale && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            Escala {item.appliedScale.porcentaje_descuento}% desc.
                          </Badge>
                        )}
                        <span>{item.product.NombreItem}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {item.quantity}
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div className="flex flex-col items-end">
                        <span className={item.appliedScale ? "line-through text-gray-400 text-xs" : ""}>
                          {currency?.value === "PEN" ? "S/." : "$"}
                          {Number(precioOriginal).toFixed(2)}
                        </span>
                        {item.appliedScale && (
                          <span className="text-purple-600 font-medium text-sm">
                            {currency?.value === "PEN" ? "S/." : "$"}
                            {Number(precioEscala).toFixed(2)}
                          </span>
                        )}
                        {item.isBonification && (
                          <span className="text-green-600 text-sm">{currency?.value === "PEN" ? "S/." : "$"}0.00</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {currency?.value === "PEN" ? "S/." : "$"}
                      {subtotal.toFixed(2)}
                    </TableCell>

                    <TableCell className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}></TableCell>
                <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                  SubTotal:
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                  {currency?.value === "PEN" ? "S/." : "$"}
                  {calcularSubtotal(selectedProducts).toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3}></TableCell>
                <TableCell className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                  IGV (18%):
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                  {currency?.value === "PEN" ? "S/." : "$"}
                  {calcularIGV(selectedProducts).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      <div className="rounded-lg bg-blue-50 p-4 flex justify-between items-center">
        <div className="text-lg font-medium text-blue-900">Total del Pedido:</div>
        <div className="text-xl font-bold text-blue-900">
          {currency?.value === "PEN" ? "S/." : "$"} {calcularTotal(selectedProducts).toFixed(2)}
        </div>
      </div>
    </CardContent>
  )
}

export default OrderSummary
