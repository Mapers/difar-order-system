'use client'

import { IProduct, ISelectedProduct } from "@/app/types/order/product-interface";
import { IMoneda } from "@/app/types/order/client-interface";
import { useEffect, useState } from "react";
import { TableBody, TableCell, TableHeader, TableRow, Table, TableHead } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLaboratoriesData } from "@/app/dashboard/lista-precios-lote/hooks/useLaboratoriesData";
import { getProductsLabRequest } from "@/app/api/products";
import { Badge } from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Package, Minus, Plus, Trash, Gift} from "lucide-react";
import {PriceType} from "@/app/types/order/order-interface";

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
  onAddTempProduct: (product: IProduct, quantity: number, priceType: PriceType, customPrice?: number) => void;
  tempSelectedProducts: ISelectedProduct[];
  onRemoveTempProduct: (index: number) => void;
  onConfirmSelection: () => void;
  currency: IMoneda | null;
}) => {
  const { laboratories } = useLaboratoriesData()
  const [quantities, setQuantities] = useState<Record<string, number | "">>({});
  const [priceTypes, setPriceTypes] = useState<Record<string, PriceType>>({});
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(false)

  const handleQuantityChange = (productId: string, value: number | "") => {
    setQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handlePriceTypeChange = (productId: string, value: PriceType) => {
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
    return `${currency?.value === "PEN" ? "S/." : "$"}${price.toFixed(2)}`;
  };

  const getDescriptionById = (id: string) => {
    const lab = laboratories.find((l) => l.IdLineaGe === Number(id))
    return lab ? lab.Descripcion : id.toString()
  }

  const resolvePrice = (productId: string, product: IProduct) => {
    const type = priceTypes[productId] || 'contado';
    if (type === 'contado') return Number(product.PUContado);
    if (type === 'credito') return Number(product.PUCredito);
    if (type === 'porMayor') return Number(product.PUPorMayor);
    if (type === 'porMenor') return Number(product.PUPorMenor);
    if (type === 'regalo') return 0;
    if (type === 'custom') return customPrices[productId] || Number(product.PUContado);
    return Number(product.PUContado);
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

  const renderQuantityControl = (product: IProduct) => {
    const productId = product.Codigo_Art;
    const rawQuantity = quantities[productId];
    const safeQuantity = typeof rawQuantity === "number" ? rawQuantity : (rawQuantity === undefined ? 1 : 0);
    const stockTotal = Number(product.Stock);

    return (
        <div className={`flex items-center h-9 sm:h-10 rounded-lg border overflow-hidden transition-colors ${safeQuantity >= stockTotal
            ? 'bg-gray-50 border-red-300'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <button
              type="button"
              aria-label={safeQuantity <= 1 ? "Quitar producto" : "Disminuir cantidad"}
              onClick={() => {
                if (safeQuantity > 1) handleQuantityChange(productId, safeQuantity - 1);
              }}
              className={`h-full px-2.5 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${safeQuantity <= 1
                  ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
              type="number"
              min="1"
              step="1"
              value={rawQuantity !== undefined ? rawQuantity : 1}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  handleQuantityChange(productId, "");
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0) {
                    handleQuantityChange(productId, Math.min(num, stockTotal));
                  }
                }
              }}
              onBlur={() => {
                if (rawQuantity === "" || rawQuantity === 0) handleQuantityChange(productId, 1);
              }}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
              }}
              className="w-10 sm:w-12 bg-transparent outline-none text-center text-sm font-semibold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
              type="button"
              aria-label="Aumentar cantidad"
              disabled={safeQuantity >= stockTotal}
              onClick={() => handleQuantityChange(productId, Math.min(safeQuantity + 1, stockTotal))}
              className={`h-full px-2.5 flex items-center justify-center transition-colors disabled:cursor-not-allowed ${safeQuantity >= stockTotal
                  ? 'text-gray-300'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
    )
  }

  const renderCalculation = (product: IProduct) => {
    const productId = product.Codigo_Art;
    const unitPrice = resolvePrice(productId, product);
    const rawQty = quantities[productId];
    const qty = typeof rawQty === "number" ? rawQty : 1;
    const sym = currency?.value === "PEN" ? "S/." : "$";

    return (
        <p className="text-[11px] text-center text-gray-500 mt-1.5 w-full">
          {sym}{unitPrice.toFixed(2)} × {qty} = <span className="font-semibold text-gray-800">{sym}{(unitPrice * qty).toFixed(2)}</span>
        </p>
    )
  }


  const renderProductCard = (product: IProduct) => {
    const productId = product.Codigo_Art;
    const currentPriceType = priceTypes[productId] || 'contado';
    const contadoPrice = Number(product.PUContado);
    const creditoPrice = Number(product.PUCredito);
    const porMayor = Number(product.PUPorMayor);
    const porMenor = Number(product.PUPorMenor);
    const customPrice = customPrices[productId] || contadoPrice;

    const rawQty = quantities[productId];
    const qtyToSubmit = typeof rawQty === "number" ? rawQty : 1;

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
                    onValueChange={(value: PriceType) =>
                        handlePriceTypeChange(productId, value)
                    }
                    className="space-y-2"
                >
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="contado" id={`${productId}-contado`} className="h-3 w-3" />
                      <Label htmlFor={`${productId}-contado`} className="text-xs cursor-pointer">
                        Contado: {formatPrice(contadoPrice)}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="credito" id={`${productId}-credito`} className="h-3 w-3" />
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
                    <RadioGroupItem value="custom" id={`${productId}-custom`} className="h-3 w-3" />
                    <Label htmlFor={`${productId}-custom`} className="text-xs cursor-pointer flex items-center gap-2">
                      Personalizado:
                      <Input
                          type="text"
                          value={customPrice === 0 ? '' : customPrice}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^\d.]/g, '');
                            const parts = val.split('.');
                            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                            if (parts.length === 2 && parts[1].length > 2) val = parts[0] + '.' + parts[1].substring(0, 2);
                            handleCustomPriceChange(productId, parseFloat(val === '' ? '0' : val) || 0)
                          }}
                          onBlur={(e) => {
                            const numValue = parseFloat(e.target.value)
                            if (!numValue || numValue <= 0) {
                              handleCustomPriceChange(productId, contadoPrice)
                            } else {
                              handleCustomPriceChange(productId, parseFloat(numValue.toFixed(2)))
                            }
                          }}
                          className="h-6 w-16 text-center text-xs"
                          onClick={(e) => e.stopPropagation()}
                      />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="regalo" id={`${productId}-regalo`} className="h-3 w-3 border-pink-500" />
                    <Label htmlFor={`${productId}-regalo`} className="text-xs cursor-pointer text-pink-600 flex items-center gap-1">
                      <Gift className="h-3 w-3" /> Regalo
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Cantidad</Label>
                {renderQuantityControl(product)}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <Button
                  size="sm"
                  onClick={() => onAddTempProduct(
                      product,
                      qtyToSubmit,
                      currentPriceType,
                      currentPriceType === 'custom' ? customPrice : undefined
                  )}
                  className="w-full text-xs h-8 bg-indigo-600 hover:bg-indigo-700"
              >
                Agregar al Pedido
              </Button>
              {renderCalculation(product)}
            </div>
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
            <TableHead className="w-[120px]">Cantidad</TableHead>
            <TableHead className="w-[140px] text-center">Acciones</TableHead>
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

            const rawQty = quantities[productId];
            const qtyToSubmit = typeof rawQty === "number" ? rawQty : 1;

            return (
                <TableRow key={productId}>
                  <TableCell>
                    <div className="text-sm font-semibold">{product.NombreItem}</div>
                    <div className="text-xs text-gray-500">{productId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50">
                      {Number(product.Stock).toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RadioGroup
                        value={currentPriceType}
                        onValueChange={(value: 'contado' | 'credito' | 'porMayor' | 'porMenor' | 'custom') =>
                            handlePriceTypeChange(productId, value)
                        }
                        className="flex flex-col gap-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="contado" id={`${productId}-contado`} />
                        <Label htmlFor={`${productId}-contado`} className="text-sm cursor-pointer">
                          Contado: {formatPrice(contadoPrice)}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credito" id={`${productId}-credito`} />
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
                              type="text"
                              value={customPrice === 0 ? '' : customPrice}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^\d.]/g, '');
                                const parts = value.split('.');
                                if (parts.length > 2) value = parts[0] + '.' + parts.slice(1).join('');
                                if (parts.length === 2 && parts[1].length > 2) value = parts[0] + '.' + parts[1].substring(0, 2);
                                handleCustomPriceChange(productId, parseFloat(value === '' ? '0' : value) || 0)
                              }}
                              onBlur={(e) => {
                                const numValue = parseFloat(e.target.value)
                                if (!numValue || numValue <= 0) {
                                  handleCustomPriceChange(productId, contadoPrice)
                                } else {
                                  handleCustomPriceChange(productId, parseFloat(numValue.toFixed(2)))
                                }
                              }}
                              className="h-6 w-20 text-center text-xs bg-red-50"
                              onClick={(e) => e.stopPropagation()}
                          />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="regalo" id={`${productId}-regalo`} className="border-pink-500" />
                        <Label htmlFor={`${productId}-regalo`} className="text-sm cursor-pointer text-pink-600 flex items-center gap-1">
                          <Gift className="h-3.5 w-3.5" /> Regalo
                        </Label>
                      </div>
                    </RadioGroup>
                  </TableCell>
                  <TableCell>
                    {renderQuantityControl(product)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <Button
                          size="sm"
                          onClick={() => onAddTempProduct(
                              product,
                              qtyToSubmit,
                              currentPriceType,
                              currentPriceType === 'custom' ? customPrice : undefined
                          )}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        Agrega
                      </Button>
                      {renderCalculation(product)}
                    </div>
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
              <div className="lg:col-span-2 overflow-y-auto">
                <div className="rounded-md border border-gray-200">
                  {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="ml-3 text-gray-600 font-medium">Cargando productos...</span>
                      </div>
                  ) : products.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                        <p className="text-gray-500">No se encontraron productos para este laboratorio</p>
                      </div>
                  ) : (
                      <>
                        <div className="block lg:hidden">
                          <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50">
                            {products.map(renderProductCard)}
                          </div>
                        </div>

                        <div className="hidden lg:block">
                          {renderDesktopTable()}
                        </div>
                      </>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 overflow-y-auto">
                <Card className="h-full border-gray-200 shadow-sm">
                  <CardHeader className="bg-gray-50 border-b p-4">
                    <CardTitle className="text-base sm:text-lg text-indigo-700">Resumen de selección</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {tempSelectedProducts.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-500">No hay productos seleccionados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                          {tempSelectedProducts.map((item, index) => (
                              <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-800 text-sm truncate">{item.product.NombreItem}</div>
                                    <div className="text-xs text-gray-500 mb-1">
                                      Precio Unit: {formatPrice(item.finalPrice)}
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">{item.quantity} und.</span>
                                      <span className="font-bold text-gray-900">
                                                                    {formatPrice(item.finalPrice * item.quantity)}
                                                                </span>
                                    </div>
                                  </div>
                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 ml-3 rounded-full"
                                      onClick={() => onRemoveTempProduct(index)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                          ))}
                          <div className="pt-4 border-t border-gray-200 mt-4">
                            <div className="flex justify-between items-center font-bold text-base mb-4">
                              <span className="text-gray-700">Total Acumulado:</span>
                              <span className="text-indigo-700 text-lg">
                                                        {formatPrice(tempSelectedProducts.reduce(
                                                            (sum, item) => sum + (item.finalPrice * item.quantity),
                                                            0
                                                        ))}
                                                    </span>
                            </div>
                            <Button
                                className="w-full text-sm h-11 font-semibold bg-indigo-600 hover:bg-indigo-700"
                                onClick={onConfirmSelection}
                            >
                              Confirmar y Volver
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