'use client'
import { useEffect, useState } from "react"
import { Sucursal } from "@/components/tomar-pedido/SucursalSelector"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"
import { AuthorizationModal } from "@/components/modal/authorization-modal"
import OrderDetailView from "@/components/OrderDetailView"
import { fetchGetAllClients, fetchGetConditions } from "@/app/api/takeOrders"
import { useAgregarProductoPedido } from "@/components/tomar-pedido/useAgregarProductoPedido"
import ModalLoader from "@/components/modal/modalLoader"

interface MisPedidosDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nroPedido: string
  onAuthorized?: () => void
}

export function MisPedidosDetailModal({ open, onOpenChange, nroPedido, onAuthorized }: MisPedidosDetailModalProps) {
  const auth = useAuth()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authAction, setAuthAction] = useState<'authorize' | 'reject'>('authorize')
  const [authLoading, setAuthLoading] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  // Dirección de entrega en edición. Arranca en null: SucursalSelector
  // elige la del cliente al cargar la lista, y si el vendedor no la toca
  // el PUT no la manda y el pedido conserva la que tenía.
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [tempDetalles, setTempDetalles] = useState<PedidoDet[]>([])

  const [openAddModal, setOpenAddModal] = useState(false)
  const [clientsFiltered, setClientsFiltered] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [openClientSearch, setOpenClientSearch] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")

  const [conditions, setConditions] = useState<any[]>([])
  const [selectedCondition, setSelectedCondition] = useState<any | null>(null)
  const [isConditionOpen, setIsConditionOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const agregar = useAgregarProductoPedido(pedido, tempDetalles, setTempDetalles, () => setOpenAddModal(false))

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const cab = await apiClient.get(`/pedidos/${nroPedido}`)
      let url = `/pedidosDetalles/${nroPedido}/detalles`
      if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`
      const det = await apiClient.get(url)
      setPedido(cab.data.data)
      const mapped = det.data.data.map((i: any) => ({ ...i, cantPedido: Number(i.cantPedido) }))
      setDetalles(mapped)
      setTempDetalles(mapped)
    } catch {
      setError("Error al cargar el pedido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !nroPedido) return
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
      onAuthorized?.()
    } finally {
      setAuthLoading(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setAuthOpen(false)
      setIsEditing(false)
      setOpenAddModal(false)
      agregar.reset()
    }
    onOpenChange(val)
  }

  const handleEditToggle = async () => {
    if (isEditing) {
      setTempDetalles(detalles)
      setSelectedClient(null)
      setSelectedCondition(null)
      agregar.reset()
    } else {
      setIsLoading(true)
      try {
        const sellerCode = auth.isAdmin() ? "" : (auth.user?.codigo || "")
        const representante = auth.isAdmin() ? "" : (auth.user?.codRepres || "")
        const [, resCli, resCond] = await Promise.all([
          agregar.iniciar(),
          fetchGetAllClients(sellerCode, auth.isAdmin(), representante),
          fetchGetConditions('')
        ])
        setClientsFiltered(resCli.data?.data?.data || [])
        setConditions(resCond.data?.data?.data || [])

        if (pedido) {
          const currentClient = resCli.data?.data?.data?.find((c: any) => c.codigo === pedido.codigoCliente || c.RUC === pedido.codigoCliente)
          const currentCond = resCond.data?.data?.data?.find((c: any) => c.CodigoCondicion === pedido.condicionPedido)
          setSelectedClient(currentClient || { Nombre: pedido.nombreCliente, RUC: pedido.codigoCliente })
          setSelectedCondition(currentCond || { CodigoCondicion: pedido.CodigoCondicion, Descripcion: pedido.condicionPedido })
        }
      } catch (err) {
        console.error("Error cargando catálogos de edición", err)
      } finally {
        setIsLoading(false)
      }
    }
    setIsEditing(prev => !prev)
  }

  const handleSaveChanges = async () => {
    try {
      const payload = {
        nroPedido: pedido?.nroPedido,
        clientePedido: selectedClient?.codigo || selectedClient?.RUC || pedido?.codigoCliente,
        condicionPedido: selectedCondition?.CodigoCondicion || pedido?.condicionPedido,
        idAlmacen: agregar.idAlmacenAGuardar,
        ...(sucursal && sucursal.direccion && sucursal.direccion !== pedido?.direccionEntrega
            ? { direccionEntrega: sucursal.direccion,
                referenciaDireccion: sucursal.referencia || undefined,
                idSucursal: sucursal.idSucursal || null }
            : {}),
      }
      const payloadDet = {
        insertedId: pedido?.idPedidocab,
        usuario: 0,
        nroPedido: pedido?.nroPedido,
        state: pedido?.estadodePedido,
        detalles: tempDetalles.map(item => ({
          iditemPedido: item.iditemPedido, codigoitemPedido: item.codigoitemPedido,
          cantPedido: Number(item.cantPedido), precioPedido: item.precioPedido,
          isbonificado: item.isBonification ? 1 : 0, isescala: item.isEscale ? 1 : 0,
          lote: item.cod_lote || null, fecVenc: item.fec_venc_lote || null,
          isEdit: item.is_editado || 'N', isAuthorize: item.is_autorizado || 'N',
        }))
      }
      const res = await apiClient.put(`/pedidos/${nroPedido}`, payload)
      if (res.status === 200) {
        const res2 = await apiClient.post('/pedidosDetalles/detalles', payloadDet)
        if (res2.status === 201) {
          const det = await apiClient.get(`/pedidosDetalles/${nroPedido}/detalles`)
          setDetalles(det.data.data)
          setIsEditing(false)
          fetchData()
        }
      }
    } catch {
      setError("Error al guardar los cambios")
    }
  }


  const canAuthorize = auth.isAdmin()
    && pedido?.por_autorizar === 'S'
    && !pedido?.is_autorizado

  // Solo estado 1. En estados-pedidos se admiten además el 2 y el 4, pero acá
  // el pedido deja de ser editable apenas sale del estado inicial.
  const canEdit = pedido?.estadodePedido === 1 && auth.user?.edicion_pedido

  const filteredClients = clientSearchQuery
    ? clientsFiltered.filter(c => String(c?.Nombre || '').toLowerCase().includes(clientSearchQuery.toLowerCase()) || c.RUC?.includes(clientSearchQuery))
    : clientsFiltered

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
            canEdit={canEdit} isEditing={isEditing} tempDetalles={tempDetalles}
            onEditToggle={handleEditToggle} onSaveChanges={handleSaveChanges}
            onRemoveItem={i => { const n = [...tempDetalles]; n.splice(i, 1); setTempDetalles(n) }}
            onQuantityChange={(i, q) => { if (q > 0) { const n = [...tempDetalles]; n[i].cantPedido = String(q); setTempDetalles(n) } }}
            canAddProduct={true} openAddModal={openAddModal}
            onOpenAddModal={setOpenAddModal} addProductSlot={agregar.slot}
            clientsFiltered={filteredClients}
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
            sucursal={sucursal}
            onSucursalSelect={setSucursal}
            openClientSearch={openClientSearch}
            setOpenClientSearch={setOpenClientSearch}
            clientSearchQuery={clientSearchQuery}
            setClientSearchQuery={setClientSearchQuery}
            conditions={conditions}
            selectedCondition={selectedCondition}
            onConditionChange={setSelectedCondition}
            isConditionOpen={isConditionOpen}
            setIsConditionOpen={setIsConditionOpen}
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
      <ModalLoader open={isLoading} onOpenChange={setIsLoading} />
      {agregar.dialogs}
    </>
  )
}
