'use client'
import { useEffect, useState } from "react"
import { use } from "react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import {Pedido, PedidoDet} from "@/app/dashboard/estados-pedidos/page"
import { getProductsRequest, getBonificadosRequest, getEscalasRequest } from "@/app/api/products"
import { PriceService } from "@/app/services/price/PriceService"
import { PriceType, ProductoConLotes } from "@/app/types/order/order-interface"
import ProductSearchDialog from "@/components/tomar-pedido/product-step/ProductSearchDialog"
import PriceSelector from "@/components/tomar-pedido/product-step/PriceSelector"
import LotesModal from "@/components/tomar-pedido/Lotesmodal"
import ModalLoader from "@/components/modal/modalLoader"
import { fmtFecha } from "@/lib/planilla.helper"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"
import OrderDetailView from "@/components/OrderDetailView";
import {fetchGetAllClients, fetchGetConditions} from "@/app/api/takeOrders";

export default function EstadosPedidosDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params)
  const auth = useAuth()

  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [tempDetalles, setTempDetalles] = useState<PedidoDet[]>([])

  // --- ESTADOS PARA PRODUCTOS ---
  const [openAddModal, setOpenAddModal] = useState(false)
  const [openProdSearch, setOpenProdSearch] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [quantity, setQuantity] = useState<number | "">(1)
  const [priceType, setPriceType] = useState<PriceType>('contado')
  const [priceEdit, setPriceEdit] = useState<number>(0)

  // --- ESTADOS PARA CLIENTE Y CONDICIÓN ---
  const [clientsFiltered, setClientsFiltered] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [openClientSearch, setOpenClientSearch] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")

  const [conditions, setConditions] = useState<any[]>([])
  const [selectedCondition, setSelectedCondition] = useState<any | null>(null)
  const [isConditionOpen, setIsConditionOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [modalLoader, setModalLoader] = useState<any>(null)
  const [showLotesModal, setShowLotesModal] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [editingLotes, setEditingLotes] = useState<ProductoConLotes[]>([])
  const [pendingDetalle, setPendingDetalle] = useState<PedidoDet | null>(null)

  const fetch = async () => {
    try {
      setLoading(true)
      const cab = await apiClient.get(`/pedidos/${id}`)
      let url = `/pedidosDetalles/${id}/detalles`
      if (auth.user?.idRol === 1) url += `?vendedor=${auth.user?.codigo}`
      const det = await apiClient.get(url)
      setPedido(cab.data.data)
      const mapped = det.data.data.map(i => ({ ...i, cantPedido: Number(i.cantPedido) }))
      setDetalles(mapped)
      setTempDetalles(mapped)
    } catch { setError("Error al cargar el pedido") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetch()
  }, [id, auth.user])

  const handleEditToggle = async () => {
    if (isEditing) {
      setTempDetalles(detalles)
      setSelectedClient(null)
      setSelectedCondition(null)
    } else {
      setIsLoading(true)
      try {
        const sellerCode = auth.isAdmin() ? "" : (auth.user?.codigo || "")

        const [resProd, resCli, resCond] = await Promise.all([
          getProductsRequest(),
          fetchGetAllClients(sellerCode, auth.isAdmin()),
          fetchGetConditions('')
        ])
        setProducts(resProd.data?.data?.data || [])
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

      const res = await apiClient.put(`/pedidos/${id}`, payload)

      if (res.status === 200) {
        const res = await apiClient.post('/pedidosDetalles/detalles', payloadDet)
        if (res.status === 201) {
          const det = await apiClient.get(`/pedidosDetalles/${id}/detalles`)
          setDetalles(det.data.data)
          setIsEditing(false)
          fetch();
        }
      }
    } catch { setError("Error al guardar los cambios") }
  }

  const handleInitiateAddProduct = async () => {
    if (!selectedProduct || !quantity) return
    try {
      setIsLoading(true)
      setModalLoader('BONIFICADO')
      const bonificaciones = await getBonificadosRequest({ idArticulo: selectedProduct.Codigo_Art, cantidad: Number(quantity) })
      setModalLoader('ESCALA')
      const escalas = await getEscalasRequest({ idArticulo: selectedProduct.Codigo_Art, cantidad: Number(quantity) })

      const resolvePrice = () => {
        switch(priceType) {
          case 'contado':  return Number(selectedProduct.PUContado)
          case 'credito':  return Number(selectedProduct.PUCredito)
          case 'porMenor': return Number(selectedProduct.PUPorMenor)
          case 'porMayor': return Number(selectedProduct.PUPorMayor)
          case 'regalo':   return 0
          default:         return Number(priceEdit) || 0
        }
      }

      const newDetalle: PedidoDet = {
        idPedidodet: tempDetalles.length + 1,
        productoNombre: selectedProduct.NombreItem,
        codigoitemPedido: selectedProduct.Codigo_Art,
        iditemPedido: selectedProduct.IdArticulo,
        laboratorio: selectedProduct.Descripcion,
        precioPedido: String(resolvePrice()),
        idPedidocab: Number(id),
        cantPedido: String(quantity),
        isBonification: bonificaciones?.data?.data?.data?.length > 0,
        isEscale: escalas?.data?.data?.data?.length > 0,
        appliedScale: '',
        is_editado: (priceType === 'custom' || priceType === 'regalo') ? 'S' : 'N',
        is_autorizado: (priceType === 'regalo' || (priceType === 'custom' && Number(priceEdit) < Number(selectedProduct.PUContado))) ? 'S' : 'N',
        productoUnidad: '',
      }

      setPendingDetalle(newDetalle)
      setLoadingLotes(true)
      setShowLotesModal(true)
      const lotesRes = await PriceService.getProductLots(selectedProduct.Codigo_Art)
      const lotes = lotesRes.data.map((l: any) => ({
        value: `${l.numeroLote}|${l.fechaVencimiento}|${Number(l.stock).toFixed(2)}`,
        numeroLote: l.numeroLote, fechaVencimiento: l.fechaVencimiento, stock: Number(l.stock).toFixed(2)
      })).filter((l: any) => Number(l.stock) > 0)

      setEditingLotes(lotes.length > 0 ? [{
        prod_codigo: selectedProduct.Codigo_Art, prod_descripcion: selectedProduct.NombreItem,
        cantidadPedido: Number(quantity), lotes, loteSeleccionado: lotes[0].value,
      }] : [])
    } finally { setIsLoading(false); setModalLoader(null); setLoadingLotes(false) }
  }

  const handleConfirmarLotes = () => {
    if (!pendingDetalle) return
    let lote = null, fecVenc = null
    if (editingLotes[0]?.loteSeleccionado) {
      const parts = editingLotes[0].loteSeleccionado.split('|')
      lote = parts[0]; fecVenc = fmtFecha(parts[1])
    }
    setTempDetalles(prev => [...prev, { ...pendingDetalle, cod_lote: lote, fec_venc_lote: fecVenc }])
    setShowLotesModal(false); setEditingLotes([]); setPendingDetalle(null)
    setSelectedProduct(null); setQuantity(1); setOpenAddModal(false)
  }

  const filteredProducts = products.filter(p =>
      p.Codigo_Art?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.NombreItem?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const fakeCurrency = { value: pedido?.monedaPedido || 'PEN' } as any
  const canEdit = [1, 2, 4].includes(pedido?.estadodePedido ?? 0)


  const addProductSlot = (
      <div className="space-y-6 pt-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Producto</Label>
          <Button type="button" variant="outline" onClick={() => setOpenProdSearch(true)}
                  className="w-full justify-start h-auto min-h-12 px-3 py-2 text-left font-normal text-sm bg-gray-50 hover:bg-white border-gray-200 hover:border-blue-400 overflow-hidden">
            {selectedProduct
                ? <div className="flex flex-col items-start overflow-hidden w-0 flex-1">
                  <span className="font-semibold text-gray-900 truncate w-full text-sm">{selectedProduct.NombreItem}</span>
                  <span className="text-xs text-gray-500 truncate w-full">{selectedProduct.Codigo_Art} | {selectedProduct.Descripcion}</span>
                </div>
                : <span className="text-gray-400 text-sm">Buscar por código, nombre o laboratorio...</span>
            }
          </Button>
          <ProductSearchDialog open={openProdSearch} onOpenChange={setOpenProdSearch}
                               searchQuery={searchQuery} onSearchQueryChange={setSearchQuery}
                               filteredProducts={filteredProducts as any}
                               onProductSelect={prod => { setSelectedProduct(prod); setPriceType('contado'); setPriceEdit(Number(prod.PUContado)); setQuantity(1); setOpenProdSearch(false) }}
                               currency={fakeCurrency} />
          {selectedProduct && (
              <PriceSelector selectedProduct={selectedProduct as any} priceType={priceType}
                             onPriceTypeChange={setPriceType} priceEdit={priceEdit}
                             onPriceEditChange={setPriceEdit}
                             onPriceEditBlur={e => { const v = parseFloat(e.target.value); if (!v || v <= 0) setPriceEdit(Number(selectedProduct.PUContado)) }}
                             currency={fakeCurrency} />
          )}
        </div>
        {selectedProduct && (
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Cant. <span className="text-[10px] font-normal text-gray-400">Stock: {selectedProduct.Stock}</span>
                </Label>
                <div className="flex items-center h-11 rounded-lg border overflow-hidden bg-gray-50 border-gray-200">
                  <button type="button" onClick={() => setQuantity(Math.max(1, Number(quantity) - 1))}
                          className="h-full px-4 flex items-center text-gray-500 hover:bg-gray-100">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <Input type="number" min="1" value={quantity}
                         onChange={e => { const v = parseInt(e.target.value); setQuantity(!isNaN(v) && v > 0 ? Math.min(v, selectedProduct.Stock) : "") }}
                         onBlur={() => { if (!quantity || quantity < 1) setQuantity(1) }}
                         className="w-16 border-0 bg-transparent text-center font-semibold focus-visible:ring-0 px-0 rounded-none shadow-none" />
                  <button type="button" disabled={Number(quantity) >= selectedProduct.Stock}
                          onClick={() => setQuantity(Math.min(Number(quantity) + 1, selectedProduct.Stock))}
                          className="h-full px-4 flex items-center text-gray-500 hover:text-blue-600 disabled:text-gray-300">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <Button onClick={handleInitiateAddProduct} disabled={isLoading} className="h-11">
                Agregar al pedido
              </Button>
            </div>
        )}
      </div>
  )

  const filteredClients = clientSearchQuery
      ? clientsFiltered.filter(c => c.Nombre.toLowerCase().includes(clientSearchQuery.toLowerCase()) || c.RUC?.includes(clientSearchQuery))
      : clientsFiltered;

  return (
      <>
        <OrderDetailView
            context="estados-pedidos"
            backHref="/dashboard/estados-pedidos"
            pedido={pedido} detalles={detalles} loading={loading} error={error}
            canEdit={canEdit} isEditing={isEditing} tempDetalles={tempDetalles}
            onEditToggle={handleEditToggle} onSaveChanges={handleSaveChanges}
            onRemoveItem={i => { const n = [...tempDetalles]; n.splice(i,1); setTempDetalles(n) }}
            onQuantityChange={(i, q) => { if (q > 0) { const n = [...tempDetalles]; n[i].cantPedido = String(q); setTempDetalles(n) }}}
            canAddProduct={true} openAddModal={openAddModal}
            onOpenAddModal={setOpenAddModal} addProductSlot={addProductSlot}

            clientsFiltered={filteredClients}
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
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
        <ModalLoader open={isLoading} onOpenChange={setIsLoading} caseKey={modalLoader ?? undefined} />
        <LotesModal open={showLotesModal} onOpenChange={setShowLotesModal}
                    editingLotes={editingLotes} loadingLotes={loadingLotes}
                    onLoteChange={(i, v) => setEditingLotes(prev => { const u = [...prev]; u[i].loteSeleccionado = v; return u })}
                    onConfirm={handleConfirmarLotes} />
      </>
  )
}