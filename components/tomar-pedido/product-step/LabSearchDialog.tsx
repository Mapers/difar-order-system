'use client'
import React, { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Search, X, Building, Check } from "lucide-react"

interface LabSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    laboratories: any[]
    selectedLaboratorio: string | null
    onLaboratorioChange: (val: string) => void
}

export default function LabSearchDialog({
                                            open, onOpenChange, laboratories, selectedLaboratorio, onLaboratorioChange
                                        }: LabSearchDialogProps) {
    const [labSearch, setLabSearch] = useState("")

    const filtered = laboratories.filter(l =>
        l.Descripcion.toLowerCase().includes(labSearch.toLowerCase())
    )

    return (
        <Dialog open={open} onOpenChange={(v) => {
            onOpenChange(v)
            if (!v) setLabSearch("")
        }}>
            <DialogContent className="p-0 gap-0 flex flex-col [&>button]:hidden overflow-hidden fixed bottom-0 left-0 right-0 top-auto translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none h-[88vh] w-full sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-[520px] sm:h-[65vh] sm:max-w-[95vw]">
                <DialogTitle className="sr-only">Seleccionar laboratorio</DialogTitle>

                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 bg-white dark:bg-gray-900 shrink-0">
                    <Search className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                        type="text" autoFocus placeholder="Buscar laboratorio..."
                        value={labSearch} onChange={(e) => setLabSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 h-9"
                    />
                    {labSearch && (
                        <button type="button" onClick={() => setLabSearch("")} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <button type="button" onClick={() => { onOpenChange(false); setLabSearch("") }} className="text-sm text-blue-600 dark:text-blue-400 font-medium pl-2 shrink-0">
                        Cancelar
                    </button>
                </div>

                <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/20 border-b border-purple-100 dark:border-purple-900/30 shrink-0">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                        {labSearch ? `${filtered.length} resultado(s)` : `${laboratories.length} laboratorios`}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center">
                            <Building className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {labSearch ? 'No se encontraron laboratorios' : 'Sin laboratorios disponibles'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filtered.map((lab) => (
                                <button key={lab.IdLineaGe} type="button"
                                        onClick={() => {
                                            onLaboratorioChange(String(lab.IdLineaGe))
                                            onOpenChange(false)
                                            setLabSearch("")
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-950/20 active:bg-purple-100 transition-colors text-left ${selectedLaboratorio === String(lab.IdLineaGe) ? 'bg-purple-50 dark:bg-purple-950/20' : ''}`}>
                                    <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full shrink-0">
                                        <Building className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{lab.Descripcion}</p>
                                    </div>
                                    {selectedLaboratorio === String(lab.IdLineaGe) && (
                                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}