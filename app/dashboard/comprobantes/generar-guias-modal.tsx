'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {FileText, Truck, Plus, Trash2, ChevronUp, ChevronDown, Search, UserPlus, XCircle} from "lucide-react"
import {Pedido} from "@/app/dashboard/comprobantes/page";
import {useState} from "react";
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {Remision} from "@/app/dashboard/comprobantes/remision";
import {GuiaTransportista} from "@/app/dashboard/comprobantes/guia-transportista";

interface GenerarGuiasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido | null
  isProcessing: boolean
  onGenerarGuias: () => Promise<void>
}

export function GenerarGuiasModal({
                                    open,
                                    onOpenChange,
                                    pedido,
                                    isProcessing,
                                    onGenerarGuias
                                  }: GenerarGuiasModalProps) {
  const [activeTab, setActiveTab] = useState("remision")

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
            <TabsContent value="remision" className="m-0 h-full">
              <Remision />
            </TabsContent>
            <TabsContent value="transportista" className="m-0 h-full">
              <GuiaTransportista />
            </TabsContent>
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
