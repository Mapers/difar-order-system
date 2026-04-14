'use client'
import React, {useState} from "react"
import { Card, CardContent } from "@/components/ui/card"
import {User, Package, FileText, BookOpen} from "lucide-react"
import { StepProgress } from "@/components/step-progress"
import { LaboratorioModal } from "@/components/tomar-pedido/laboratorio-modal"
import AlternativeProductsModal from "@/components/tomar-pedido/AlternativeProductsModal"
import { useLaboratoriesData } from "@/app/dashboard/lista-precios-lote/hooks/useLaboratoriesData"
import {useOrderPage} from "@/app/hooks/useOrder";
import ClientStep from "@/components/tomar-pedido/Clientstep";
import ProductStep from "@/components/tomar-pedido/Productstep";
import LotesModal from "@/components/tomar-pedido/Lotesmodal";
import AutoCreateClientModal from "@/components/tomar-pedido/Autocreateclientmodal";
import ClientDataConfirmModal from "@/components/tomar-pedido/Clientdataconfirmmodal";
import SummaryStep from "@/components/tomar-pedido/Summarystep";
import ProductDetailsModal from "@/components/tomar-pedido/Productdetailsmodal";
import DraftsModal from "@/components/tomar-pedido/DraftsModal";
import {OrderDraft, useOrderDrafts} from "@/app/hooks/useOrderDrafts";
import {toast} from "@/app/hooks/useToast";
import {Button} from "@/components/ui/button";

const steps = [
  { label: "Cliente", icon: User },
  { label: "Productos", icon: Package },
  { label: "Resumen", icon: FileText },
]

export default function OrderPage() {
  const { laboratories } = useLaboratoriesData()
  const order = useOrderPage()

  const { savedDrafts, saveDraft, deleteDraft } = useOrderDrafts()
  const [showDraftsDialog, setShowDraftsDialog] = useState(false)

  const handleSaveDraft = () => {
    const currentState = order.getOrderStateForDraft()
    saveDraft(currentState)
    toast({
      title: "Borrador guardado",
      description: "El pedido se ha guardado en tus pendientes.",
      variant: "success",
    })
  }

  const handleApplyDraft = (draft: OrderDraft) => {
    order.loadStateFromDraft(draft)
    setShowDraftsDialog(false)
    toast({
      title: "Borrador cargado",
      description: "Se han restaurado los datos del pedido.",
    })
  }

  return (
      <div className="grid gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tomar Pedido</h1>
            <p className="text-gray-500">Crea un nuevo pedido siguiendo los pasos.</p>
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

        <Card className="mb-6 shadow-md bg-white">
          <CardContent className="pt-6">
            <StepProgress steps={steps} currentStep={order.currentStep} onStepClick={order.goToStep} />
          </CardContent>
        </Card>

        <form onSubmit={order.handleSubmit}>
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
                  onConfirmOrder={order.handleSaveOrder}
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
            onSaveOrder={order.handleSaveOrder}
            onSaveOrderAndUpdateClient={() => {
              order.handleSaveOrder()
              order.updateClientData()
            }}
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
      </div>
  )
}