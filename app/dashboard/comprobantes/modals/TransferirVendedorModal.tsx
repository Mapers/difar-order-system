'use client'

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ArrowLeftRight, ArrowRight, Check, ChevronDown, Loader2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import apiClient from "@/app/api/client"
import { Comprobante } from "@/app/types/order/order-interface"

interface VendedorOption {
    Codigo_Vend: string
    Nombres: string
    Apellidos: string
}

interface TransferirVendedorModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    comprobante: Comprobante | null
    isProcessing: boolean
    onConfirm: (nuevoCodVendedor: string) => void
}

export function TransferirVendedorModal({ open, onOpenChange, comprobante, isProcessing, onConfirm }: TransferirVendedorModalProps) {
    const [vendedores, setVendedores] = useState<VendedorOption[]>([])
    const [popoverOpen, setPopoverOpen] = useState(false)
    const [selected, setSelected] = useState<VendedorOption | null>(null)

    useEffect(() => {
        if (!open) return
        setSelected(null)
        apiClient.get('/usuarios/listar/vendedores')
            .then(res => setVendedores(res.data?.data?.data || res.data?.data || []))
            .catch(() => setVendedores([]))
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-700">
                        <ArrowLeftRight className="h-5 w-5" />
                        Transferir Vendedor
                    </DialogTitle>
                    <DialogDescription>
                        Reasigna el vendedor de este comprobante. Esta acción actualiza el pedido y sus registros de kardex.
                    </DialogDescription>
                </DialogHeader>

                {comprobante && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-center gap-3 rounded-lg border bg-muted p-3">
                            <div className="flex flex-col items-center gap-1 text-center">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Actual</span>
                                <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-foreground">{comprobante.Vendedor || "Sin asignar"}</span>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                            <div className="flex flex-col items-center gap-1 text-center">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Nuevo</span>
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="h-8 justify-between gap-1.5 bg-background px-3 text-sm font-normal">
                                            {selected ? `${selected.Nombres} ${selected.Apellidos}` : "Seleccionar..."}
                                            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-0" align="center">
                                        <Command>
                                            <CommandInput placeholder="Buscar vendedor..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró vendedor.</CommandEmpty>
                                                <CommandGroup>
                                                    {vendedores.map(v => (
                                                        <CommandItem
                                                            key={v.Codigo_Vend}
                                                            onSelect={() => { setSelected(v); setPopoverOpen(false) }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", selected?.Codigo_Vend === v.Codigo_Vend ? "opacity-100" : "opacity-0")} />
                                                            {v.Nombres} {v.Apellidos}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Documento: <span className="font-mono font-medium text-foreground">{comprobante.serie}-{comprobante.numero}</span>
                        </p>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancelar
                    </Button>
                    <Button
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => selected && onConfirm(selected.Codigo_Vend)}
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
