'use client'

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, ChevronDown } from "lucide-react"

interface Laboratory {
    IdLineaGe: number
    Codigo_Linea: string
    Descripcion: string
}

interface MultiSelectLaboratoryProps {
    laboratories: Laboratory[]
    selectedLabs: number[] // ids seleccionados
    onSelectionChange: (labs: number[]) => void
}

export default function MultiSelectLaboratory({ laboratories, selectedLabs, onSelectionChange }: MultiSelectLaboratoryProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Filtrar por descripcion
    const filteredLabs = laboratories.filter((lab) =>
        lab.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleLab = (labId: number) => {
        if (selectedLabs.includes(labId)) {
            onSelectionChange(selectedLabs.filter((id) => id !== labId))
        } else {
            onSelectionChange([...selectedLabs, labId])
        }
    }

    const removeLab = (labId: number) => {
        onSelectionChange(selectedLabs.filter((id) => id !== labId))
    }

    // Obtener descripción para un id seleccionado
    const getDescriptionById = (id: number) => {
        const lab = laboratories.find((l) => l.IdLineaGe === id)
        return lab ? lab.Descripcion : id.toString()
    }

    return (
        <div className="relative">
            <div
                className="min-h-10 border border-border rounded-md p-2 bg-background cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1">
                    {selectedLabs.map((id) => (
                        <Badge key={id} variant="secondary" className="text-xs">
                            {getDescriptionById(id)}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeLab(id)
                                }}
                                className="ml-1 hover:bg-accent rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                    {selectedLabs.length === 0 && <span className="text-muted-foreground text-sm">Seleccionar laboratorios...</span>}
                </div>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Buscar laboratorio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-sm"
                        />
                    </div>
                    <div className="py-1">
                        {filteredLabs.map((lab) => (
                            <div
                                key={lab.IdLineaGe}
                                className="px-3 py-2 hover:bg-muted cursor-pointer flex items-center gap-2 text-sm"
                                onClick={() => toggleLab(lab.IdLineaGe)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedLabs.includes(lab.IdLineaGe)}
                                    onChange={() => { }}
                                    className="rounded"
                                />
                                {lab.Descripcion}
                            </div>
                        ))}
                        {filteredLabs.length === 0 && (
                            <div className="px-3 py-2 text-muted-foreground text-sm">No se encontraron laboratorios</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}