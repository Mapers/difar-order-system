'use client'

import { useState, useEffect } from "react"
import {Search, Download, Eye, ChevronLeft, ChevronRight, DollarSign} from "lucide-react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import { PriceService } from "@/app/services/price/PriceService"
import { PriceMethodsService } from "./services/priceMethodsService"
import MultiSelectLaboratory from "@/components/price/multiSelectLaboratory"
import { useLaboratoriesData } from "./hooks/useLaboratoriesData"
import { PrecioLote, PriceListParams, LoteInfo } from "./types"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/context/authContext';
import debounce from 'lodash.debounce';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {Skeleton} from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ExportPdfButton from "@/app/dashboard/lista-precios-lote/export-pdf-button";

export default function PricePage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLabs, setSelectedLabs] = useState<number[]>([])
  const [expirationFilter, setExpirationFilter] = useState("all")
  const [listPricesLots, setListPricesLots] = useState<PrecioLote[]>([])
  const [filteredPricesLot, setFilteredPricesLot] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const [excludeNoStock, setExcludeNoStock] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<PrecioLote | null>(null)
  const [lotDetails, setLotDetails] = useState<LoteInfo[]>([])
  const [loadingLots, setLoadingLots] = useState(false)
  const [priceDetails, setPriceDetails] = useState<PrecioLote | null>(null)

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  const debouncedFetchPricesLots = debounce(async () => {
    setLoading(true);
    setError(null);

    try {
      let payload: PriceListParams = {};
      if (searchTerm.length >= 4) {
        payload.descripcion = searchTerm;
        const response = await PriceService.getPricesLot(payload);
        const data = response.data || [];
        setFilteredPricesLot(data);
      } else if (selectedLabs.length > 0) {
        payload.laboratorio = selectedLabs.join(",");
        const response = await PriceService.getPricesLot(payload);
        const data = response.data || [];
        setFilteredPricesLot(data);
      }
      else {
        const response = await PriceService.getPricesLot(payload);
        const data = response.data || [];
        setListPricesLots(data);
      }

    } catch (error) {
      setError("No listó correctamente los precios por lote.");
    } finally {
      setLoading(false);
    }
  }, 500);

  const formatDateToDDMMYYYY = (dateString: string): string => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value)
    setCurrentPage(1) // Resetear a primera página al buscar
  }

  const fetchLotDetails = async (productCode: string) => {
    setLoadingLots(true);
    try {
      const response = await PriceService.getProductLots(productCode);
      setLotDetails(response.data || []);
    } catch (error) {
      setError("Error al cargar los detalles del lote");
      setLotDetails([]);
    } finally {
      setLoadingLots(false);
    }
  }

  const handleViewLots = (product: PrecioLote) => {
    setSelectedProduct(product);
    fetchLotDetails(product.prod_codigo);
  }

  const handleViewPrices = (product: PrecioLote) => {
    setPriceDetails(product);
  }

  const { laboratories, loadingLab, errorLab } = useLaboratoriesData()

  // Calcular datos paginados
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPricesLot.slice(startIndex, endIndex);
  }

  // Calcular total de páginas
  useEffect(() => {
    const total = Math.ceil(filteredPricesLot.length / itemsPerPage);
    setTotalPages(total || 1);

    // Si la página actual es mayor que el total de páginas, ir a la última página
    if (currentPage > total && total > 0) {
      setCurrentPage(total);
    }
  }, [filteredPricesLot, itemsPerPage, currentPage]);

  // Resetear a página 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLabs, excludeNoStock]);

  useEffect(() => {
    debouncedFetchPricesLots()
    return () => debouncedFetchPricesLots.cancel();
  }, [isAuthenticated, selectedLabs, searchTerm]);

  useEffect(() => {
    const now = new Date();
    setCurrentDateTime({
      date: now.toLocaleDateString("es-ES"),
      time: now.toLocaleTimeString("es-ES"),
    });
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      const filtered = excludeNoStock
          ? listPricesLots.filter(item => Number(item.kardex_saldoCant) > 0)
          : listPricesLots;
      setFilteredPricesLot(filtered);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const filtered = listPricesLots.filter(priceLot =>
        (priceLot.prod_codigo?.toLowerCase().includes(lowerSearch) ||
            priceLot.prod_descripcion?.toLowerCase().includes(lowerSearch) ||
            priceLot.prod_principio?.toLowerCase().includes(lowerSearch)) &&
        (!excludeNoStock || Number(priceLot.kardex_saldoCant) > 0)
    );
    setFilteredPricesLot(filtered);
  }, [searchTerm, listPricesLots, excludeNoStock]);

  // Funciones de paginación
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }

  let payloadL = {
    descripcion: '',
    laboratorio: ''
  };
  if (searchTerm.length >= 4) {
    payloadL.descripcion = searchTerm;
  } else if (selectedLabs.length > 0) {
    payloadL.laboratorio = selectedLabs.join(",");
  }

  const paginatedData = getPaginatedData();

  return (
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lista de Precios por Lote</h1>
          <p className="text-gray-500">Gestión de inventario DIFAR</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-lg font-semibold text-gray-800">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Búsqueda</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <Input
                      className="pl-9"
                      placeholder="Código, descripción..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Laboratorios</Label>
                <MultiSelectLaboratory
                    laboratories={laboratories}
                    selectedLabs={selectedLabs}
                    onSelectionChange={setSelectedLabs}
                />
              </div>

              <div className="space-y-2">
                <Label>Filtro</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                      type="checkbox"
                      id="excludeNoStock"
                      checked={excludeNoStock}
                      onChange={(e) => setExcludeNoStock(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="excludeNoStock" className="text-sm font-medium text-gray-700">
                    Excluir sin stock
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm overflow-auto">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800">Lista de Productos</CardTitle>
                <CardDescription>
                  Mostrando {paginatedData.length} de {filteredPricesLot.length} productos
                  (Página {currentPage} de {totalPages})
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <ExportPdfButton payload={payloadL} />
                <div className="text-sm text-gray-500">
                  {currentDateTime.date} | {currentDateTime.time}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-sm">Código</th>
                  <th className="text-left p-4 font-medium text-sm">Laboratorio</th>
                  <th className="text-left p-4 font-medium text-sm">Descripción</th>
                  <th className="text-left p-4 font-medium text-sm">Presentación</th>
                  <th className="text-left p-4 font-medium text-sm">Medida</th>
                  <th className="text-left p-4 font-medium text-sm">Principio Activo</th>
                  <th className="text-left p-4 font-medium text-sm">Stock</th>
                  <th className="text-left p-4 font-medium text-sm">P. Contado</th>
                  <th className="text-left p-4 font-medium text-sm">P. Crédito</th>
                  <th className="text-left p-4 font-medium text-sm">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {loading || loadingLab || !isAuthenticated ? (
                    Array.from({length: 5}).map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[120px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[150px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[100px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[100px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[100px]"/></td>
                          <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                        </tr>
                    ))
                ) : paginatedData.length > 0 ? (
                    paginatedData.map((item: any, index) => {
                      const expirationStatus = PriceMethodsService.getExpirationStatus(item.kardex_VctoItem);
                      return (
                          <tr key={`${item.prod_codigo}-${item.kardex_lote}-${index}`} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium text-sm font-mono">{item.prod_codigo}</td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium text-sm">{item.laboratorio_Descripcion}</div>
                                <div className="text-xs text-gray-500">{item.linea_lote_Descripcion}</div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div>
                                <div className="font-medium text-sm">{item.prod_descripcion}</div>
                                <div className="text-xs text-gray-500">{item.prod_principio}</div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{item.prod_presentacion}</td>
                            <td className="p-4 text-sm">{item.prod_medida}</td>
                            <td className="p-4 text-sm">{PriceMethodsService.truncateOrReplace(item.prod_principio, 10)}</td>
                            <td className="p-4 text-sm text-right">
                              {Number(item.kardex_saldoCant).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                            </td>
                            <td className="p-4 text-sm text-right font-mono">
                              S/ {item.precio_contado}
                            </td>
                            <td className="p-4 text-sm text-right font-mono">
                              S/ {item.precio_credito}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {/* Botón Ver Lotes */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => handleViewLots(item)}
                                    >
                                      <Eye className="h-4 w-4"/>
                                      Lotes
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Detalles de Lotes - {selectedProduct?.prod_codigo}</DialogTitle>
                                      <DialogDescription>
                                        {selectedProduct?.prod_descripcion}
                                      </DialogDescription>
                                    </DialogHeader>

                                    {loadingLots ? (
                                        <div className="space-y-4">
                                          {Array.from({length: 3}).map((_, index) => (
                                              <Skeleton key={index} className="h-12 w-full"/>
                                          ))}
                                        </div>
                                    ) : lotDetails.length > 0 ? (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Lote</TableHead>
                                              <TableHead>Stock</TableHead>
                                              <TableHead>Fecha Vencimiento</TableHead>
                                              <TableHead>Estado</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {lotDetails.map((lot, index) => {
                                              const lotStatus = PriceMethodsService.getExpirationStatus(lot.fechaVencimiento);
                                              return (
                                                  <TableRow key={index}>
                                                    <TableCell className="font-mono">{lot.numeroLote}</TableCell>
                                                    <TableCell>
                                                      {Number(lot.stock).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                                                    </TableCell>
                                                    <TableCell>{formatDateToDDMMYYYY(lot.fechaVencimiento)}</TableCell>
                                                    <TableCell>
                                                      <Badge variant={lotStatus.variant}>
                                                        {lotStatus.status}
                                                      </Badge>
                                                    </TableCell>
                                                  </TableRow>
                                              );
                                            })}
                                          </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                          No se encontraron lotes para este producto
                                        </div>
                                    )}
                                  </DialogContent>
                                </Dialog>

                                {/* Botón Ver Precios */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1"
                                        onClick={() => handleViewPrices(item)}
                                    >
                                      <DollarSign className="h-4 w-4"/>
                                      Precios
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Detalles de Precios</DialogTitle>
                                      <DialogDescription>
                                        {priceDetails?.prod_codigo} - {priceDetails?.prod_descripcion}
                                      </DialogDescription>
                                    </DialogHeader>

                                    {priceDetails && (
                                        <div className="space-y-4 py-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">Precio Contado</Label>
                                              <div className="text-lg font-mono font-semibold text-green-600">
                                                S/ {priceDetails.precio_contado}
                                              </div>
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">Precio Crédito</Label>
                                              <div className="text-lg font-mono font-semibold text-blue-600">
                                                S/ {priceDetails.precio_credito}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium mb-3">Bonificaciones</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">Bonificación Contado</Label>
                                                <div className="text-sm font-mono">
                                                  S/ {priceDetails.precio_bonif_cont}
                                                </div>
                                              </div>
                                              <div className="space-y-1">
                                                <Label className="text-xs text-gray-500">Bonificación Crédito</Label>
                                                <div className="text-sm font-mono">
                                                  S/ {priceDetails.precio_bonif_cred}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </td>
                          </tr>
                      );
                    })
                ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-500">
                        No se encontraron resultados
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          </CardContent>

          {/* Paginador */}
          {filteredPricesLot.length > 0 && (
              <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap">
                      Mostrar:
                    </Label>
                    <select
                        id="itemsPerPage"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  {/* Números de página */}
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                          <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                      );
                    })}
                  </div>

                  <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
          )}
        </Card>

        {/* Versión móvil */}
        <div className="lg:hidden overflow-auto">
          {loading || loadingLab || !isAuthenticated ? (
              Array.from({length: 3}).map((_, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Skeleton className="h-5 w-24 mb-1"/>
                          <Skeleton className="h-4 w-16"/>
                        </div>
                        <Skeleton className="h-5 w-20"/>
                      </div>

                      <div className="space-y-2 mb-3">
                        <Skeleton className="h-4 w-full"/>
                        <Skeleton className="h-4 w-3/4"/>
                      </div>

                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-full"/>
                        <Skeleton className="h-8 w-full"/>
                      </div>
                    </CardContent>
                  </Card>
              ))
          ) : paginatedData.length > 0 ? (
              paginatedData.map((item: any, index) => {
                const expirationStatus = PriceMethodsService.getExpirationStatus(item.kardex_VctoItem);
                return (
                    <Card key={`${item.prod_codigo}-${item.kardex_lote}-${index}`} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-blue-600 text-sm">{item.prod_codigo}</h3>
                            <p className="text-xs text-gray-500">{item.laboratorio_Descripcion}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div>
                            <p className="font-medium text-sm truncate">{item.prod_descripcion}</p>
                            <p className="text-xs text-gray-500">{item.prod_principio}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500">Presentación:</span>
                              <p className="text-xs">{item.prod_presentacion}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500">P. Contado:</span>
                              <p className="text-xs font-mono">
                                S/ {item.precio_contado}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">P. Crédito:</span>
                              <p className="text-xs font-mono">
                                S/ {item.precio_credito}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {/* Botón Ver Lotes - Móvil */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={() => handleViewLots(item)}
                              >
                                <Eye className="h-4 w-4"/>
                                Lotes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalles de Lotes - {selectedProduct?.prod_codigo}</DialogTitle>
                                <DialogDescription>
                                  {selectedProduct?.prod_descripcion}
                                </DialogDescription>
                              </DialogHeader>

                              {loadingLots ? (
                                  <div className="space-y-4">
                                    {Array.from({length: 3}).map((_, index) => (
                                        <Skeleton key={index} className="h-12 w-full"/>
                                    ))}
                                  </div>
                              ) : lotDetails.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Lote</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Fecha Vencimiento</TableHead>
                                        <TableHead>Estado</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {lotDetails.map((lot, index) => {
                                        const lotStatus = PriceMethodsService.getExpirationStatus(lot.fechaVencimiento);
                                        return (
                                            <TableRow key={index}>
                                              <TableCell className="font-mono">{lot.numeroLote}</TableCell>
                                              <TableCell>
                                                {Number(lot.stock).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                                              </TableCell>
                                              <TableCell>{formatDateToDDMMYYYY(lot.fechaVencimiento)}</TableCell>
                                              <TableCell>
                                                <Badge variant={lotStatus.variant}>
                                                  {lotStatus.status}
                                                </Badge>
                                              </TableCell>
                                            </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                              ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    No se encontraron lotes para este producto
                                  </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Botón Ver Precios - Móvil */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={() => handleViewPrices(item)}
                              >
                                <DollarSign className="h-4 w-4"/>
                                Precios
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Detalles de Precios</DialogTitle>
                                <DialogDescription>
                                  {priceDetails?.prod_codigo} - {priceDetails?.prod_descripcion}
                                </DialogDescription>
                              </DialogHeader>

                              {priceDetails && (
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium">Precio Contado</Label>
                                        <div className="text-lg font-mono font-semibold text-green-600">
                                          S/ {priceDetails.precio_contado}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium">Precio Crédito</Label>
                                        <div className="text-lg font-mono font-semibold text-blue-600">
                                          S/ {priceDetails.precio_credito}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="border-t pt-4">
                                      <h4 className="text-sm font-medium mb-3">Bonificaciones</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <Label className="text-xs text-gray-500">Bonificación Contado</Label>
                                          <div className="text-sm font-mono">
                                            S/ {priceDetails.precio_bonif_cont}
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs text-gray-500">Bonificación Crédito</Label>
                                          <div className="text-sm font-mono">
                                            S/ {priceDetails.precio_bonif_cred}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                );
              })
          ) : (
              <div className="text-center py-8 text-gray-500">
                No se encontraron productos
              </div>
          )}
        </div>
      </div>
  )
}