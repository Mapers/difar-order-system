import { toast } from "@/app/hooks/useToast"
import { ProductoConLotes } from "@/app/types/order/order-interface"

// El stock del lote viaja en el value: "lote|vencimiento|stock".

/** El primero (vence antes) que alcance para la cantidad; si ninguno alcanza, el primero. */
export function primerLoteQueAlcanza(lotes: { value: string; stock: string }[], cantidad: number) {
    return (lotes.find(l => Number(l.stock) >= cantidad) ?? lotes[0])?.value ?? ""
}

/** Avisa y devuelve true si el lote no alcanza para la cantidad pedida. */
export function avisarLoteNoAlcanza(producto: ProductoConLotes, value: string) {
    const [lote, , stock] = value.split('|')
    if (Number(producto.cantidadPedido) <= Number(stock)) return false
    toast({
        title: "No se puede usar ese lote",
        description: `Se piden ${producto.cantidadPedido} y el lote ${lote} solo tiene ${Number(stock)}. Elige otro lote.`,
        variant: "error",
    })
    return true
}
