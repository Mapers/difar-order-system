'use client'

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/authContext';
import { useLaboratoriesData } from "./hooks/useLaboratoriesData";
import { usePriceList } from "./hooks/usePriceList";
import { useProductModals } from "./hooks/useProductModals";
import { useVentasTresMeses } from "./hooks/useVentasTresMeses";
import { useImagenesProducto } from "./hooks/useImagenesProducto";
import ExportPdfButton from "@/app/dashboard/lista-precios-lote/export-pdf-button";
import ExportExcelButton from "@/app/dashboard/lista-precios-lote/export-excel-button";
import {PriceFilters} from "@/components/lista-precios-lote/PriceFilters";
import {PriceTable} from "@/components/lista-precios-lote/PriceTable";
import {PriceModals} from "@/components/lista-precios-lote/PriceModals";
import {PricePagination} from "@/components/lista-precios-lote/PricePagination";
import {CreateProductModal} from "@/components/lista-precios-lote/CreateProductModal";
import {QuickPriceEditModal} from "@/components/lista-precios-lote/QuickPriceEditModal";
import {ArticuloImagenModal, ProductoImagen} from "@/components/lista-precios-lote/ArticuloImagenModal";

export default function PricePage() {
  const { user, isAuthenticated, isAdmin, hasRole, globalConfigs } = useAuth();
  const { laboratoriesRepres, loadingLab } = useLaboratoriesData();

  const [currentDateTime, setCurrentDateTime] = useState({ date: "", time: "" });
  const [productoImagen, setProductoImagen] = useState<ProductoImagen | null>(null);

  const imagenesActivas = useMemo(() => {
    const config = globalConfigs.find(c => c.cod_config === 'IMAGEN_PROD');
    return config?.est_config === 'A' && config?.llave_config === '1';
  }, [globalConfigs]);

  const puedeGestionarImagenes = imagenesActivas && isAdmin();

  const listData = usePriceList(isAuthenticated, user, isAdmin());
  const modals = useProductModals();
  const { ventas, etiquetas: etiquetasVentas } = useVentasTresMeses(isAuthenticated);
  const { imagenes, actualizarImagen } = useImagenesProducto(imagenesActivas && isAuthenticated);

  useEffect(() => {
    const now = new Date();
    setCurrentDateTime({ date: now.toLocaleDateString("es-ES"), time: now.toLocaleTimeString("es-ES") });
  }, []);

  return (
      <div className="grid gap-6">
          <div className='flex justify-between items-center gap-2'>
              <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Lista de Precios por Lote</h1>
                  <p className="text-muted-foreground">Gestión de inventario DIFAR</p>
              </div>
              <div className="flex items-center gap-2">
                  {isAdmin() && (
                      <QuickPriceEditModal
                          filteredData={listData.filteredPricesLot.map(item => ({
                              codArticulo: item.prod_codigo,
                              nombre: item.prod_descripcion || "Sin nombre",
                              presentacion: item.prod_presentacion || "N/A",
                              precioCredito: Number(item.precio_credito || 0),
                              bonifCredito: Number(item.precio_bonif_cred || 0)
                          }))}
                      />
                  )}
                  {isAdmin() && (
                      <CreateProductModal
                          laboratories={laboratoriesRepres}
                          user={user}
                          onProductCreated={() => window.location.reload()}
                      />
                  )}
              </div>
          </div>

          <PriceFilters
              searchTerm={listData.searchTerm} setSearchTerm={listData.setSearchTerm}
              selectedLabs={listData.selectedLabs} setSelectedLabs={listData.setSelectedLabs}
              laboratories={laboratoriesRepres}
              excludeNoStock={listData.excludeNoStock} setExcludeNoStock={listData.setExcludeNoStock}
              lowStockThreshold={listData.lowStockThreshold} setLowStockThreshold={listData.setLowStockThreshold}
              isGerente={hasRole('gerente')}
              isAdmin={isAdmin()}
              selectedPrinciple={listData.selectedPrinciple}
              setSelectedPrinciple={listData.setSelectedPrinciple}
              uniquePrinciples={listData.uniquePrinciples}
          />

        <Card className="bg-background shadow-sm overflow-auto">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-foreground">
                    Lista de Productos
                </CardTitle>
                <CardDescription>
                  Mostrando {listData.paginatedData.length} de {listData.filteredPricesLot.length} productos
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <ExportExcelButton payload={listData.exportPayload} filters={listData.exportFilters} />
                <ExportPdfButton payload={listData.exportPayload} filters={listData.exportFilters} />
                <div className="text-sm text-muted-foreground text-right hidden sm:block">
                  {currentDateTime.date} | {currentDateTime.time}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <PriceTable
                data={listData.paginatedData}
                loading={listData.loading || loadingLab || !isAuthenticated}
                onOpenLots={modals.lots.onOpen}
                onOpenPrices={modals.prices.onOpen}
                onOpenKardex={modals.kardex.onOpen}
                ventas={ventas}
                etiquetasVentas={etiquetasVentas}
                imagenesActivas={imagenesActivas}
                imagenes={imagenes}
                onOpenImagen={(item: any) => setProductoImagen({
                  codigo: item.prod_codigo,
                  descripcion: item.prod_descripcion,
                  presentacion: item.prod_presentacion,
                })}
            />
          </CardContent>

          {listData.filteredPricesLot.length > 0 && (
              <PricePagination
                  currentPage={listData.currentPage}
                  totalPages={listData.totalPages}
                  itemsPerPage={listData.itemsPerPage}
                  onPageChange={listData.setCurrentPage}
                  onItemsPerPageChange={(val: number) => {
                    listData.setItemsPerPage(val);
                    listData.setCurrentPage(1);
                  }}
              />
          )}
        </Card>

        <PriceModals modals={modals} user={user} isAdmin={isAdmin}  />

        {imagenesActivas && (
            <ArticuloImagenModal
                open={!!productoImagen}
                onOpenChange={(abierto) => { if (!abierto) setProductoImagen(null); }}
                producto={productoImagen}
                ruta={productoImagen ? (imagenes.get(productoImagen.codigo) ?? null) : null}
                puedeGestionar={puedeGestionarImagenes}
                usuarioMod={user?.nombreCompleto}
                onImagenChange={actualizarImagen}
            />
        )}
      </div>
  );
}