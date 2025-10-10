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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

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

  const renderProductCard = (product: IProduct) => {
    const productId = product.Codigo_Art;
    const currentPriceType = priceTypes[productId] || 'contado';
    const contadoPrice = Number(product.PUContado);
    const creditoPrice = Number(product.PUCredito);
    const porMayor = Number(product.PUPorMayor);
    const porMenor = Number(product.PUPorMenor);
    const customPrice = customPrices[productId] || contadoPrice;

    return (
        <Card key={productId} className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-100 p-1.5 rounded-md">
                    <Package className="h-3 w-3 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-blue-600 text-sm truncate">{product.NombreItem}</h3>
                </div>
                <p className="text-xs text-gray-500 truncate mb-1">Código: {productId}</p>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                  Stock: {Number(product.Stock).toFixed(2)}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Tipo de Precio</Label>
                <RadioGroup
                    value={currentPriceType}
                    onValueChange={(value: 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom') =>
                        handlePriceTypeChange(productId, value)
                    }
                    className="space-y-2"
                >
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="contado" id={`${productId}-contado`} className="h-3 w-3"/>
                      <Label htmlFor={`${productId}-contado`} className="text-xs cursor-pointer">
                        Contado: {formatPrice(contadoPrice)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="credito" id={`${productId}-credito`} className="h-3 w-3"/>
                      <Label htmlFor={`${productId}-credito`} className="text-xs cursor-pointer">
                        Crédito: {formatPrice(creditoPrice)}
                      </Label>
                    </div>
                    {porMayor > 0 && (
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="porMayor" id={`${productId}-porMayor`} className="h-3 w-3 border-violet-500" />
                          <Label htmlFor={`${productId}-porMayor`} className="text-xs cursor-pointer text-violet-700">
                            Bonif Cont: {formatPrice(porMayor)}
                          </Label>
                        </div>
                    )}
                    {porMenor > 0 && (
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="porMenor" id={`${productId}-porMenor`} className="h-3 w-3 border-green-500" />
                          <Label htmlFor={`${productId}-porMenor`} className="text-xs cursor-pointer text-green-700">
                            Bonif Créd: {formatPrice(porMenor)}
                          </Label>
                        </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id={`${productId}-custom`} className="h-3 w-3"/>
                    <Label htmlFor={`${productId}-custom`} className="text-xs cursor-pointer flex items-center gap-2">
                      Personalizado:
                      <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={customPrice}
                          onChange={(e) => handleCustomPriceChange(
                              productId,
                              parseFloat(e.target.value) || 0
                          )}
                          className="h-6 w-16 text-center text-xs"
                          onClick={(e) => e.stopPropagation()}
                      />
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`quantity-${productId}`} className="text-xs font-medium">Cantidad</Label>
                <Input
                    id={`quantity-${productId}`}
                    type="number"
                    min="1"
                    value={quantities[productId] || 1}
                    onChange={(e) => handleQuantityChange(
                        productId,
                        parseInt(e.target.value) || 1
                    )}
                    className="h-8 text-sm"
                />
              </div>
            </div>

            <Button
                size="sm"
                onClick={() => onAddTempProduct(
                    product,
                    quantities[productId] || 1,
                    currentPriceType,
                    currentPriceType === 'custom' ? customPrice : undefined
                )}
                className="w-full text-xs h-8"
            >
              Agregar al Pedido
            </Button>
          </CardContent>
        </Card>
    );
  };

  const renderDesktopTable = () => (
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
          {products.map((product) => {
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
                  <TableCell>{Number(product.Stock).toFixed(2)}</TableCell>
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
                      {porMayor > 0 && <div className="flex items-center space-x-2">
                        <RadioGroupItem value="porMayor" id={`${productId}-porMayor`} className='border-violet-500' />
                        <Label htmlFor={`${productId}-porMayor`} className="text-sm cursor-pointer text-violet-700">
                          Bonif Cont: {formatPrice(porMayor)}
                        </Label>
                      </div>}
                      {porMenor > 0 && <div className="flex items-center space-x-2">
                        <RadioGroupItem value="porMenor" id={`${productId}-porMenor`} className='border-green-500' />
                        <Label htmlFor={`${productId}-porMenor`} className="text-sm cursor-pointer text-green-700">
                          Bonif Créd: {formatPrice(porMenor)}
                        </Label>
                      </div>}
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id={`${productId}-custom`} className='border-red-500' />
                        <Label htmlFor={`${productId}-custom`} className="text-sm cursor-pointer flex items-center gap-2 text-red-700">
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
                              className="h-6 w-20 text-center text-xs bg-red-50"
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
          })}
        </TableBody>
      </Table>
  );

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] lg:max-w-7xl h-[95vh] sm:h-[90vh] mx-2 sm:mx-4 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">Productos de {getDescriptionById(laboratorio)}</DialogTitle>
            <DialogDescription className="text-sm">
              Selecciona las cantidades y tipo de precio para cada producto
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 px-1 sm:px-0 py-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
              {/* Productos - Ocupa 2/3 en desktop */}
              <div className="lg:col-span-2 overflow-y-auto">
                <div className="rounded-md border">
                  {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Cargando productos...</span>
                      </div>
                  ) : products.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                        <p className="text-gray-500">No se encontraron productos para este laboratorio</p>
                      </div>
                  ) : (
                      <>
                        {/* Vista Mobile - Cards */}
                        <div className="block lg:hidden">
                          <div className="grid grid-cols-1 gap-3 p-3">
                            {products.map(renderProductCard)}
                          </div>
                        </div>

                        {/* Vista Desktop - Table */}
                        <div className="hidden lg:block">
                          {renderDesktopTable()}
                        </div>
                      </>
                  )}
                </div>
              </div>

              {/* Resumen - Ocupa 1/3 en desktop, full width en mobile */}
              <div className="lg:col-span-1 overflow-y-auto">
                <Card className="h-full">
                  <CardHeader className="bg-gray-50 border-b p-4">
                    <CardTitle className="text-base sm:text-lg">Resumen de selección</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {tempSelectedProducts.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No hay productos seleccionados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                          {tempSelectedProducts.map((item, index) => (
                              <div key={index} className="border-b pb-3 last:border-b-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{item.product.NombreItem}</div>
                                    <div className="text-xs text-gray-600 mb-1">
                                      Precio: {formatPrice(item.finalPrice)}
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span>{item.quantity} unidades</span>
                                      <span className="font-medium">
                                  {formatPrice(item.finalPrice * item.quantity)}
                                </span>
                                    </div>
                                  </div>
                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-500 shrink-0 ml-2"
                                      onClick={() => onRemoveTempProduct(index)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                          ))}
                          <div className="pt-2 border-t">
                            <div className="flex justify-between font-medium text-sm">
                              <span>Total:</span>
                              <span>
                            {formatPrice(tempSelectedProducts.reduce(
                                (sum, item) => sum + (item.finalPrice * item.quantity),
                                0
                            ))}
                          </span>
                            </div>
                            <Button
                                className="w-full mt-4 text-sm h-9"
                                onClick={onConfirmSelection}
                            >
                              Confirmar selección
                            </Button>
                          </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
};