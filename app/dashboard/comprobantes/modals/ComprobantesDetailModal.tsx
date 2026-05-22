'use client'
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"
import OrderDetailView from "@/components/OrderDetailView"

interface ComprobantesDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nroPedido: string
}

export function ComprobantesDetailModal({ open, onOpenChange, nroPedido }: ComprobantesDetailModalProps) {
  const auth = useAuth()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !nroPedido) return
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const cab = await apiClient.get(`/pedidos/${nroPedido}`)
        let url = `/pedidosDetalles/${nroPedido}/detalles`
        if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`
        const det = await apiClient.get(url)
        setPedido(cab.data.data)
        setDetalles(det.data.data)
      } catch {
        setError("Error al cargar el pedido")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [open, nroPedido, auth.user])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Detalle del Pedido {nroPedido}</DialogTitle>
        <OrderDetailView
          isModal
          context="comprobantes"
          pedido={pedido}
          detalles={detalles}
          loading={loading}
          error={error}
        />
      </DialogContent>
    </Dialog>
  )
}
