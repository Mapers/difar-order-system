'use client'
import React, { useEffect, useState } from "react"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { Pedido, PedidoDet } from "@/app/dashboard/estados-pedidos/page"
import { getProductsByAlmacenRequest, getBonificadosRequest, getEscalasRequest } from "@/app/api/products"
import { PriceService } from "@/app/services/price/PriceService"
import { PriceType, ProductoConLotes } from "@/app/types/order/order-interface"
import { IAlmacen, IProduct, stockFisicoDe } from "@/app/types/order/product-interface"
import ProductSearchDialog from "@/components/tomar-pedido/product-step/ProductSearchDialog"
import PriceSelector from "@/components/tomar-pedido/product-step/PriceSelector"
import LotesModal from "@/components/tomar-pedido/Lotesmodal"
import AlmacenModal from "@/components/tomar-pedido/AlmacenModal"
import { avisarLoteNoAlcanza, primerLoteQueAlcanza } from "@/components/tomar-pedido/lotesStock"
import ModalLoader from "@/components/modal/modalLoader"
import { fmtFecha } from "@/lib/planilla.helper"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Building2, Loader2, Minus, Plus, Search } from "lucide-react"

/**
 * Agregar productos al editar un pedido (Mis pedidos / Estados de pedidos),
 * con el mismo criterio que Tomar pedido: los productos, el stock y los lotes
 * son los del almacén elegido. Arranca con el almacén del pedido.
 *
 * Cambiar de almacén con productos ya cargados los quita (sus lotes son del
 * almacén anterior), igual que en Tomar pedido.
 */
export function useAgregarProductoPedido(
  pedido: Pedido | null,
  tempDetalles: PedidoDet[],
  setTempDetalles: React.Dispatch<React.SetStateAction<PedidoDet[]>>,
  onAgregado: () => void,
) {
  const auth = useAuth()

  const [almacenes, setAlmacenes] = useState<IAlmacen[]>([])
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(false)
  const [almacen, setAlmacen] = useState<IAlmacen | null>(null)
  const [showAlmacenModal, setShowAlmacenModal] = useState(false)
  const [almacenPorConfirmar, setAlmacenPorConfirmar] = useState<IAlmacen | null>(null)

  const [products, setProducts] = useState<IProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [openProdSearch, setOpenProdSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [quantity, setQuantity] = useState<number | "">(1)
  const [priceType, setPriceType] = useState<PriceType>('contado')
  const [priceEdit, setPriceEdit] = useState<number>(0)

  const [isLoading, setIsLoading] = useState(false)
  const [modalLoader, setModalLoader] = useState<any>(null)
  const [showLotesModal, setShowLotesModal] = useState(false)
  const [loadingLotes, setLoadingLotes] = useState(false)
  const [editingLotes, setEditingLotes] = useState<ProductoConLotes[]>([])
  const [pendingDetalle, setPendingDetalle] = useState<PedidoDet | null>(null)

  const iniciar = async () => {
    setLoadingAlmacenes(true)
    try {
      const res = await apiClient.get('/admin/listar/almacenes')
      const lista: IAlmacen[] = res.data.data || []
      setAlmacenes(lista)
      const delPedido = lista.find(a => Number(a.IdAlmacen) === Number(pedido?.idAlmacen))
      const inicial = delPedido ?? (lista.length === 1 ? lista[0] : null)
      setAlmacen(inicial)
    } catch (err) {
      console.error("Error cargando almacenes", err)
    } finally {
      setLoadingAlmacenes(false)
    }
  }

  const reset = () => {
    setAlmacen(null)
    setProducts([])
    setSelectedProduct(null)
    setQuantity(1)
    setSearchQuery("")
    setShowAlmacenModal(false)
    setShowLotesModal(false)
    setEditingLotes([])
    setPendingDetalle(null)
  }

  useEffect(() => {
    if (!almacen) { setProducts([]); return }
    let vigente = true
    const cargar = async () => {
      setLoadingProducts(true)
      try {
        const representante = auth.isAdmin() ? "" : (auth.user?.codRepres || "")
        const res = await getProductsByAlmacenRequest(almacen.IdAlmacen, representante)
        if (vigente) setProducts(res.data?.data?.data || [])
      } catch (err) {
        console.error("Error cargando productos del almacén", err)
      } finally {
        if (vigente) setLoadingProducts(false)
      }
    }
    cargar()
    return () => { vigente = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacen])

  const aplicarAlmacen = (alm: IAlmacen, quitarProductos: boolean) => {
    if (quitarProductos) setTempDetalles([])
    setAlmacen(alm)
    setSelectedProduct(null)
    setQuantity(1)
    setShowAlmacenModal(false)
    setAlmacenPorConfirmar(null)
  }

  const elegirAlmacen = (alm: IAlmacen) => {
    const esOtro = almacen != null && alm.IdAlmacen !== almacen.IdAlmacen
    if (esOtro && tempDetalles.length > 0) {
      setShowAlmacenModal(false)
      setAlmacenPorConfirmar(alm)
      return
    }
    aplicarAlmacen(alm, false)
  }

  const idAlmacenAGuardar =
    almacen && Number(almacen.IdAlmacen) !== Number(pedido?.idAlmacen) ? almacen.IdAlmacen : undefined

  const handleInitiateAddProduct = async () => {
    if (!selectedProduct || !quantity || !almacen) return
    try {
      setIsLoading(true)
      setModalLoader('BONIFICADO')
      const bonificaciones = await getBonificadosRequest({ idArticulo: selectedProduct.Codigo_Art, cantidad: Number(quantity) } as any)
      setModalLoader('ESCALA')
      const escalas = await getEscalasRequest({ idArticulo: selectedProduct.Codigo_Art, cantidad: Number(quantity) } as any)

      const resolvePrice = () => {
        switch (priceType) {
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
        iditemPedido: selectedProduct.IdArticulo as any,
        laboratorio: selectedProduct.Descripcion,
        precioPedido: String(resolvePrice()),
        idPedidocab: Number(pedido?.nroPedido),
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

      const lotesRes = await PriceService.getProductLots(selectedProduct.Codigo_Art, almacen.IdAlmacen)
      const lotes = lotesRes.data.map((l: any) => ({
        value: `${l.numeroLote}|${l.fechaVencimiento}|${Number(l.stock).toFixed(2)}`,
        numeroLote: l.numeroLote, fechaVencimiento: l.fechaVencimiento,
        stock: Number(l.stock).toFixed(2),
        stockFisico: Number(l.stockFisico ?? l.stock).toFixed(2),
      })).filter((l: any) => Number(l.stock) > 0)

      setEditingLotes(lotes.length > 0 ? [{
        prod_codigo: selectedProduct.Codigo_Art, prod_descripcion: selectedProduct.NombreItem,
        cantidadPedido: Number(quantity), lotes, loteSeleccionado: primerLoteQueAlcanza(lotes, Number(quantity)),
      }] : [])
    } finally {
      setIsLoading(false)
      setModalLoader(null)
      setLoadingLotes(false)
    }
  }

  const handleConfirmarLotes = () => {
    if (!pendingDetalle) return
    const elegido = editingLotes[0]
    if (elegido?.loteSeleccionado && avisarLoteNoAlcanza(elegido, elegido.loteSeleccionado)) return
    let lote: string | undefined, fecVenc: string | undefined
    if (elegido?.loteSeleccionado) {
      const parts = elegido.loteSeleccionado.split('|')
      lote = parts[0]; fecVenc = fmtFecha(parts[1])
    }
    setTempDetalles(prev => [...prev, { ...pendingDetalle, cod_lote: lote, fec_venc_lote: fecVenc }])
    setShowLotesModal(false)
    setEditingLotes([])
    setPendingDetalle(null)
    setSelectedProduct(null)
    setQuantity(1)
    onAgregado()
  }

  const q = searchQuery.toLowerCase()
  const filteredProducts = products.filter(p =>
    p.Codigo_Art?.toLowerCase().includes(q) ||
    p.NombreItem?.toLowerCase().includes(q) ||
    p.Descripcion?.toLowerCase().includes(q)
  )

  const currency = { value: pedido?.monedaPedido || 'PEN' } as any
  const safeQuantity = typeof quantity === "number" ? quantity : 0
  const stock = selectedProduct ? Number(selectedProduct.Stock) : 0

  const slot = (
    <div className="space-y-6 pt-2">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Almacén</Label>
        <Button type="button" variant="outline" onClick={() => setShowAlmacenModal(true)}
                className="w-full justify-start h-11 px-3 text-left font-normal text-sm bg-muted hover:bg-background border-border hover:border-blue-400">
          <Building2 className="mr-2 h-4 w-4 shrink-0 text-blue-600" />
          {almacen
            ? <span className="truncate text-foreground">{almacen.Codigo_Alm} - {almacen.Descripcion}</span>
            : loadingAlmacenes
              ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Cargando almacenes...</span>
              : <span className="text-muted-foreground">Seleccionar almacén...</span>}
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Producto</Label>
        <Button type="button" variant="outline" disabled={!almacen} onClick={() => setOpenProdSearch(true)}
                className="w-full justify-start h-auto min-h-12 px-3 py-2 text-left font-normal text-sm bg-muted hover:bg-background border-border hover:border-blue-400 overflow-hidden">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          {selectedProduct
            ? <div className="flex flex-col items-start overflow-hidden w-0 flex-1">
                <span className="font-semibold text-foreground truncate w-full text-sm">{selectedProduct.NombreItem}</span>
                <span className="text-xs text-muted-foreground truncate w-full">{selectedProduct.Codigo_Art} | {selectedProduct.Descripcion}</span>
              </div>
            : loadingProducts
              ? <span className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3.5 w-3.5 animate-spin" />Cargando productos del almacén...</span>
              : <span className="text-muted-foreground text-sm">{almacen ? 'Buscar por código, nombre o laboratorio...' : 'Primero elige el almacén'}</span>
          }
        </Button>
        <ProductSearchDialog open={openProdSearch} onOpenChange={setOpenProdSearch}
                             searchQuery={searchQuery} onSearchQueryChange={setSearchQuery}
                             filteredProducts={filteredProducts}
                             onProductSelect={prod => { setSelectedProduct(prod); setPriceType('contado'); setPriceEdit(Number(prod.PUContado)); setQuantity(1); setOpenProdSearch(false) }}
                             currency={currency} loadingProducts={loadingProducts} />
        {selectedProduct && (
          <PriceSelector selectedProduct={selectedProduct} priceType={priceType}
                         onPriceTypeChange={setPriceType} priceEdit={priceEdit}
                         onPriceEditChange={setPriceEdit}
                         onPriceEditBlur={e => { const v = parseFloat(e.target.value); if (!v || v <= 0) setPriceEdit(Number(selectedProduct.PUContado)) }}
                         currency={currency} />
        )}
      </div>

      {selectedProduct && (
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Cant.
              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                Stock: {stock.toFixed(0)}{` Físico: ${stockFisicoDe(selectedProduct).toFixed(0)}`} · <span className={stock - safeQuantity <= 0 ? 'text-red-500 font-semibold' : stock - safeQuantity <= 3 ? 'text-amber-500' : 'text-green-600'}>
                  Restante: {Math.max(0, stock - safeQuantity)}
                </span>
              </span>
            </Label>
            <div className={`flex items-center h-11 rounded-lg border overflow-hidden bg-muted ${safeQuantity >= stock ? 'border-red-300' : 'border-border'}`}>
              <button type="button" onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
                      className="h-full px-4 flex items-center text-muted-foreground hover:bg-muted">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input type="number" min="1" step="1" value={quantity}
                     onChange={e => { const v = parseInt(e.target.value, 10); setQuantity(!isNaN(v) && v > 0 ? Math.min(v, stock) : "") }}
                     onBlur={() => { if (!quantity || quantity < 1) setQuantity(1) }}
                     onKeyDown={e => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault() }}
                     className="w-16 bg-transparent outline-none text-center text-base font-semibold text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              <button type="button" disabled={safeQuantity >= stock}
                      onClick={() => setQuantity(Math.min(safeQuantity + 1, stock))}
                      className="h-full px-4 flex items-center text-muted-foreground hover:text-blue-600 disabled:text-muted-foreground/50">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <Button onClick={handleInitiateAddProduct} disabled={isLoading || loadingProducts} className="h-11">
            Agregar al pedido
          </Button>
        </div>
      )}
    </div>
  )

  const dialogs = (
    <>
      <AlmacenModal open={showAlmacenModal} onOpenChange={setShowAlmacenModal}
                    almacenes={almacenes} loading={loadingAlmacenes}
                    selectedAlmacen={almacen} onSelectAlmacen={elegirAlmacen} />
      <AlertDialog open={almacenPorConfirmar !== null} onOpenChange={v => { if (!v) setAlmacenPorConfirmar(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar de almacén?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitarán los {tempDetalles.length} productos del pedido, porque sus lotes son
              de {almacen?.Descripcion}. Tendrás que volver a agregarlos desde {almacenPorConfirmar?.Descripcion}.
              Nada se guarda hasta que pulses Guardar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => almacenPorConfirmar && aplicarAlmacen(almacenPorConfirmar, true)}>
              Cambiar y quitar productos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ModalLoader open={isLoading} onOpenChange={setIsLoading} caseKey={modalLoader ?? undefined} />
      <LotesModal open={showLotesModal} onOpenChange={setShowLotesModal}
                  editingLotes={editingLotes} loadingLotes={loadingLotes}
                  onLoteChange={(i, v) => { if (avisarLoteNoAlcanza(editingLotes[i], v)) return; setEditingLotes(prev => { const u = [...prev]; u[i].loteSeleccionado = v; return u }) }}
                  onConfirm={handleConfirmarLotes} />
    </>
  )

  return { iniciar, reset, slot, dialogs, idAlmacenAGuardar }
}
