'use client'
import React, {useState} from "react"
import { Card, CardContent } from "@/components/ui/card"
import {User, Package, FileText, BookOpen} from "lucide-react"
import { StepProgress } from "@/components/step-progress"
import { LaboratorioModal } from "@/components/tomar-pedido/laboratorio-modal"
import AlternativeProductsModal from "@/components/tomar-pedido/AlternativeProductsModal"
import { useLaboratoriesData } from "@/app/dashboard/lista-precios-lote/hooks/useLaboratoriesData"
import {useOrderPage} from "@/app/hooks/useOrder";
import { useAuth } from "@/context/authContext"
import { useMetasItems } from "@/app/hooks/useMetasItems"
import ClientStep from "@/components/tomar-pedido/Clientstep";
import ProductStep from "@/components/tomar-pedido/Productstep";
import LotesModal from "@/components/tomar-pedido/Lotesmodal";
import AutoCreateClientModal from "@/components/tomar-pedido/Autocreateclientmodal";
import ClientDataConfirmModal from "@/components/tomar-pedido/Clientdataconfirmmodal";
import SummaryStep from "@/components/tomar-pedido/Summarystep";
import ProductDetailsModal from "@/components/tomar-pedido/Productdetailsmodal";
import DraftsModal from "@/components/tomar-pedido/DraftsModal";
import {OrderDraft, useOrderDrafts} from "@/app/hooks/useOrderDrafts";
import {useAutoSaveDraft} from "@/app/hooks/useAutoSaveDraft";
import {toast} from "@/app/hooks/useToast";
import {Button} from "@/components/ui/button";
import AlmacenModal from "@/components/tomar-pedido/AlmacenModal";

const steps = [
  { label: "Cliente", icon: User },
  { label: "Productos", icon: Package },
  { label: "Resumen", icon: FileText },
]

export default function OrderPage() {
  const { laboratories } = useLaboratoriesData()
  const order = useOrderPage()
  const { user, isVendedor } = useAuth()

  const codVendedor = order.isAdmin()
      ? (order.seller?.codigo ?? null)
      : (user?.codigo ?? null)
  const metasMap = useMetasItems(codVendedor)

  const { savedDrafts, saveDraft, upsertDraft, deleteDraft } = useOrderDrafts()
  const [showDraftsDialog, setShowDraftsDialog] = useState(false)
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null)
  // Una vez confirmado el pedido, el borrador se borra: cualquier autoguardado
  // posterior lo resucitaría como huérfano.
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const draftState = order.getOrderStateForDraft()

  const { markSaved, cancel: cancelAutoSave } = useAutoSaveDraft({
    state: draftState,
    // Sin cliente no hay pedido que valga la pena guardar, y el borrador
    // tampoco tendría nombre: DraftService lo toma de selectedClient.Nombre.
    enabled: !!order.selectedClient && !orderConfirmed,
    draftId: activeDraftId,
    upsert: upsertDraft,
    onCreated: setActiveDraftId,
  })

  const handleSaveDraft = async () => {
    const currentState = order.getOrderStateForDraft()
    // upsert, no create: si ya hay borrador activo (cargado o autoguardado),
    // guardar de nuevo debe pisarlo, no duplicarlo.
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

  const handleApplyDraft = (draft: OrderDraft) => {
    order.loadStateFromDraft(draft)
    setActiveDraftId(draft.id)
    setShowDraftsDialog(false)
    // Lo recién traído de la BD ya está persistido: sin esto, el autoguardado
    // lo re-enviaría apenas cargue.
    const { id, savedAt, ...rest } = draft
    markSaved(rest as typeof draftState)
    toast({
      title: "Borrador cargado",
      description: "Se han restaurado los datos del pedido.",
    })
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

  return (
      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tomar Pedido</h1>
            <p className="text-muted-foreground">Crea un nuevo pedido siguiendo los pasos.</p>
          </div>

          {savedDrafts.length > 0 && (
              <Button
                  variant="outline"
                  onClick={() => setShowDraftsDialog(true)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Borradores
                <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {savedDrafts.length}
                </span>
              </Button>
          )}
        </div>

        <Card className="mb-6 shadow-md bg-background">
          <CardContent className="pt-6">
            <StepProgress steps={steps} currentStep={order.currentStep} onStepClick={order.goToStep} />
          </CardContent>
        </Card>

        <form onSubmit={(e) => order.handleSubmit(e, cleanupDraft)}>
          {order.currentStep === 0 && (
              <ClientStep
                  search={order.search}
                  setSearch={order.setSearch}
                  loadingClients={order.loading.clients}
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
                  onNext={order.nextStep}
                  isStepValid={order.isStepValid() || false}
                  sellerSearch={order.sellerSearch}
                  handleSaveDraft={handleSaveDraft}
              />
          )}

          {order.currentStep === 1 && (
              <ProductStep
                  open={order.open}
                  onOpenChange={order.setOpen}
                  searchQuery={order.searchQuery}
                  onSearchQueryChange={order.setSearchQuery}
                  filteredProducts={order.filteredProducts}
                  selectedProduct={order.selectedProduct}
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
                  onNext={order.nextStep}
                  onPrev={order.prevStep}
                  isStepValid={order.isStepValid() || false}
                  onUpdateProducts={order.setSelectedProducts}
                  onClearAll={order.clear}
                  handleSaveDraft={handleSaveDraft}
                  metasMap={metasMap}
              />
          )}

          {order.currentStep === 2 && (
              <SummaryStep
                  selectedClient={order.selectedClient}
                  condition={order.condition}
                  currency={order.currency}
                  nameZone={order.nameZone}
                  contactoPedido={order.contactoPedido}
                  selectedProducts={order.selectedProducts}
                  productosConLotes={order.productosConLotes}
                  note={order.note}
                  onNoteChange={order.setNote}
                  isLoadingSave={order.isLoadingSave}
                  onRemoveItem={order.handleRemoveItem}
                  onPrev={order.prevStep}
                  handleSaveDraft={handleSaveDraft}
                  onConfirmOrder={() => handleSaveOrderWithCleanup()}
                  metasMap={metasMap}
              />
          )}
        </form>

        <LaboratorioModal
            open={order.showLaboratorioModal && order.selectedLaboratorio !== null}
            onOpenChange={order.setShowLaboratorioModal}
            laboratorio={order.selectedLaboratorio || ""}
            products={order.products}
            onAddTempProduct={order.handleAddTempProduct}
            tempSelectedProducts={order.tempSelectedProducts}
            onRemoveTempProduct={order.handleRemoveTempProduct}
            onConfirmSelection={order.handleConfirmSelection}
            currency={order.currency}
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
            savedDrafts={savedDrafts}
            deleteDraft={deleteDraft}
            applyDraft={handleApplyDraft}
        />

          <AlmacenModal
              open={order.showAlmacenModal}
              onOpenChange={order.setShowAlmacenModal}
              almacenes={order.almacenes}
              selectedAlmacen={order.selectedAlmacen}
              onSelectAlmacen={(alm) => {
                  order.setSelectedAlmacen(alm)
                  order.setShowAlmacenModal(false)
                  order.setCurrentStep(1)
              }}
          />
      </div>
  )
}