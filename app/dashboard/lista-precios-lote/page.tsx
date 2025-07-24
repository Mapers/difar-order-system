'use client'

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Download, Calendar, Package, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from '@/context/authContext';
import { PriceService } from "@/app/services/price/PriceService"
import { PrecioLote, PriceListParams } from "./types"
import { PriceMethodsService } from "./services/priceMethodsService"


interface MultiSelectLaboratoryProps {
  laboratories: string[]
  selectedLabs: string[]
  onSelectionChange: (labs: string[]) => void
}


function MultiSelectLaboratory({ laboratories, selectedLabs, onSelectionChange }: MultiSelectLaboratoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLabs = laboratories.filter((lab) => lab.toLowerCase().includes(searchTerm.toLowerCase()))

  const toggleLab = (lab: string) => {
    if (selectedLabs.includes(lab)) {
      onSelectionChange(selectedLabs.filter((l) => l !== lab))
    } else {
      onSelectionChange([...selectedLabs, lab])
    }
  }

  const removeLab = (lab: string) => {
    onSelectionChange(selectedLabs.filter((l) => l !== lab))
  }

  return (
    <div className="relative">
      <div
        className="min-h-10 border border-gray-300 rounded-md p-2 bg-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedLabs.map((lab) => (
            <Badge key={lab} variant="secondary" className="text-xs">
              {lab}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeLab(lab)
                }}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {selectedLabs.length === 0 && <span className="text-gray-500 text-sm">Seleccionar laboratorios...</span>}
        </div>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="p-2 border-b">
            <Input
              placeholder="Buscar laboratorio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="py-1">
            {filteredLabs.map((lab) => (
              <div
                key={lab}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2 text-sm"
                onClick={() => toggleLab(lab)}
              >
                <input type="checkbox" checked={selectedLabs.includes(lab)} onChange={() => { }} className="rounded" />
                {lab}
              </div>
            ))}
            {filteredLabs.length === 0 && (
              <div className="px-3 py-2 text-gray-500 text-sm">No se encontraron laboratorios</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


export default function PricePage() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLabs, setSelectedLabs] = useState<string[]>([])
  const [selectedLinea, setSelectedLinea] = useState("all")
  const [minStock, setMinStock] = useState("")
  const [maxStock, setMaxStock] = useState("")
  const [expirationFilter, setExpirationFilter] = useState("all")
  const [listPricesLots, setListPricesLots] = useState<PrecioLote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDateTime, setCurrentDateTime] = useState<{ date: string; time: string }>({
    date: "",
    time: "",
  });
  const [params, setParams] = useState<PriceListParams>({
    laboratorio: "",
    descripcion: "",
  });



  const laboratories = useMemo(() => PriceMethodsService.getUniqueLaboratories(listPricesLots), [listPricesLots]);
  console.log("Laboratorios únicos:", laboratories);
  const lineas = useMemo(() => PriceMethodsService.getUniqueLineas(listPricesLots), [listPricesLots]);

  const filteredData = useMemo(() =>
    PriceMethodsService.filterData(
      listPricesLots,
      searchTerm,
      selectedLabs,
      selectedLinea,
      minStock,
      maxStock,
      expirationFilter
    ),
    [listPricesLots, searchTerm, selectedLabs, selectedLinea, minStock, maxStock, expirationFilter]
  );

  const expirationStatus = (date: string) => PriceMethodsService.getExpirationStatus(date);


  const clearFilters = () => {
    setSearchTerm("")
    setSelectedLabs([])
    setSelectedLinea("all")
    setMinStock("")
    setMaxStock("")
    setExpirationFilter("all")
  }


  // lista clientes con codigo de vendedor
  const getListPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      // const payload: PriceListParams = {
      //   laboratorio,
      //   descripcion
      // }
      // const response = await PriceService.getPreciosPorLote(payload);
      const response = await PriceService.getPreciosPorLote();
      console.log(" >>>DATA:", response.data);
      setListPricesLots(response.data || []);
    } catch (error) {
      console.error("Error fetching prices:", error);
      setError("Error al cargar los precios");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (isAuthenticated && user?.codigo) {
      getListPrices();
    }
  }, [isAuthenticated, selectedLabs, searchTerm]);

  useEffect(() => {
    const now = new Date();
    setCurrentDateTime({
      date: now.toLocaleDateString("es-ES"),
      time: now.toLocaleTimeString("es-ES"),
    });
  }, []);

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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avanzados
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros Avanzados</SheetTitle>
                  <SheetDescription>Configura los filtros para refinar tu búsqueda</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="linea-filter">Línea de Lote</Label>
                    <Select value={selectedLinea} onValueChange={setSelectedLinea}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar línea" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las líneas</SelectItem>
                        {lineas.map((linea) => (
                          <SelectItem key={linea} value={linea}>
                            {linea}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="min-stock">Stock Mínimo</Label>
                      <Input
                        id="min-stock"
                        type="number"
                        placeholder="0"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-stock">Stock Máximo</Label>
                      <Input
                        id="max-stock"
                        type="number"
                        placeholder="999999"
                        value={maxStock}
                        onChange={(e) => setMaxStock(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expiration-filter">Estado de Vencimiento</Label>
                    <Select value={expirationFilter} onValueChange={setExpirationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="expired">Vencidos</SelectItem>
                        <SelectItem value="30days">Vencen en 30 días</SelectItem>
                        <SelectItem value="90days">Vencen en 90 días</SelectItem>
                        <SelectItem value="valid">Vigentes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={clearFilters} variant="outline" className="w-full bg-transparent">
                    Limpiar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
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
                      placeholder="Buscar por código, descripción o principio activo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
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
                      {/* {
                        listPricesLots.filter((item) => {
                          const today = new Date()
                          const expDate = new Date(item.kardex_VctoItem)
                          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                          return diffDays >= 0 && diffDays <= 30
                        }).length
                      } */}
                      {
                        Array.isArray(listPricesLots)
                          ? listPricesLots.filter((item) => {
                            const today = new Date()
                            const expDate = new Date(item.kardex_VctoItem)
                            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                            return diffDays >= 0 && diffDays <= 30
                          }).length
                          : 0
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
                      {/* {
                        listPricesLots.filter((item) => {
                          const today = new Date()
                          const expDate = new Date(item.kardex_VctoItem)
                          return expDate < today
                        }).length
                      } */}
                      {
                        Array.isArray(listPricesLots) ? listPricesLots.filter((item) => {
                          const today = new Date()
                          const expDate = new Date(item.kardex_VctoItem)
                          return expDate < today
                        }).length : 0
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.length}</div>
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
                  {filteredData
                    .reduce((sum, item) => sum + item.kardex_saldoCant * item.precio_contado, 0)
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
                    filteredData.filter((item) => {
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
                    filteredData.filter((item) => {
                      const today = new Date()
                      const expDate = new Date(item.kardex_VctoItem)
                      return expDate < today
                    }).length
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          {/* cuantity */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-gray-600">
              <div>
                Mostrando {filteredData.length} de {listPricesLots.length} productos
              </div>
              <div>
                {/* Fecha: {new Date().toLocaleDateString("es-ES")} | Hora: {new Date().toLocaleTimeString("es-ES")} */}
                Fecha: {currentDateTime.date} | Hora: {currentDateTime.time}
              </div>
            </div>
          </div>

          <div className="space-y-4">

            {/* LISTADO DE CLIENTES PARA DESCKTOP */}
            {/* <div className="hidden lg:block mt-3"> */}
            <div className="max-w-[1480px] mx-auto space-y-6">
              <Card className="bg-white rounded-lg shadow-sm max-h-[600px] overflow-auto">
                <div className="overflow-x-auto">
                  <Table >
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Código</TableHead>
                        <TableHead className="w-32">Laboratorio</TableHead>
                        <TableHead className="min-w-80">Descripción</TableHead>
                        <TableHead className="w-32">Presentación</TableHead>
                        <TableHead className="w-24">Medida</TableHead>
                        <TableHead className="w-32">Principio Activo</TableHead>
                        <TableHead className="w-24 text-right">Stock</TableHead>
                        <TableHead className="w-24">Lote</TableHead>
                        <TableHead className="w-32">Vencimiento</TableHead>
                        <TableHead className="w-24 text-right">P. Contado</TableHead>
                        <TableHead className="w-24 text-right">P. Crédito</TableHead>
                        <TableHead className="w-20">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map((item, index) => {
                        // const expirationStatus = getExpirationStatus(item.kardex_VctoItem)
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
                                <div className="font-medium">{item.prod_descripcion}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{item.prod_presentacion}</TableCell>
                            <TableCell className="text-sm">{item.prod_medida}</TableCell>
                            <TableCell className="text-sm">{item.prod_principio}</TableCell>
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
                              {/* <Badge variant={expirationStatus.variant} className="text-xs">
                                {expirationStatus.status}
                              </Badge> */}
                            </TableCell>
                          </TableRow>
                        )
                      })}
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