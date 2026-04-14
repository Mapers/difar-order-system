'use client'
import { useEffect, useState } from "react"
import { use } from "react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import {Pedido, PedidoDet} from "@/app/dashboard/estados-pedidos/page"
import { AuthorizationModal } from "@/components/modal/authorization-modal"
import OrderDetailView from "@/components/OrderDetailView";

export default function MisPedidosDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params)
  const auth = useAuth()

  const [pedido,   setPedido]   = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const [authOpen,    setAuthOpen]    = useState(false)
  const [authAction,  setAuthAction]  = useState<'authorize' | 'reject'>('authorize')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const cab = await apiClient.get(`/pedidos/${id}`)
        let url = `/pedidosDetalles/${id}/detalles`
        if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`
        const det = await apiClient.get(url)
        setPedido(cab.data.data)
        setDetalles(det.data.data.map(i => ({ ...i, cantPedido: Number(i.cantPedido) })))
      } catch { setError("Error al cargar el pedido") }
      finally { setLoading(false) }
    }
    fetch()
  }, [id, auth.user])

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
    } finally { setAuthLoading(false) }
  }

  const canAuthorize = auth.user?.idRol !== 1
      && pedido?.por_autorizar === 'S'
      && !pedido?.is_autorizado

  return (
      <>
        <OrderDetailView
            context="mis-pedidos"
            backHref="/dashboard/mis-pedidos"
            pedido={pedido}
            detalles={detalles}
            loading={loading}
            error={error}
            canAuthorize={canAuthorize}
            onAuthorize={() => { setAuthAction('authorize'); setAuthOpen(true) }}
            onReject={() => { setAuthAction('reject'); setAuthOpen(true) }}
            authLoading={authLoading}
        />
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