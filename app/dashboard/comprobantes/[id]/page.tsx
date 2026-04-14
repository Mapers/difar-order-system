'use client'
import { useEffect, useState } from "react"
import { use } from "react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import {Pedido, PedidoDet} from "@/app/dashboard/estados-pedidos/page"
import OrderDetailView from "@/components/OrderDetailView";

export default function ComprobantesDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params)
  const auth = useAuth()

  const [pedido,   setPedido]   = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const cab = await apiClient.get(`/pedidos/${id}`)
        let url = `/pedidosDetalles/${id}/detalles`
        if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`
        const det = await apiClient.get(url)
        setPedido(cab.data.data)
        setDetalles(det.data.data)
      } catch { setError("Error al cargar el pedido") }
      finally { setLoading(false) }
    }
    fetch()
  }, [id, auth.user])

  return (
      <OrderDetailView
          context="comprobantes"
          backHref="/dashboard/comprobantes"
          pedido={pedido}
          detalles={detalles}
          loading={loading}
          error={error}
      />
  )
}