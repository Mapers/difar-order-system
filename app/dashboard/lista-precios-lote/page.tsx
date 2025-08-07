'use client'

import { useState, useEffect } from "react"
import { Search, Download, Calendar, Package } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PriceService } from "@/app/services/price/PriceService"
import { PriceMethodsService } from "./services/priceMethodsService"
import MultiSelectLaboratory from "@/components/price/multiSelectLaboratory"
import { useLaboratoriesData } from "./hooks/useLaboratoriesData"
import { SkeletonClientRow } from "@/components/skeleton/ClientSkeleton"
import { PrecioLote, PriceListParams } from "./types"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/context/authContext';
import debounce from 'lodash.debounce';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"



export default function PricePage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLabs, setSelectedLabs] = useState<number[]>([])
  const [expirationFilter, setExpirationFilter] = useState("all")
  const [listPricesLots, setListPricesLots] = useState<PrecioLote[]>([])
  const [filteredPricesLot, setFilteredPricesLot] = useState<any>([])

  // const [laboratories, setLaboratories] = useState<any>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });


  const debouncedFetchPricesLots = debounce(async () => {
    setLoading(true);
    setError(null);

    try {
      let payload: PriceListParams = {};
      if (searchTerm.length >= 4) {
        payload.descripcion = searchTerm;
        const response = await PriceService.getPricesLot(payload);
        const data = response.data || [];
        // setListPricesLots(data);
        setFilteredPricesLot(data);
      } else if (selectedLabs.length > 0) {
        payload.laboratorio = selectedLabs.join(",");
        const response = await PriceService.getPricesLot(payload);
        const data = response.data || [];
        // setListPricesLots(data);
        setFilteredPricesLot(data);
      }
      else {
        const response = await PriceService.getPricesLot(payload);
        const data = response.data || [];
        setListPricesLots(data);
        // setFilteredPricesLot(data);
      }

    } catch (error) {
      setError("No listó correctamente los precios por lote.");
    } finally {
      setLoading(false);
    }
  }, 500);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value)
    // setSearch((prev) => ({ ...prev, client: value }));
    // if (value === '') {
    //   setSelectedClient(null);
    // }
  }


  const { laboratories, loadingLab, errorLab } = useLaboratoriesData()

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
      setFilteredPricesLot(listPricesLots);
      return;
    }
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = listPricesLots.filter(priceLot =>
      priceLot.prod_codigo?.toLowerCase().includes(lowerSearch) ||
      priceLot.prod_descripcion?.toLowerCase().includes(lowerSearch) ||
      priceLot.prod_principio?.toLowerCase().includes(lowerSearch)
    );
    setFilteredPricesLot(filtered);
  }, [searchTerm, listPricesLots]);


  return (
    <div className="grid gap-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
              Lista de Precios por Lote
            </CardTitle>
            <p className="text-sm sm:text-base text-gray-600">
              Gestión de inventario DIFAR
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Multi-Select Laboratory Filter */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      className="pl-10"
                      type="search"
                      placeholder="Buscar por código, descripción o principio activo..."
                      value={searchTerm}
                      // onChange={(e) => setSearchTerm(e.target.value)}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={expirationFilter === "30days" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setExpirationFilter(expirationFilter === "30days" ? "all" : "30days")}
                    className="text-xs"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Por Vencer (30 días)
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {
                        listPricesLots.filter((item) => {
                          const today = new Date()
                          const expDate = new Date(item.kardex_VctoItem)
                          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                          return diffDays >= 0 && diffDays <= 30
                        }).length
                      }

                    </Badge>
                  </Button>
                  <Button
                    variant={expirationFilter === "expired" ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setExpirationFilter(expirationFilter === "expired" ? "all" : "expired")}
                    className="text-xs"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Vencidos
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {
                        listPricesLots.filter((item) => {
                          const today = new Date()
                          const expDate = new Date(item.kardex_VctoItem)
                          return expDate < today
                        }).length
                      }
                    </Badge>
                  </Button>
                </div>
              </div>

              {/* Multi-Select Laboratory Filter */}
              <div className="space-y-2">
                <Label htmlFor="lab-multiselect" className="text-sm font-medium">
                  Filtrar por Laboratorios
                </Label>
                <MultiSelectLaboratory
                  laboratories={laboratories}
                  selectedLabs={selectedLabs}
                  onSelectionChange={setSelectedLabs}
                />

              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <Card className="bg-white shadow-sm">
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2"> */}
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredPricesLot.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Stock</CardTitle>
                  <span className="text-green-600">$</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    $
                    {filteredPricesLot
                      .reduce((sum: any, item: any) => sum + item.kardex_saldoCant * item.precio_contado, 0)
                      .toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Por Vencer (30 días)</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      filteredPricesLot.filter((item: any) => {
                        const today = new Date()
                        const expDate = new Date(item.kardex_VctoItem)
                        // const expDate = new Date(item.kardex_VctoItem.split("/").reverse().join("-"))
                        const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        return diffDays >= 0 && diffDays <= 30
                      }).length
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                  <Calendar className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {
                      filteredPricesLot.filter((item: any) => {
                        const today = new Date()
                        const expDate = new Date(item.kardex_VctoItem)
                        return expDate < today
                      }).length
                    }
                  </div>
                </CardContent>
              </Card>
            </CardContent>

            {/* </div> */}
          </Card>

          {/* cuantity */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-600">
              <div>
                Mostrando {filteredPricesLot.length} de {listPricesLots.length} productos
              </div>
              <div>
                Fecha: {currentDateTime.date} | Hora: {currentDateTime.time}
              </div>
            </div>

          </div>

          <div className="space-y-4">

            {/* LISTADO DE CLIENTES PARA DESCKTOP */}
            {/* <div className="hidden lg:block mt-3"> */}
            <div className="hidden lg:block mt-3">
              <Card className="bg-white shadow-sm max-h-[600px] overflow-auto">
                <div className="overflow-x-auto">
                  <Table >
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Código</TableHead>
                        <TableHead className="w-32">Laboratorio</TableHead>
                        <TableHead className="w-50">Descripción</TableHead>
                        <TableHead className="w-32">Presentación</TableHead>
                        <TableHead className="w-24">Medida</TableHead>
                        <TableHead className="w-25">Principio Activo</TableHead>
                        <TableHead className="w-24 text-right">Stock</TableHead>
                        <TableHead className="w-24">Lote</TableHead>
                        <TableHead className="w-25">Vencimiento</TableHead>
                        <TableHead className="w-24 text-right">P. Contado</TableHead>
                        <TableHead className="w-24 text-right">P. Crédito</TableHead>
                        <TableHead className="w-20">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading || loadingLab || !isAuthenticated ? (
                        Array.from({ length: 5 }).map((_, index) => (
                          <SkeletonClientRow key={index} />
                        ))
                      ) : filteredPricesLot.length > 0 ? (
                        filteredPricesLot.map((item: any, index: any) => {
                          const expirationStatus = PriceMethodsService.getExpirationStatus(item.kardex_VctoItem);
                          return (
                            <TableRow key={index} className="hover:bg-gray-50">
                              <TableCell className="font-mono text-sm">{item.prod_codigo}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{item.laboratorio_Descripcion}</div>
                                  <div className="text-gray-500 text-xs">{item.linea_lote_Descripcion}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">
                                    {PriceMethodsService.truncateOrReplace(item.prod_descripcion, 20)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{item.prod_presentacion}</TableCell>
                              <TableCell className="text-sm">{item.prod_medida}</TableCell>
                              <TableCell className="text-sm">
                                {PriceMethodsService.truncateOrReplace(item.prod_principio, 10)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {Number(item.kardex_saldoCant).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{item.kardex_lote}</TableCell>
                              <TableCell className="text-sm">{item.kardex_VctoItem}</TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                ${Number(item.precio_contado).toLocaleString("es-ES", { minimumFractionDigits: 4 })}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                ${Number(item.precio_credito).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={expirationStatus.variant} className="text-xs">
                                  {expirationStatus.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center text-gray-500 py-4">
                            No se encontraron resultados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}