'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArticulosService } from '@/app/services/contabilidad/DatosGeneralesService'
import { CodigoOsce } from '@/app/types/datos-generales-types'
import { AvisoAmbar, Buscador, textoError } from '../comunes'

/**
 * Buscador de códigos OSCE (form Access [ITEM ocse]): busca por descripción que EMPIEZA con el texto
 * o por el código exacto (256 mil códigos, sin índice: mínimo 3 letras, máximo 50 resultados).
 */
export function BuscarOsceDialog({ abierto, textoInicial, onElegir, onCerrar }: {
    abierto: boolean; textoInicial?: string; onElegir: (c: CodigoOsce) => void; onCerrar: () => void
}) {
    const [texto, setTexto] = useState('')
    const [resultados, setResultados] = useState<CodigoOsce[] | null>(null)
    const [cargando, setCargando] = useState(false)
    const [aviso, setAviso] = useState('')
    useEffect(() => { if (abierto) { setTexto(textoInicial ?? ''); setResultados(null); setAviso('') } }, [abierto, textoInicial])

    async function buscar() {
        if (texto.trim().length < 3) { setAviso('Escribe al menos 3 letras (la descripción debe empezar con ese texto) o el código OSCE completo.'); return }
        setCargando(true); setAviso('')
        try { setResultados(await ArticulosService.osceBuscar(texto.trim(), 50)) } catch (e) { setAviso(await textoError(e)) } finally { setCargando(false) }
    }

    return (
        <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
            <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
                <DialogHeader>
                    <DialogTitle>Buscar código OSCE</DialogTitle>
                    <DialogDescription>La descripción debe empezar con el texto (p. ej. &quot;PARACETAMOL&quot;), o escribe el código completo.</DialogDescription>
                </DialogHeader>
                <Buscador valor={texto} onCambio={setTexto} onBuscar={buscar} cargando={cargando} placeholder="Descripción o código OSCE" />
                <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />
                <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
                    {cargando ? (
                        <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</p>
                    ) : resultados === null ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Escribe y presiona Buscar.</p>
                    ) : !resultados.length ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Sin resultados.</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {resultados.map((r) => (
                                <li key={r.id}>
                                    <button className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => onElegir(r)}>
                                        <span className="block font-mono text-xs text-muted-foreground">{r.codigo}</span>
                                        <span className="block text-sm text-foreground">{r.descripcion}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {resultados && resultados.length === 50 && <p className="text-xs text-muted-foreground">Se muestran los primeros 50: escribe más letras para afinar.</p>}
            </DialogContent>
        </Dialog>
    )
}
