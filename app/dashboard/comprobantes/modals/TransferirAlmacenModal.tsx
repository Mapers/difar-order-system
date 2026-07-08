'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeftRight, ArrowRight, Check, ChevronDown, Loader2, Warehouse } from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/app/api/client"
import { Comprobante } from "@/app/types/order/order-interface"
import { IAlmacen } from "@/app/types/order/product-interface"

interface TransferirAlmacenModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    comprobante: Comprobante | null
    isProcessing: boolean
    onConfirm: (nuevoIdAlmacen: number) => void
}

export function TransferirAlmacenModal({ open, onOpenChange, comprobante, isProcessing, onConfirm }: TransferirAlmacenModalProps) {
    const [almacenes, setAlmacenes] = useState<IAlmacen[]>([])
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [selected, setSelected] = useState<IAlmacen | null>(null)

    useEffect(() => {
        if (!open) return
        setSelected(null)
        apiClient.get('/admin/listar/almacenes')
            .then(res => setAlmacenes(res.data?.data?.data || res.data?.data || []))
            .catch(() => setAlmacenes([]))
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-700">
                        <ArrowLeftRight className="h-5 w-5" />
                        Transferir Almacén
                    </DialogTitle>
                    <DialogDescription>
                        Reasigna el almacén de este comprobante.
                    </DialogDescription>
                </DialogHeader>

                {comprobante && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center gap-3 rounded-lg border bg-gray-50 p-3">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <span className="text-[10px] font-semibold uppercase text-gray-400">Actual</span>
                                <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
                                    <Warehouse className="h-3.5 w-3.5 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-800">{comprobante.Almacen || "Sin asignar"}</span>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 shrink-0 text-gray-400" />
                            <div className="flex flex-col items-center gap-1 text-center">
                                <span className="text-[10px] font-semibold uppercase text-gray-400">Nuevo</span>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="h-8 justify-between gap-1.5 bg-white px-3 text-sm font-normal">
                                            {selected ? selected.Descripcion : "Seleccionar..."}
                                            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0" align="center">
                                        <Command>
                                            <CommandInput placeholder="Buscar almacén..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró almacén.</CommandEmpty>
                                                <CommandGroup>
                                                    {almacenes.map(a => (
                                                        <CommandItem
                                                            key={a.IdAlmacen}
                                                            onSelect={() => { setSelected(a); setPopoverOpen(false) }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selected?.IdAlmacen === a.IdAlmacen ? "opacity-100" : "opacity-0")} />
                                                            {a.Descripcion}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Documento: <span className="font-mono font-medium text-gray-700">{comprobante.serie}-{comprobante.numero}</span>
                        </p>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => selected && onConfirm(selected.IdAlmacen)}
                        disabled={isProcessing || !selected}
                    >
                        {isProcessing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transfiriendo...</>
                        ) : (
                            <><ArrowLeftRight className="mr-2 h-4 w-4" /> Confirmar Transferencia</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
