'use client'

import { Button } from '@/components/ui/button'
import { Download, ChevronDown } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Comprobante } from '@/app/types/order/order-interface'
import { Sequential } from '@/app/types/config-types'
import { ExportRegistroButton } from '@/app/dashboard/comprobantes/Exportregistrobutton'
import { ExcelExportButton } from '@/app/dashboard/comprobantes/ExcelExportButton'

interface FiltersComprobantes {
    fechaDesde: string
    fechaHasta: string
}

interface ExportComprobantesMenuProps {
    data: Comprobante[]
    tiposComprobante?: Sequential[]
    filters?: FiltersComprobantes
}

/**
 * Un solo botón para las dos exportaciones del registro de ventas.
 *
 * Antes eran dos botones sueltos compitiendo por espacio con "Validar SUNAT" y
 * "Buscar". Cada formato conserva su propio componente y su propia lógica: acá
 * solo se los muestra como opciones del mismo menú, en modo `asMenuItem`.
 */
export function ExportComprobantesMenu({
    data = [],
    tiposComprobante = [],
    filters,
}: ExportComprobantesMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Registro de ventas
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ExportRegistroButton
                    asMenuItem
                    type="comprobantes"
                    data={data}
                    tiposComprobante={tiposComprobante}
                    filters={filters}
                />
                <ExcelExportButton
                    asMenuItem
                    data={data}
                    tiposComprobante={tiposComprobante}
                    filters={filters}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
