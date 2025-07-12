import React from 'react'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from 'lucide-react'
import { MESSAGES } from '@/constants'

interface ModalLoaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseKey?: 'BONIFICADO' | 'ESCALA' | 'EVALUACION'
  title?: string
  message?: string
}

const ModalLoader: React.FC<ModalLoaderProps> = ({
  open,
  onOpenChange,
  caseKey,
  title,
  message
}) => {
  const displayTitle = title || (caseKey ? MESSAGES[caseKey]?.title : "Cargando...");
  const displayMessage = message || (caseKey ? MESSAGES[caseKey]?.message : "Por favor, espere...");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogTitle className="text-base sm:text-lg font-medium text-gray-900 text-center">
          {displayTitle}
        </DialogTitle>
        <div className="flex flex-col items-center justify-center py-4 sm:py-6">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-sm text-gray-500 mt-2 text-center">
            {displayMessage}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ModalLoader