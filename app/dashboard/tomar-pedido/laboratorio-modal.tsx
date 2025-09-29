'use client'

import {IProduct, ISelectedProduct} from "@/interface/order/product-interface";
import {IMoneda} from "@/interface/order/client-interface";
import {useEffect, useState} from "react";
import {TableBody, TableCell, TableHeader, TableRow, Table, TableHead} from "@/components/ui/table";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {useLaboratoriesData} from "@/app/dashboard/lista-precios-lote/hooks/useLaboratoriesData";
import {getProductsLabRequest, getProductsRequest} from "@/app/api/products";

export const LaboratorioModal = ({
                                   open,
                                   onOpenChange,
                                   laboratorio,
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
  onAddTempProduct: (product: IProduct, quantity: number, priceType: 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom', customPrice?: number) => void;
  tempSelectedProducts: ISelectedProduct[];
  onRemoveTempProduct: (index: number) => void;
  onConfirmSelection: () => void;
  currency: IMoneda | null;
}) => {
  const { laboratories } = useLaboratoriesData()
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [priceTypes, setPriceTypes] = useState<Record<string, 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom'>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(false)

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value > 0 ? value : 1
    }));
  };

  const handlePriceTypeChange = (productId: string, value: 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom') => {
    setPriceTypes(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleCustomPriceChange = (productId: string, value: number) => {
    setCustomPrices(prev => ({
      ...prev,
      [productId]: value > 0 ? value : 0
    }));
  };

  const formatPrice = (price: number) => {
    return `${currency?.value === "PEN" ? "S/." : "$$"}${price.toFixed(2)}`;
  };

  const getDescriptionById = (id: string) => {
    const lab = laboratories.find((l) => l.IdLineaGe === Number(id))
    return lab ? lab.Descripcion : id.toString()
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await getProductsLabRequest(laboratorio)
        setProducts(response.data?.data?.data || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }
    if (laboratorio.length > 0) {
      fetchProducts()
    }
  }, [laboratorio])

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl">
          <DialogHeader>
            <DialogTitle>Productos de {getDescriptionById(laboratorio)}</DialogTitle>
            <DialogDescription>
              Selecciona las cantidades y tipo de precio para cada producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
            <div className="lg:col-span-2 overflow-y-auto">
              <div className="rounded-md border">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <span className="ml-2">Cargando productos...</span>
                    </div>
                ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No se encontraron productos para este laboratorio
                              </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                              const productId = product.Codigo_Art;
                              const currentPriceType = priceTypes[productId] || 'contado';
                              const contadoPrice = Number(product.PUContado);
                              const creditoPrice = Number(product.PUCredito);
                              const porMayor = Number(product.PUPorMayor);
                              const porMenor = Number(product.PUPorMenor);
                              const customPrice = customPrices[productId] || contadoPrice;

                              return (
                                  <TableRow key={productId}>
                                    <TableCell>
                                      <div className="text-sm">{product.NombreItem}</div>
                                      <div className="text-sm text-gray-500">{productId}</div>
                                    </TableCell>
                                    <TableCell>{product.Stock}</TableCell>
                                    <TableCell>
                                      <RadioGroup
                                          value={currentPriceType}
                                          onValueChange={(value: 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom') =>
                                              handlePriceTypeChange(productId, value)
                                          }
                                          className="flex flex-col gap-2"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="contado" id={`${productId}-contado`}/>
                                          <Label htmlFor={`${productId}-contado`} className="text-sm cursor-pointer">
                                            Contado: {formatPrice(contadoPrice)}
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="credito" id={`${productId}-credito`}/>
                                          <Label htmlFor={`${productId}-credito`} className="text-sm cursor-pointer">
                                            Crédito: {formatPrice(creditoPrice)}
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="porMayor" id={`${productId}-porMayor`}/>
                                          <Label htmlFor={`${productId}-porMayor`} className="text-sm cursor-pointer">
                                            Por Mayor: {formatPrice(porMayor)}
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="porMenor" id={`${productId}-porMenor`}/>
                                          <Label htmlFor={`${productId}-porMenor`} className="text-sm cursor-pointer">
                                            Por Menor: {formatPrice(porMenor)}
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="custom" id={`${productId}-custom`}/>
                                          <Label htmlFor={`${productId}-custom`} className="text-sm cursor-pointer flex items-center gap-2">
                                            Custom:
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={customPrice}
                                                onChange={(e) => handleCustomPriceChange(
                                                    productId,
                                                    parseFloat(e.target.value) || 0
                                                )}
                                                className="h-6 w-20 text-center text-xs"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                          </Label>
                                        </div>
                                      </RadioGroup>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                          type="number"
                                          min="1"
                                          value={quantities[productId] || 1}
                                          onChange={(e) => handleQuantityChange(
                                              productId,
                                              parseInt(e.target.value) || 1
                                          )}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                          size="sm"
                                          onClick={() => onAddTempProduct(
                                              product,
                                              quantities[productId] || 1,
                                              currentPriceType,
                                              currentPriceType === 'custom' ? customPrice : undefined
                                          )}
                                      >
                                        Agrega
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                )}
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
                              Precio: {formatPrice(item.finalPrice)}
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