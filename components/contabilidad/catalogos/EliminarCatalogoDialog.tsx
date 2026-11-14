'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/app/hooks/useToast'
import { mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { DatosControlService } from '@/app/services/contabilidad/DatosControlService'
import { FilaCatalogo, UsoRegistro } from '@/app/types/datos-control-types'
import { AvisoAmbar } from './AvisoAmbar'
import { CatalogoDef } from './definiciones'

interface Props { def: CatalogoDef; fila: FilaCatalogo | null; onCerrar: () => void; onCambio: () => void }

/**
 * Eliminar Registro: primero revisa "¿dónde se usa?". Si está en uso se muestra el detalle en ámbar
 * y no se deja eliminar (el SP lo vuelve a revisar).
 */
export function EliminarCatalogoDialog({ def, fila, onCerrar, onCambio }: Props) {
    const [usos, setUsos] = useState<UsoRegistro[] | null>(null)
    const [aviso, setAviso] = useState<string | null>(null)
    const [ocupado, setOcupado] = useState(false)

    useEffect(() => {
        setUsos(null); setAviso(null)
        if (!fila) return
        if (def.sinUso) { setUsos([]); return }
        DatosControlService.uso(def.clave, fila.id, def.usoPorCodigo ? fila.codigo : undefined)
            .then(setUsos)
            .catch(async (e) => { setUsos([]); setAviso(await mensajeError(e, 'No se pudo revisar el uso del registro.')) })
    }, [def, fila])

    async function eliminar() {
        if (!fila) return
        setOcupado(true); setAviso(null)
        try {
            await DatosControlService.eliminar(def.clave, fila.id)
            toast({ title: 'Registro eliminado', description: def.titulo })
            onCambio(); onCerrar()
        } catch (e) {
            setAviso(await mensajeError(e, 'No se pudo eliminar. Intenta nuevamente.'))
        } finally { setOcupado(false) }
    }

    const enUso = !!usos && usos.length > 0
    const nombre = fila ? [fila.codigo, fila.descripcion].filter(x => x !== null && x !== '').join(' · ') : ''
    return (
        <Dialog open={!!fila} onOpenChange={(o) => !o && !ocupado && onCerrar()}>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-lg p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle className="text-base">¿Eliminar este registro?</DialogTitle>
                    <DialogDescription className="break-words">{def.titulo}: {nombre}</DialogDescription>
                </DialogHeader>

                {usos === null && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Revisando dónde se usa…</p>}
                {enUso && (
                    <AvisoAmbar titulo="No se puede eliminar: el registro está en uso">
                        <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto">
                            {usos!.map(u => (
                                <li key={u.tabla} className="flex justify-between gap-3">
                                    <span className="min-w-0 truncate">{u.descripcion}</span>
                                    <span className="font-mono tabular-nums">{u.cantidad.toLocaleString('es-PE')}</span>
                                </li>
                            ))}
                        </ul>
                    </AvisoAmbar>
                )}
                {usos && !enUso && !aviso && <p className="text-sm text-muted-foreground">No se usa en ninguna tabla. Esta acción no se puede deshacer.</p>}
                {aviso && <AvisoAmbar>{aviso}</AvisoAmbar>}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" disabled={ocupado} onClick={onCerrar}>{enUso ? 'Cerrar' : 'Cancelar'}</Button>
                    {!enUso && (
                        <Button disabled={ocupado || usos === null} onClick={eliminar} className="bg-amber-600 text-white hover:bg-amber-700">
                            {ocupado ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Eliminar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
