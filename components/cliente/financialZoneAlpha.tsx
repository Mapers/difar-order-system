'use client'

import React from 'react'
import { Map } from 'lucide-react'
import { Label } from '@radix-ui/react-label'
import { ITerritorio } from '@/app/types/order/client-interface'

interface ZonaAlphaProps {
  nameZone: string
  unidadTerritorio: ITerritorio
}

// Versión Alpha: la Zona queda visible de una (antes solo se veía dentro
// de un modal). La Línea de Crédito, que antes vivía junto a la Zona, ahora
// se muestra aparte dentro de la tarjeta del cliente seleccionado — ver
// CreditLineChip, usado directo en ClientWidgetAlpha.
const FinancialZoneAlpha: React.FC<ZonaAlphaProps> = ({ nameZone, unidadTerritorio }) => {
  return (
      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200 transition-shadow hover:shadow-sm">
        <Map className="w-5 h-5 text-purple-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <Label className="text-xs font-medium text-purple-700">Zona</Label>
          <p className="text-sm font-semibold text-purple-900 truncate">{nameZone || 'No Definido'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-medium text-purple-700 truncate max-w-[9rem]">
            {unidadTerritorio?.nombreProvincia || '—'}
          </p>
          <p className="text-[11px] text-purple-500 truncate max-w-[9rem]">
            {unidadTerritorio?.NombreDistrito || '—'}
          </p>
        </div>
      </div>
  )
}

export default FinancialZoneAlpha
