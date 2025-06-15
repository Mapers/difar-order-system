import React from 'react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react'

interface ModalVerificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ModalVerification: React.FC<ModalVerificationProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogTitle>Verificando producto</DialogTitle>
        <div className="flex flex-col items-center justify-center py-6 sm:py-8">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Buscando bonificaciones y escalas disponibles
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ModalVerification
