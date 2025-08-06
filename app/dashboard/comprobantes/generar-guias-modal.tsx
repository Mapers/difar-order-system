'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {FileText, Truck, Plus, Trash2, ChevronUp, ChevronDown, Search, UserPlus, XCircle} from "lucide-react"
import {Pedido} from "@/app/dashboard/comprobantes/page";
import {useEffect, useState} from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {Remision} from "@/app/dashboard/comprobantes/remision";
import {GuiaTransportista} from "@/app/dashboard/comprobantes/guia-transportista";
import apiClient from "@/app/api/client";
import {useAuth} from "@/context/authContext";

interface GenerarGuiasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido | null
  isProcessing: boolean
  onGenerarGuias: () => Promise<void>
}

interface PedidoDet {
  idPedidodet: number
  idPedidocab: number
  codigoitemPedido: string
  cantPedido: string
  precioPedido: string
  productoNombre?: string
  productoUnidad?: string
}

export function GenerarGuiasModal({
                                    open,
                                    onOpenChange,
                                    pedido,
                                    isProcessing,
                                    onGenerarGuias
                                  }: GenerarGuiasModalProps) {
  const [activeTab, setActiveTab] = useState("remision")
  const [detalles, setDetalles] = useState<PedidoDet[]>([])
  const auth = useAuth();

  const fetchPedido = async () => {
    try {
      console.log(pedido)
      const resDet = await apiClient.get(`/pedidosDetalles/${pedido?.nroPedido || ''}/detalles?vendedor=${auth.user?.codigo}`)
      const detallesData = resDet.data.data
      setDetalles(detallesData)
    } catch (err) {
      console.error("Error fetching order details:", err)
    }
  }

  useEffect(() => {
    if (pedido) {
      fetchPedido()
    }
  }, [pedido])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-blue-600" />
            Generar Guías Electrónicas
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="border-b">
            <TabsList className="grid grid-cols-2 w-[400px] bg-transparent">
              <TabsTrigger
                value="remision"
                className="flex items-center gap-2 py-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                <FileText className="h-4 w-4" />
                Guía de Remisión
              </TabsTrigger>
              <TabsTrigger
                value="transportista"
                className="flex items-center gap-2 py-4 px-4 data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
              >
                <Truck className="h-4 w-4" />
                Guía Transportista
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-6 bg-gray-50">
            {detalles.length > 0 && (
              <>
                <TabsContent value="remision" className="m-0 h-full">
                  <Remision detalles={detalles} pedido={pedido} />
                </TabsContent>
                <TabsContent value="transportista" className="m-0 h-full">
                  <GuiaTransportista detalles={detalles} pedido={pedido} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onGenerarGuias}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? 'Generando...' : 'Generar Guía'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
