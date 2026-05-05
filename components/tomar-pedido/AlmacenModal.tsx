'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2 } from "lucide-react"
import { IAlmacen } from "@/app/types/order/product-interface"

interface AlmacenModalProps {
    open:               boolean
    onOpenChange:       (open: boolean) => void
    almacenes:          IAlmacen[]
    selectedAlmacen:    IAlmacen | null
    onSelectAlmacen:    (alm: IAlmacen) => void
}

export default function AlmacenModal({
                                         open, onOpenChange, almacenes, selectedAlmacen, onSelectAlmacen
                                     }: AlmacenModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Seleccionar Almacén
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <p className="text-sm text-gray-500">
                        Seleccioná el almacén desde el cual se tomará el pedido.
                    </p>

                    {selectedAlmacen && (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            Almacén actual: <span className="font-semibold">{selectedAlmacen.Codigo_Alm} - {selectedAlmacen.Descripcion}</span>
                        </div>
                    )}

                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {almacenes.map((alm) => (
                            <button
                                key={alm.IdAlmacen}
                                onClick={() => onSelectAlmacen(alm)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:border-blue-400 hover:bg-blue-50 ${
                                    selectedAlmacen?.IdAlmacen === alm.IdAlmacen
                                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="p-2 bg-blue-100 rounded-md shrink-0">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-800">
                                        {alm.Codigo_Alm} - {alm.Descripcion}
                                    </p>
                                    <p className="text-xs text-gray-500">ID: {alm.IdAlmacen}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}