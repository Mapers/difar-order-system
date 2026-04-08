'use client'
import React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen, X } from "lucide-react"
import { format } from "date-fns"
import { OrderDraft } from "@/app/hooks/useOrderDrafts"

interface DraftsModalProps {
    showDraftsDialog: boolean
    setShowDraftsDialog: (open: boolean) => void
    savedDrafts: OrderDraft[]
    deleteDraft: (id: string) => void
    applyDraft: (draft: OrderDraft) => void
}

export default function DraftsModal({
                                        showDraftsDialog, setShowDraftsDialog, savedDrafts, deleteDraft, applyDraft
                                    }: DraftsModalProps) {
    return (
        <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
            <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden
        fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[85vh] w-full
        sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[580px] sm:h-auto sm:max-h-[80vh] sm:max-w-[95vw]">
                <DialogTitle className="sr-only">Pedidos pendientes</DialogTitle>

                <div className="flex items-center justify-between px-4 py-3.5 border-b dark:border-gray-700 shrink-0 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-md">
                            <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Pedidos pendientes</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{savedDrafts.length} borrador{savedDrafts.length !== 1 ? 'es' : ''} guardado{savedDrafts.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowDraftsDialog(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-3 space-y-2.5">
                    {savedDrafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                            <BookOpen className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No hay borradores guardados</p>
                            <p className="text-xs mt-1 opacity-70">Guarda un pedido para continuar después</p>
                        </div>
                    ) : savedDrafts.map(draft => {
                        const savedDate = new Date(draft.savedAt)
                        const total = draft.selectedProducts.reduce((sum, item) => {
                            const pu = item.isBonification ? 0 : item.appliedScale?.precio_escala ?? item.finalPrice ?? 0
                            return sum + Number(pu) * item.quantity
                        }, 0)
                        const stepLabels = ['Cliente', 'Productos', 'Resumen']
                        const sym = draft.currency?.value === 'PEN' ? 'S/.' : '$'
                        return (
                            <div key={draft.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="flex items-start justify-between gap-2 px-4 pt-3.5 pb-2.5 border-b dark:border-gray-700/60">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {draft.selectedClient?.Nombre ?? <span className="text-gray-400 italic font-normal">Sin cliente</span>}
                                        </p>
                                        {draft.selectedClient && (
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                                                RUC: {draft.selectedClient.RUC} · {draft.selectedClient.Dirección ?? '—'}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm" variant="ghost" onClick={() => deleteDraft(draft.id)}
                                        className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 -mt-0.5 -mr-1"
                                        title="Eliminar borrador"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5 px-4 py-3">
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide">Productos</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{draft.selectedProducts.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide">Total</p>
                                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{sym}{total.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide">Condición</p>
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5 truncate">{draft.condition?.Descripcion ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wide">Vendedor</p>
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5 truncate">
                                            {draft.seller ? `${draft.seller.nombres} ${draft.seller.apellidos}`.trim() : '—'}
                                        </p>
                                    </div>
                                </div>

                                {draft.selectedProducts.length > 0 && (
                                    <div className="px-4 pb-2">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg divide-y divide-gray-100 dark:divide-gray-700/50 overflow-hidden">
                                            {draft.selectedProducts.slice(0, 3).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between px-3 py-1.5 gap-2">
                                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate flex-1">{item.product.NombreItem}</p>
                                                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                                                        <span className="text-gray-400">×{item.quantity}</span>
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">{sym}{((item.finalPrice ?? 0) * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {draft.selectedProducts.length > 3 && (
                                                <div className="px-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 italic">
                                                    +{draft.selectedProducts.length - 3} producto(s) más...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/30 border-t dark:border-gray-700/60">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                            {stepLabels[draft.currentStep] ?? `Paso ${draft.currentStep + 1}`}
                                        </span>
                                        <span className="text-[11px] text-gray-400 dark:text-gray-500">{format(savedDate, "dd/MM/yy · HH:mm")}</span>
                                    </div>
                                    <Button
                                        size="sm" onClick={() => applyDraft(draft)}
                                        className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white px-4"
                                    >
                                        Continuar pedido
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}