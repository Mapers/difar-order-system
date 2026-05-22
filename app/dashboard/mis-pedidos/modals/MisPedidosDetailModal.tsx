'use client'
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"
import { AuthorizationModal } from "@/components/modal/authorization-modal"
import OrderDetailView from "@/components/OrderDetailView"

interface MisPedidosDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nroPedido: string
}

export function MisPedidosDetailModal({ open, onOpenChange, nroPedido }: MisPedidosDetailModalProps) {
  const auth = useAuth()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authAction, setAuthAction] = useState<'authorize' | 'reject'>('authorize')
  const [authLoading, setAuthLoading] = useState(false)

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
        setDetalles(det.data.data.map((i: any) => ({ ...i, cantPedido: Number(i.cantPedido) })))
      } catch {
        setError("Error al cargar el pedido")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [open, nroPedido, auth.user])

  const handleAuthorize = async () => {
    if (!pedido) return
    setAuthLoading(true)
    try {
      await apiClient.post('/pedidos/autorizar', {
        nroPedido: pedido.nroPedido,
        status: authAction === 'authorize' ? 'S' : 'N'
      })
      setPedido(prev => prev ? { ...prev, is_autorizado: authAction === 'authorize' ? 'S' : 'N' } : null)
      setAuthOpen(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) setAuthOpen(false)
    onOpenChange(val)
  }

  const canAuthorize = auth.user?.idRol !== 1
    && pedido?.por_autorizar === 'S'
    && !pedido?.is_autorizado

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Detalle del Pedido {nroPedido}</DialogTitle>
          <OrderDetailView
            isModal
            context="mis-pedidos"
            pedido={pedido}
            detalles={detalles}
            loading={loading}
            error={error}
            canAuthorize={canAuthorize}
            onAuthorize={() => { setAuthAction('authorize'); setAuthOpen(true) }}
            onReject={() => { setAuthAction('reject'); setAuthOpen(true) }}
            authLoading={authLoading}
          />
        </DialogContent>
      </Dialog>
      <AuthorizationModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        pedido={pedido}
        action={authAction}
        onConfirm={handleAuthorize}
        loading={authLoading}
      />
    </>
  )
}
