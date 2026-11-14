'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PersonasService } from '@/app/services/contabilidad/DatosGeneralesService'
import { CatalogosPersonas, FichaPersona, FilaPersona, RELACIONES } from '@/app/types/datos-generales-types'
import { AvisoAmbar, Buscador, CabeceraMantenimiento, textoError, VerMas } from '@/components/contabilidad/datos-generales/comunes'
import { FichaPersonaDialog, fichaPersonaDe, fichaPersonaVacia } from '@/components/contabilidad/datos-generales/personas/FichaPersonaDialog'

const PASO = 100

/**
 * Personas y Empresas (Access: Datos Fijos › Datos Generales › PersonasEmpresas, form [Perosnas y Empresas]).
 * Clientes, proveedores, trabajadores y control interno: lista filtrada por relación + búsqueda,
 * ficha con los mismos campos de Access y baja solo si la persona no está en uso.
 */
export default function PersonasEmpresasPage() {
    const [catalogos, setCatalogos] = useState<CatalogosPersonas | null>(null)
    const [relacion, setRelacion] = useState('02')
    const [buscar, setBuscar] = useState('')
    const [filas, setFilas] = useState<FilaPersona[]>([])
    const [cargando, setCargando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [mostrar, setMostrar] = useState(PASO)
    const [ficha, setFicha] = useState<FichaPersona | null>(null)
    const [abierta, setAbierta] = useState(false)

    const cargar = useCallback(async (rel: string, texto: string) => {
        setCargando(true); setAviso('')
        try { setFilas(await PersonasService.listar(rel, texto)); setMostrar(PASO) } catch (e) { setAviso(await textoError(e, 'No se pudo cargar la lista.')) } finally { setCargando(false) }
    }, [])

    useEffect(() => {
        PersonasService.catalogos().then(setCatalogos).catch(async (e) => setAviso(await textoError(e, 'No se pudieron cargar los combos de la ficha.')))
    }, [])
    useEffect(() => { cargar(relacion, buscar) }, [relacion]) // eslint-disable-line react-hooks/exhaustive-deps

    const visibles = useMemo(() => filas.slice(0, mostrar), [filas, mostrar])
    const abrir = (f: FichaPersona) => { setFicha(f); setAbierta(true) }

    return (
        <div className="flex flex-col gap-4 p-0 md:p-2">
            <CabeceraMantenimiento icono={<Users className="h-5 w-5" />} titulo="Personas y Empresas"
                                   descripcion="Clientes, proveedores, trabajadores y control interno. Haz clic en una fila para ver su ficha.">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white" onClick={() => abrir(fichaPersonaVacia(relacion))}>
                    <UserPlus className="mr-1.5 h-4 w-4" /> Nueva persona
                </Button>
            </CabeceraMantenimiento>

            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />

            <Card className="overflow-hidden shadow-md">
                <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
                    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
                        {[{ id: '', nombre: 'Todas' }, ...RELACIONES].map((r) => (
                            <button key={r.id} onClick={() => setRelacion(r.id)}
                                    className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                        relacion === r.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-border bg-background text-muted-foreground hover:border-blue-300 hover:text-blue-700')}>
                                {r.id ? `${r.id} ${r.nombre}` : r.nombre}
                            </button>
                        ))}
                    </div>
                    <Buscador valor={buscar} onCambio={setBuscar} onBuscar={() => cargar(relacion, buscar)} cargando={cargando}
                              placeholder="Código, RUC / DNI, nombre o nombre comercial" />
                </div>

                {cargando && !filas.length ? (
                    <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
                ) : !filas.length ? (
                    <p className="p-10 text-center text-sm text-muted-foreground">No hay personas con ese filtro.</p>
                ) : (
                    <>
                        {/* Celular: tarjetas */}
                        <ul className="divide-y divide-border md:hidden">
                            {visibles.map((p) => (
                                <li key={p.Codigo}>
                                    <button className="w-full px-3 py-2.5 text-left active:bg-muted" onClick={() => abrir(fichaPersonaDe(p))}>
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="font-mono text-xs text-muted-foreground">{p.Codigo}</span>
                                            <span className="shrink-0 text-[11px] text-blue-700 dark:text-blue-300">{p.TipoRelacion ?? 'Sin relación'}</span>
                                        </div>
                                        <p className="truncate text-sm font-medium text-foreground">{p.Nombre || '(sin nombre)'}</p>
                                        <p className="truncate text-xs text-muted-foreground">{[p.RUC, p.Ciudad].filter(Boolean).join(' · ')}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {/* Escritorio: tabla */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Nombre / Razón social</th><th className="px-3 py-2">Doc.</th>
                                        <th className="px-3 py-2">Nro. doc.</th><th className="px-3 py-2">Relación</th><th className="px-3 py-2">Cta</th><th className="px-3 py-2">Distrito</th></tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {visibles.map((p) => (
                                        <tr key={p.Codigo} className="cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/30" onClick={() => abrir(fichaPersonaDe(p))}>
                                            <td className="px-3 py-1.5 font-mono text-xs">{p.Codigo}</td>
                                            <td className="max-w-[360px] truncate px-3 py-1.5">{p.Nombre}</td>
                                            <td className="px-3 py-1.5 text-xs text-muted-foreground">{p.TipoDocIdent}</td>
                                            <td className="px-3 py-1.5 font-mono text-xs">{p.RUC}</td>
                                            <td className="px-3 py-1.5 text-xs">{p.TipoRelacion ?? <span className="text-amber-600">Sin relación</span>}</td>
                                            <td className="px-3 py-1.5 font-mono text-xs">{p.CodCtaContab}</td>
                                            <td className="max-w-[220px] truncate px-3 py-1.5 text-xs text-muted-foreground">{p.Ciudad}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-border px-3"><VerMas mostrados={mostrar} total={filas.length} onMas={() => setMostrar((n) => n + PASO)} /></div>
                    </>
                )}
            </Card>

            <FichaPersonaDialog abierta={abierta} ficha={ficha} catalogos={catalogos} onCerrar={() => setAbierta(false)} onCambio={() => cargar(relacion, buscar)} />
        </div>
    )
}
