"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Briefcase, UserCheck, Loader2 } from "lucide-react"
import type { VendedorRelacionUnico } from "@/app/services/auth/types"

interface RoleEntryModalProps {
  open: boolean
  vendedorRelacion?: VendedorRelacionUnico | null
  loading?: boolean
  onSelectRepresentante: () => void
  onSelectVendedor: () => void
}

export function RoleEntryModal({
  open,
  vendedorRelacion,
  loading = false,
  onSelectRepresentante,
  onSelectVendedor,
}: RoleEntryModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-lg [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">¿Cómo deseas ingresar?</DialogTitle>
          <DialogDescription className="text-center">
            Selecciona el modo con el que quieres entrar al sistema
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 px-4 py-4">
          <button
            onClick={onSelectRepresentante}
            disabled={loading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground group-hover:text-blue-900">Representante</p>
              <p className="text-xs text-muted-foreground group-hover:text-blue-900 mt-1">
                Ingresa con tu sesión de representante
              </p>
            </div>
          </button>

          <button
            onClick={onSelectVendedor}
            disabled={loading}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-green-500 hover:bg-green-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
              {loading ? (
                <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              ) : (
                <UserCheck className="h-8 w-8 text-green-600" />
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground group-hover:text-green-900">Vendedor</p>
              <p className="text-xs text-muted-foreground group-hover:text-green-900 mt-1">
                {vendedorRelacion
                  ? `Ingresa como ${vendedorRelacion.nombreCompleto}`
                  : "Ingresa con el rol de vendedor"}
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
