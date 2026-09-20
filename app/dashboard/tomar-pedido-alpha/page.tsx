'use client'
import React, {useEffect, useMemo, useRef, useState} from "react"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {User, Package, BookOpen, Clock, ArrowRight, Sparkles, Save, Eraser} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
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
import DraftsModal from "@/components/tomar-pedido/DraftsModal";
import {OrderDraft, useOrderDrafts} from "@/app/hooks/useOrderDrafts";
import {useAutoSaveDraft} from "@/app/hooks/useAutoSaveDraft";
import {toast} from "@/app/hooks/useToast";
import {Button} from "@/components/ui/button";
import AlmacenModal from "@/components/tomar-pedido/AlmacenModal";

// Tomar Pedido Alpha v2: ya no es un wizard por pasos. Es una sola sección
// con dos widgets visibles a la vez —Seleccionar Cliente y Seleccionar
// Producto— para no obligar a ir y volver entre pantallas. Los buscadores
// (cliente, vendedor, producto) son autocompletados inline en vez de abrir
// un modal aparte. Reutiliza el mismo hook useOrderPage que el módulo
// original: no modifica /dashboard/tomar-pedido.
export default function OrderPageAlpha() {
  const { laboratories } = useLaboratoriesData()
  const order = useOrderPage()
  const { user } = useAuth()

  const codVendedor = order.isAdmin()
      ? (order.seller?.codigo ?? null)
      : (user?.codigo ?? null)
  const metasMap = useMetasItems(codVendedor)

  const { savedDrafts, upsertDraft, deleteDraft, limpiarTodos } = useOrderDrafts()
  const [showDraftsDialog, setShowDraftsDialog] = useState(false)
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const draftState = order.getOrderStateForDraft()

  const { markSaved, cancel: cancelAutoSave } = useAutoSaveDraft({
    state: draftState,
    enabled: !!order.selectedClient && !orderConfirmed,
    draftId: activeDraftId,
    upsert: upsertDraft,
    onCreated: setActiveDraftId,
    onSaved: () => {
      toast({
        title: "Pedido guardado",
        description: "Se guardó como pendiente para que lo continúes cuando quieras.",
      })
    },
  })

  const handleSaveDraft = async () => {
    const currentState = order.getOrderStateForDraft()
    const id = await upsertDraft(activeDraftId, currentState)
    if (id) {
      setActiveDraftId(id)
      markSaved(currentState)
      toast({
        title: "Borrador guardado",
        description: "El pedido se ha guardado en tus pendientes.",
        variant: "success",
      })
    } else {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el borrador. Verifica tu sesión.",
        variant: "error",
      })
    }
  }

  const handleLimpiarTodosBorradores = async () => {
    const ok = await limpiarTodos()
    if (ok) setActiveDraftId(null)
    return ok
  }

  const handleApplyDraft = (draft: OrderDraft) => {
    order.loadStateFromDraft(draft)
    setActiveDraftId(draft.id)
    setShowDraftsDialog(false)
    const { id, savedAt, ...rest } = draft
    markSaved(rest as typeof draftState)
    toast({
      title: "Borrador cargado",
      description: "Se han restaurado los datos del pedido.",
    })
  }

  const draftsPendientes = useMemo(
      () => savedDrafts.filter(d => d.id !== activeDraftId),
      [savedDrafts, activeDraftId]
  )

  const draftMasReciente = useMemo(() => {
    if (draftsPendientes.length === 0) return null
    return [...draftsPendientes].sort((a, b) => b.savedAt - a.savedAt)[0]
  }, [draftsPendientes])

  const [showResumePrompt, setShowResumePrompt] = useState(false)
  // Se muestra como máximo una vez por visita a la página — el ref (no
  // estado) asegura que ningún cambio posterior (cambiar de cliente,
  // refetch de borradores, etc.) lo vuelva a disparar en esta sesión.
  const hasShownResumePromptRef = useRef(false)

  useEffect(() => {
    if (hasShownResumePromptRef.current) return
    if (activeDraftId) return
    if (order.selectedClient) return
    if (draftMasReciente) {
      hasShownResumePromptRef.current = true
      setShowResumePrompt(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftMasReciente, activeDraftId])

  const handleResumeDraft = () => {
    if (!draftMasReciente) return
    handleApplyDraft(draftMasReciente)
    setShowResumePrompt(false)
  }

  const handleDismissResumePrompt = () => {
    setShowResumePrompt(false)
  }

  const cleanupDraft = () => {
    setOrderConfirmed(true)
    cancelAutoSave()
    if (activeDraftId) deleteDraft(activeDraftId)
  }

  const handleSaveOrderWithCleanup = (extraAction?: () => void) => {
    order.handleSaveOrder(() => {
      cleanupDraft()
      extraAction?.()
    })
  }

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

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {order.selectedClient && (
                <Button
                    type="button" variant="outline" onClick={handleSaveDraft}
                    className="flex-1 sm:flex-none bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar como borrador
                </Button>
            )}

            {draftsPendientes.length > 0 && (
                <Button
                    variant="outline"
                    onClick={() => setShowDraftsDialog(true)}
                    className="flex-1 sm:flex-none bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Borradores
                  <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {draftsPendientes.length}
                  </span>
                </Button>
            )}
          </div>
        </div>

        <div className={showSummary ? "grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start" : "grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full"}>
        <form onSubmit={(e) => order.handleSubmit(e, cleanupDraft)} className="min-w-0">
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
                onConfirmOrder={() => handleSaveOrderWithCleanup()}
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
            onSaveOrder={() => handleSaveOrderWithCleanup()}
            onSaveOrderAndUpdateClient={() => handleSaveOrderWithCleanup(order.updateClientData)}
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

        <DraftsModal
            showDraftsDialog={showDraftsDialog}
            setShowDraftsDialog={setShowDraftsDialog}
            savedDrafts={draftsPendientes}
            deleteDraft={deleteDraft}
            applyDraft={handleApplyDraft}
            limpiarTodos={handleLimpiarTodosBorradores}
        />

        <AlertDialog open={showResumePrompt} onOpenChange={(v) => { if (!v) handleDismissResumePrompt() }}>
          <AlertDialogContent className="max-w-md gap-0 overflow-hidden p-0">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-6 pb-5 pt-6 dark:from-amber-950/30 dark:to-orange-950/20">
              <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-900/40 dark:text-amber-400">
                  <Clock className="h-7 w-7" />
                </div>
                <AlertDialogTitle className="text-xl">Tenés un pedido pendiente</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Se interrumpió antes de terminarlo. ¿Querés continuarlo donde lo dejaste?
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>

            {draftMasReciente && (
                <div className="mx-6 -mt-2 mb-1 space-y-2.5 rounded-xl border bg-background p-4 text-sm shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="min-w-0 truncate font-semibold text-foreground">
                      {draftMasReciente.nombre || 'Cliente sin nombre'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">
                      {draftMasReciente.selectedProducts?.length || 0} producto{draftMasReciente.selectedProducts?.length === 1 ? '' : 's'} agregado{draftMasReciente.selectedProducts?.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Clock className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground">
                      Guardado {formatDistanceToNow(draftMasReciente.savedAt, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>
            )}

            <AlertDialogFooter className="flex-col gap-2 px-6 pb-6 pt-3 sm:flex-row">
              <AlertDialogCancel
                  onClick={handleDismissResumePrompt}
                  className="w-full sm:w-auto"
              >
                Empezar nuevo pedido
              </AlertDialogCancel>
              <AlertDialogAction
                  onClick={handleResumeDraft}
                  className="w-full gap-1.5 bg-amber-600 text-white hover:bg-amber-700 sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Continuar pedido
                <ArrowRight className="h-4 w-4" />
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
