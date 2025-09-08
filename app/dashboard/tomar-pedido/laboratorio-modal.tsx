'use client'

import {IProduct, ISelectedProduct} from "@/interface/order/product-interface";
import {IMoneda} from "@/interface/order/client-interface";
import {useState} from "react";
import {TableBody, TableCell, TableHeader, TableRow, Table, TableHead} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const LaboratorioModal = ({
                                   open,
                                   onOpenChange,
                                   laboratorio,
                                   products,
                                   onAddTempProduct,
                                   tempSelectedProducts,
                                   onRemoveTempProduct,
                                   onConfirmSelection,
                                   currency
                                 }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laboratorio: string;
  products: IProduct[];
  onAddTempProduct: (product: IProduct, quantity: number, priceType: 'contado' | 'credito') => void;
  tempSelectedProducts: ISelectedProduct[];
  onRemoveTempProduct: (index: number) => void;
  onConfirmSelection: () => void;
  currency: IMoneda | null;
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [priceTypes, setPriceTypes] = useState<Record<string, 'contado' | 'credito'>>({});

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value > 0 ? value : 1
    }));
  };

  const handlePriceTypeChange = (productId: string, value: 'contado' | 'credito') => {
    setPriceTypes(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const formatPrice = (price: number) => {
    return `${currency?.value === "PEN" ? "S/." : "$$"}${price.toFixed(2)}`;
  };

  const labProducts = products.filter(p => p.Descripcion === laboratorio);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Productos de {laboratorio}</DialogTitle>
          <DialogDescription>
            Selecciona las cantidades y tipo de precio para cada producto
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          <div className="lg:col-span-2 overflow-y-auto">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="w-40">Precio</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labProducts.map((product) => {
                    const currentPriceType = priceTypes[product.Codigo_Art] || 'contado';
                    const contadoPrice = Number(product.PUContado);
                    const creditoPrice = Number(product.PUCredito);

                    return (
                      <TableRow key={product.Codigo_Art}>
                        <TableCell>
                          <div className="font-medium">{product.NombreItem}</div>
                          <div className="text-sm text-gray-500">{product.Codigo_Art}</div>
                          {/*{product.Descripcion}*/}
                        </TableCell>
                        <TableCell>{product.Stock}</TableCell>
                        <TableCell>
                          <RadioGroup
                            value={currentPriceType}
                            onValueChange={(value: 'contado' | 'credito') =>
                              handlePriceTypeChange(product.Codigo_Art, value)
                            }
                            className="flex flex-col gap-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="contado" id={`${product.Codigo_Art}-contado`} />
                              <Label htmlFor={`${product.Codigo_Art}-contado`} className="text-sm cursor-pointer">
                                Contado: {formatPrice(contadoPrice)}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="credito" id={`${product.Codigo_Art}-credito`} />
                              <Label htmlFor={`${product.Codigo_Art}-credito`} className="text-sm cursor-pointer">
                                Crédito: {formatPrice(creditoPrice)}
                              </Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={quantities[product.Codigo_Art] || 1}
                            onChange={(e) => handleQuantityChange(
                              product.Codigo_Art,
                              parseInt(e.target.value) || 1
                            )}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => onAddTempProduct(
                              product,
                              quantities[product.Codigo_Art] || 1,
                              currentPriceType
                            )}
                          >
                            Agregar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="lg:col-span-1 overflow-y-auto">
            <div className="rounded-md border p-4">
              <h3 className="font-semibold mb-4">Resumen de selección</h3>
              {tempSelectedProducts.length === 0 ? (
                <p className="text-sm text-gray-500">No hay productos seleccionados</p>
              ) : (
                <div className="space-y-4">
                  {tempSelectedProducts.map((item, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.product.NombreItem}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() => onRemoveTempProduct(index)}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Precio:
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{item.quantity} unidades</span>
                        <span>
                          {formatPrice(item.finalPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>
                        {formatPrice(tempSelectedProducts.reduce(
                          (sum, item) => sum + (item.finalPrice * item.quantity),
                          0
                        ))}
                      </span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={onConfirmSelection}
                    >
                      Confirmar selección
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};