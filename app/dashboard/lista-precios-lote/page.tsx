'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/authContext';
import { useLaboratoriesData } from "./hooks/useLaboratoriesData";
import { usePriceList } from "./hooks/usePriceList";
import { useProductModals } from "./hooks/useProductModals";
import ExportPdfButton from "@/app/dashboard/lista-precios-lote/export-pdf-button";
import {PriceFilters} from "@/components/lista-precios-lote/PriceFilters";
import {PriceTable} from "@/components/lista-precios-lote/PriceTable";
import {PriceModals} from "@/components/lista-precios-lote/PriceModals";
import {PricePagination} from "@/components/lista-precios-lote/PricePagination";
import {CreateProductModal} from "@/components/lista-precios-lote/CreateProductModal";
import {BulkPriceUploadModal} from "@/components/lista-precios-lote/BulkPriceUploadModal";

export default function PricePage() {
  const { user, isAuthenticated } = useAuth();
  const { laboratories, loadingLab } = useLaboratoriesData();

  const [currentDateTime, setCurrentDateTime] = useState({ date: "", time: "" });

  const listData = usePriceList(isAuthenticated);
  const modals = useProductModals();

  useEffect(() => {
    const now = new Date();
    setCurrentDateTime({ date: now.toLocaleDateString("es-ES"), time: now.toLocaleTimeString("es-ES") });
  }, []);

  return (
      <div className="grid gap-6">
          <div className='flex justify-between items-center gap-2'>
              <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lista de Precios por Lote</h1>
                  <p className="text-gray-500">Gestión de inventario DIFAR</p>
              </div>
              <div className="flex items-center gap-2">
                  {user?.idRol && [2, 3].includes(user.idRol) && (
                      <BulkPriceUploadModal
                          onUploadSuccess={() => window.location.reload()}
                          filteredData={listData.filteredPricesLot.map(item => ({
                              codArticulo: item.prod_codigo,
                              precio1: Number(item.precio_contado),
                              precio2: Number(item.precio_credito),
                              precio3: Number(item.precio_bonif_cont),
                              precio4: Number(item.precio_bonif_cred)
                          }))}
                      />
                  )}
                  {user?.idRol && [2, 3].includes(user.idRol) && (
                      <CreateProductModal
                          laboratories={laboratories}
                          user={user}
                          onProductCreated={() => window.location.reload()}
                      />
                  )}
              </div>
          </div>

        <PriceFilters
            searchTerm={listData.searchTerm} setSearchTerm={listData.setSearchTerm}
            selectedLabs={listData.selectedLabs} setSelectedLabs={listData.setSelectedLabs}
            laboratories={laboratories}
            excludeNoStock={listData.excludeNoStock} setExcludeNoStock={listData.setExcludeNoStock}
        />

        <Card className="bg-white shadow-sm overflow-auto">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-gray-800">
                    Lista de Productos
                </CardTitle>
                <CardDescription>
                  Mostrando {listData.paginatedData.length} de {listData.filteredPricesLot.length} productos
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <ExportPdfButton payload={listData.exportPayload} />
                <div className="text-sm text-gray-500 text-right hidden sm:block">
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

        <PriceModals modals={modals} user={user} />
      </div>
  );
}