'use client'

import { useState, useEffect } from "react"
import {Search, Download, Calendar, Package, AlertCircle} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
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
import {Skeleton} from "@/components/ui/skeleton";



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
              <Label>Estado</Label>
              <div className="flex gap-2">
                <Button
                  variant={expirationFilter === "30days" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setExpirationFilter(expirationFilter === "30days" ? "all" : "30days")}
                  className="flex-1 gap-1 text-xs"
                >
                  <Calendar className="h-3 w-3"/>
                  Por Vencer
                </Button>
                <Button
                  variant={expirationFilter === "expired" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setExpirationFilter(expirationFilter === "expired" ? "all" : "expired")}
                  className="flex-1 gap-1 text-xs"
                >
                  <AlertCircle className="h-3 w-3"/>
                  Vencidos
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Laboratorios</Label>
              {/* Mantengo tu componente MultiSelectLaboratory original */}
              <MultiSelectLaboratory
                laboratories={laboratories}
                selectedLabs={selectedLabs}
                onSelectionChange={setSelectedLabs}
              />
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
                Mostrando {filteredPricesLot.length} de {listPricesLots.length} productos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4"/>
                Exportar
              </Button>
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
                <th className="text-left p-4 font-medium text-sm">Lote</th>
                <th className="text-left p-4 font-medium text-sm">Vencimiento</th>
                <th className="text-left p-4 font-medium text-sm">P. Contado</th>
                <th className="text-left p-4 font-medium text-sm">P. Crédito</th>
                <th className="text-left p-4 font-medium text-sm">Estado</th>
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
                    <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                    <td className="p-4"><Skeleton className="h-4 w-[100px]"/></td>
                    <td className="p-4"><Skeleton className="h-4 w-[100px]"/></td>
                    <td className="p-4"><Skeleton className="h-4 w-[100px]"/></td>
                    <td className="p-4"><Skeleton className="h-4 w-[80px]"/></td>
                  </tr>
                ))
              ) : filteredPricesLot.length > 0 ? (
                filteredPricesLot.map((item: any, index) => {
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
                      <td
                        className="p-4 text-sm">{PriceMethodsService.truncateOrReplace(item.prod_principio, 10)}</td>
                      <td className="p-4 text-sm text-right">
                        {Number(item.kardex_saldoCant).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4 text-sm font-mono">{item.kardex_lote}</td>
                      <td className="p-4 text-sm">{item.kardex_VctoItem}</td>
                      <td className="p-4 text-sm text-right font-mono">
                        ${Number(item.precio_contado).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4 text-sm text-right font-mono">
                        ${Number(item.precio_credito).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4">
                        <Badge variant={expirationStatus.variant} className="text-xs">
                          {expirationStatus.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500">
                    No se encontraron resultados
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                  <Skeleton className="h-4 w-1/2"/>
                </div>

                <div className="flex gap-2">
                  <Skeleton className="h-8 w-full"/>
                  <Skeleton className="h-8 w-full"/>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredPricesLot.length > 0 ? (
          filteredPricesLot.map((item: any, index) => {
            const expirationStatus = PriceMethodsService.getExpirationStatus(item.kardex_VctoItem);
            return (
              <Card key={`${item.prod_codigo}-${item.kardex_lote}-${index}`} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-blue-600 text-sm">{item.prod_codigo}</h3>
                      <p className="text-xs text-gray-500">{item.laboratorio_Descripcion}</p>
                    </div>
                    <Badge variant={expirationStatus.variant} className="text-xs">
                      {expirationStatus.status}
                    </Badge>
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
                      <div>
                        <span className="text-xs text-gray-500">Stock:</span>
                        <p className="text-xs text-right">
                          {Number(item.kardex_saldoCant).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-gray-500">Lote:</span>
                        <p className="text-xs font-mono">{item.kardex_lote}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Vence:</span>
                        <p className="text-xs">{item.kardex_VctoItem}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-gray-500">P. Contado:</span>
                        <p className="text-xs font-mono">
                          ${Number(item.precio_contado).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">P. Crédito:</span>
                        <p className="text-xs font-mono">
                          ${Number(item.precio_credito).toLocaleString("es-ES", {minimumFractionDigits: 2})}
                        </p>
                      </div>
                    </div>
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