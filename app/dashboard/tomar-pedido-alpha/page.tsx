'use client'
import React, {useState} from "react"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {Sparkles, Eraser} from "lucide-react"
import { LaboratorioModal } from "@/components/tomar-pedido/laboratorio-modal"
import AlternativeProductsModal from "@/components/tomar-pedido/AlternativeProductsModal"
import { useLaboratoriesData } from "@/app/dashboard/lista-precios-lote/hooks/useLaboratoriesData"
import {useOrderPage} from "@/app/hooks/useOrder";
import { useAuth } from "@/context/authContext"
import { useMetasItems } from "@/app/hooks/useMetasItems"
import ClientWidgetAlpha from "@/components/tomar-pedido/ClientWidgetAlpha";
import ProductWidgetAlpha from "@/components/tomar-pedido/ProductWidgetAlpha";
import OrderSummarySidebar from "@/components/tomar-pedido/OrderSummarySidebar";
import LotesModal from "@/components/tomar-pedido/Lotesmodal";
import AutoCreateClientModal from "@/components/tomar-pedido/Autocreateclientmodal";
import ClientDataConfirmModal from "@/components/tomar-pedido/Clientdataconfirmmodal";
import ProductDetailsModal from "@/components/tomar-pedido/Productdetailsmodal";
import AlmacenModal from "@/components/tomar-pedido/AlmacenModal";

// Tomar Pedido Alpha v2: ya no es un wizard por pasos. Es una sola sección
// con dos widgets visibles a la vez —Seleccionar Cliente y Seleccionar
// Producto— para no obligar a ir y volver entre pantallas. Los buscadores
// (cliente, vendedor, producto) son autocompletados inline en vez de abrir
// un modal aparte. Reutiliza el mismo hook useOrderPage que el módulo
// original: no modifica /dashboard/tomar-pedido.
//
// A diferencia del módulo original, esta versión Alpha NO incluye guardado
// de borradores (ni el botón "Guardar como borrador", ni el auto-guardado
// en segundo plano, ni el aviso de "pedido pendiente" al volver a entrar).
// Se retiró a pedido explícito, solo para esta sección — si en algún
// momento se quiere reincorporar, el patrón de referencia (useOrderDrafts +
// useAutoSaveDraft + DraftsModal + el AlertDialog de "pedido pendiente")
// sigue intacto y funcionando en app/dashboard/tomar-pedido/page.tsx.
export default function OrderPageAlpha() {
  const { laboratories } = useLaboratoriesData()
  const order = useOrderPage()
  const { user } = useAuth()

  const codVendedor = order.isAdmin()
      ? (order.seller?.codigo ?? null)
      : (user?.codigo ?? null)
  const metasMap = useMetasItems(codVendedor)

  // Ya no hay pasos: la validez de "puedo confirmar" depende solo de que
  // los productos estén completos (mismas reglas que useOrder.isStepValid
  // caso 1, reproducidas aquí porque ese hook razona en términos de step).
  const isProductSelectionValid =
      order.selectedProducts.length > 0 &&
      !order.selectedProducts.some((item) => !item.lote)

  // Cliente y Producto se comportan como un acordeón: abrir uno cierra el
  // otro, pero solo por click manual del usuario en el header — nada se
  // abre o cierra solo. Arranca en Cliente.
  const [openWidget, setOpenWidget] = useState<'client' | 'product' | null>('client')

  // El panel de resumen recién tiene algo que mostrar cuando ya hay cliente
  // o productos — antes de eso queda oculto y el contenido principal se ve
  // centrado sin el hueco de una columna vacía a la derecha.
  const showSummary = !!order.selectedClient || order.selectedProducts.length > 0

  const [showClearOrderDialog, setShowClearOrderDialog] = useState(false)
  const handleClearOrder = () => {
    order.clear()
    order.handleClientSelect(null)
    order.setNote('')
    setOpenWidget('client')
    setShowClearOrderDialog(false)
  }

  return (
      <div className="grid gap-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Tomar Pedido</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/40 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <Sparkles className="h-3 w-3" /> Alpha
              </span>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">Cliente y productos en una sola pantalla, sin pasos.</p>
          </div>
        </div>

        <div className={showSummary ? "grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start" : "grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full"}>
        <form onSubmit={(e) => order.handleSubmit(e)} className="min-w-0">
          <div className="grid grid-cols-1 gap-6">
            <ClientWidgetAlpha
                search={order.search}
                setSearch={order.setSearch}
                loadingClients={order.loading.clients}
                loadingSellers={order.loading.sellers}
                clientsFiltered={order.clientsFiltered}
                selectedClient={order.selectedClient}
                sellersFiltered={order.sellersFiltered}
                seller={order.seller}
                conditions={order.conditions}
                condition={order.condition}
                currency={order.currency}
                nameZone={order.nameZone}
                unidadTerritorio={order.unidadTerritorio}
                contactoPedido={order.contactoPedido}
                referenciaDireccion={order.referenciaDireccion}
                isAdmin={order.isAdmin()}
                onClientSelect={order.handleClientSelect}
                onSellerSearch={order.setSellerSearch}
                onSellerSelect={order.handleSellerSelect}
                onChangeContactoPedido={order.handleChangeContactoPedido}
                onChangeReferenciaDireccion={order.handleChangeReferenciaDireccion}
                onUpdateClient={order.handleUpdateClient}
                onConditionChange={order.handleConditionSelect}
                onCurrencyChange={order.handleCurrencySelect}
                sellerSearch={order.sellerSearch}
                open={openWidget === 'client'}
                onOpenChange={(v) => setOpenWidget(v ? 'client' : null)}
            />

            <ProductWidgetAlpha
                selectedProduct={order.selectedProduct}
                filteredProducts={order.filteredProducts}
                searchQuery={order.searchQuery}
                onSearchQueryChange={order.setSearchQuery}
                onProductSelect={order.handleProductSelect}
                currency={order.currency}
                priceType={order.priceType}
                onPriceTypeChange={order.setPriceType}
                priceEdit={order.priceEdit}
                onPriceEditChange={order.setPriceEdit}
                onPriceEditBlur={(e) => {
                  if (e.target.value && e.target.value !== '0') {
                    const numValue = parseFloat(e.target.value);
                    order.setPriceEdit(isNaN(numValue) ? 0 : Number(numValue));
                  }
                }}
                quantity={order.quantity}
                onQuantityChange={order.setQuantity}
                laboratories={laboratories}
                selectedLaboratorio={order.selectedLaboratorio}
                onLaboratorioChange={(val) => {
                  order.setSelectedLaboratorio(val);
                  order.setShowLaboratorioModal(true);
                }}
                onAddProduct={order.handleAddProduct}
                isLoading={order.isLoading}
                modalLoader={order.modalLoader}
                onIsLoadingChange={() => {}}
                loadingProducts={order.loading.products}
                selectedProducts={order.selectedProducts}
                productosConLotes={order.productosConLotes}
                onRemoveItem={order.handleRemoveItem}
                onChangeLote={order.handleListarLotes}
                isStepValid={isProductSelectionValid}
                onUpdateProducts={order.setSelectedProducts}
                onClearAll={order.clear}
                metasMap={metasMap}
                note={order.note}
                onNoteChange={order.setNote}
                isLoadingSave={order.isLoadingSave}
                onConfirmOrder={() => order.handleSaveOrder()}
                selectedAlmacen={order.selectedAlmacen}
                almacenes={order.almacenes}
                loadingAlmacenes={order.loading.almacenes}
                onSelectAlmacen={(alm) => order.cambiarAlmacen(alm)}
                autoFocusSearch={!!order.selectedClient}
                onClearOrder={() => setShowClearOrderDialog(true)}
                open={openWidget === 'product'}
                onOpenChange={(v) => setOpenWidget(v ? 'product' : null)}
            />
          </div>
        </form>

        {showSummary && (
            <aside className="hidden lg:block lg:sticky lg:top-20">
              <OrderSummarySidebar
                  selectedClient={order.selectedClient}
                  condition={order.condition}
                  currency={order.currency}
                  selectedProducts={order.selectedProducts}
              />
            </aside>
        )}
        </div>

        <LaboratorioModal
            open={order.showLaboratorioModal && order.selectedLaboratorio !== null}
            onOpenChange={(v) => {
              order.setShowLaboratorioModal(v)
              // Al cerrar, el filtro vuelve a su estado neutral en vez de
              // quedarse mostrando el nombre del laboratorio para siempre.
              if (!v) order.setSelectedLaboratorio(null)
            }}
            laboratorio={order.selectedLaboratorio || ""}
            products={order.products}
            onAddTempProduct={order.handleAddTempProduct}
            tempSelectedProducts={order.tempSelectedProducts}
            onRemoveTempProduct={order.handleRemoveTempProduct}
            onConfirmSelection={order.handleConfirmSelection}
            currency={order.currency}
            idAlmacen={order.selectedAlmacen?.IdAlmacen}
        />

        <LotesModal
            open={order.showLotesModal}
            onOpenChange={order.setShowLotesModal}
            editingLotes={order.editingLotes}
            loadingLotes={order.loadingLotes}
            onLoteChange={order.handleLoteChange}
            onConfirm={order.handleConfirmarLotes}
        />

        <ClientDataConfirmModal
            open={order.showClientDataConfirmModal}
            onOpenChange={order.setShowClientDataConfirmModal}
            onSaveOrder={() => order.handleSaveOrder()}
            onSaveOrderAndUpdateClient={() => order.handleSaveOrder(order.updateClientData)}
        />

        <ProductDetailsModal
            open={order.isViewModalOpen}
            onOpenChange={order.setIsViewModalOpen}
            viewingProduct={order.viewingProduct}
            escalas={order.escalas}
            bonificaciones={order.bonificaciones}
        />

        <AutoCreateClientModal
            open={order.isAutoCreateModalOpen}
            onOpenChange={order.setIsAutoCreateModalOpen}
            documentNumber={order.search.client}
            isCreating={order.isAutoCreating}
            onAutoCreate={order.handleAutoCreateClient}
        />

        <AlternativeProductsModal
            open={order.showAlternativesModal}
            onOpenChange={order.setShowAlternativesModal}
            originalProduct={order.outOfStockProduct}
            alternatives={order.alternativeProducts}
            currency={order.currency}
            onSelectAlternative={order.proceedWithProductSelection}
            onProceedWithOriginal={order.proceedWithProductSelection}
        />

        <AlertDialog open={showClearOrderDialog} onOpenChange={setShowClearOrderDialog}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Eraser className="h-5 w-5" />
                Limpiar pedido
              </AlertDialogTitle>
              <AlertDialogDescription>
                Se va a quitar el cliente y todos los productos que llevás cargados. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearOrder} className="bg-red-600 hover:bg-red-700 text-white">
                Sí, limpiar todo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

          <AlmacenModal
              open={order.showAlmacenModal}
              onOpenChange={order.setShowAlmacenModal}
              almacenes={order.almacenes}
              loading={order.loading.almacenes}
              selectedAlmacen={order.selectedAlmacen}
              onSelectAlmacen={(alm) => {
                  order.cambiarAlmacen(alm)
                  order.setShowAlmacenModal(false)
              }}
          />
      </div>
  )
}
