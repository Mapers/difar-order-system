'use client'

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, User, FileText, Calendar, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { ORDER_STATES } from "@/app/dashboard/mis-pedidos/page"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import apiClient from "@/app/api/client";

export interface EstadoHistorial {
  id_historial: number;
  id_pedido: string;
  estado_anterior: number;
  nombre_estado_anterior: string;
  estado_nuevo: number;
  nombre_estado_nuevo: string;
  fecha_cambio: string;
  usuario_cambio: string;
  notas: string;
  observaciones: string;
}

interface TimelineModalProps {
  pedido: {
    nroPedido: string
    nombreCliente: string
  }
}

export function TimelineModal({ pedido }: TimelineModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [historial, setHistorial] = useState<EstadoHistorial[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistorial = async () => {
    if (!isOpen) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.get(`/pedidos/state/${pedido.nroPedido}`)
      setHistorial(data.data.data)
    } catch (err) {
      setError("Error al cargar el historial")
      console.error("Error fetching history:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchHistorial()
    }
  }, [isOpen, pedido.nroPedido])

  const getStateInfo = (stateId: number) => {
    return ORDER_STATES.find(state => state.id === stateId)
  }

  const formatFecha = (fecha: string) => {
    try {
      return format(new Date(fecha), "dd MMM yyyy 'a las' HH:mm", { locale: es })
    } catch {
      return fecha
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Ver Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Pedido: {pedido.nroPedido} - {pedido.nombreCliente}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-4 rounded-full mt-2" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay historial de cambios para este pedido
            </div>
          ) : (
            <div className="space-y-6">
              {historial.map((item, index) => {
                const estadoAnteriorInfo = getStateInfo(item.estado_anterior)
                const estadoNuevoInfo = getStateInfo(item.estado_nuevo)

                return (
                  <div key={item.id_historial} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-gray-300'
                      }`} />
                      {index !== historial.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 mt-1" />
                      )}
                    </div>

                    <div className="flex-1 pb-6 group-last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={estadoAnteriorInfo?.color}>
                          {estadoAnteriorInfo?.name || `Estado ${item.estado_anterior}`}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <Badge className={estadoNuevoInfo?.color}>
                          {estadoNuevoInfo?.name || `Estado ${item.estado_nuevo}`}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{item.usuario_cambio}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatFecha(item.fecha_cambio)}</span>
                        </div>

                        {item.notas && (
                          <div className="flex items-start gap-2 text-gray-700 mt-2">
                            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{item.notas}</span>
                          </div>
                        )}

                        {item.observaciones && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                            <h4 className="font-medium text-yellow-800 text-sm mb-1">
                              Observaciones:
                            </h4>
                            <p className="text-yellow-700 text-sm">{item.observaciones}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setIsOpen(false)} variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}