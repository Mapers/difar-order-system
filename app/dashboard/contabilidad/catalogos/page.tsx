'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Database, Eye, Info, Loader2, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { DatosControlService } from '@/app/services/contabilidad/DatosControlService'
import { ClaveCatalogo, CombosDatosControl, FilaCatalogo } from '@/app/types/datos-control-types'
import { AvisoAmbar } from '@/components/contabilidad/catalogos/AvisoAmbar'
import { BotonAccess, CATALOGOS, FILAS_ACCESS } from '@/components/contabilidad/catalogos/definiciones'
import { FichaCatalogoDialog } from '@/components/contabilidad/catalogos/FichaCatalogoDialog'
import { EliminarCatalogoDialog } from '@/components/contabilidad/catalogos/EliminarCatalogoDialog'

const BOTONES: BotonAccess[] = FILAS_ACCESS.flat()
const RECORDAR = 'catalogos.boton'

/**
 * Catálogos (Access: Datos Fijos › Datos de Control, 21 botones).
 * Mismos botones y filas que el menú Access; cada botón abre su catálogo (o sus forms hijos en pestañas),
 * con lista, ficha (alta / modificar) y eliminar bloqueado si el registro está en uso.
 */
export default function CatalogosPage() {
    const [boton, setBoton] = useState<string>('Zonas')
    const [catalogo, setCatalogo] = useState<ClaveCatalogo>('zona')
    const [filas, setFilas] = useState<FilaCatalogo[]>([])
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [buscar, setBuscar] = useState('')
    const [combos, setCombos] = useState<CombosDatosControl | null>(null)
    const [ficha, setFicha] = useState<{ fila: FilaCatalogo | null } | null>(null)
    const [eliminar, setEliminar] = useState<FilaCatalogo | null>(null)

    const actual = BOTONES.find(b => b.boton === boton) ?? BOTONES[0]
    const def = CATALOGOS[catalogo]

    const elegirBoton = (b: BotonAccess) => {
        setBoton(b.boton); setBuscar('')
        if (b.catalogos[0]) setCatalogo(b.catalogos[0])
        try { localStorage.setItem(RECORDAR, b.boton) } catch { /* sin almacenamiento */ }
    }

    useEffect(() => {
        try {
            const b = BOTONES.find(x => x.boton === localStorage.getItem(RECORDAR))
            if (b) { setBoton(b.boton); if (b.catalogos[0]) setCatalogo(b.catalogos[0]) }
        } catch { /* sin almacenamiento */ }
        DatosControlService.combos().then(setCombos).catch(() => setCombos(null))
    }, [])

    // B3 (auditoría 14/11/2026): si un catálogo responde tarde, su lista NO debe aparecer bajo el que se eligió
    // después (se podría modificar o eliminar con el id de otro catálogo). Solo cuenta la última petición.
    const peticion = useRef(0)
    const cargar = useCallback(async () => {
        if (!actual.catalogos.includes(catalogo)) return
        const mia = ++peticion.current
        setCargando(true); setError(null)
        try {
            const datos = await DatosControlService.listar(catalogo)
            if (mia === peticion.current) setFilas(datos)
        } catch (e) {
            if (mia === peticion.current) { setFilas([]); setError(await mensajeError(e, 'No se pudo cargar el catálogo.')) }
        } finally { if (mia === peticion.current) setCargando(false) }
    }, [catalogo, actual])
    useEffect(() => { setFilas([]) }, [catalogo])
    useEffect(() => { cargar() }, [cargar])

    const huboCambio = () => { cargar(); DatosControlService.combos().then(setCombos).catch(() => {}) }

    const visibles = useMemo(() => {
        const t = buscar.trim().toLowerCase()
        if (!t) return filas
        return filas.filter(f => def.columnas.some(c => c.valor(f).toLowerCase().includes(t)))
    }, [filas, buscar, def])

    const puedeAlta = !def.soloLectura && !def.sinAlta
    const puedeEliminar = !def.soloLectura && !def.sinEliminar

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-3 sm:p-6">
            <header className="flex flex-col gap-1">
                <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                    <Database className="h-6 w-6 text-blue-600" />Catálogos
                </h1>
                <p className="text-sm text-muted-foreground">Datos Fijos › Datos de Control: los mismos botones del menú de Access. Elige uno para ver y mantener su catálogo.</p>
            </header>

            {/* Botones de Access, en sus 3 filas */}
            <nav aria-label="Catálogos" className="flex flex-col gap-1.5 rounded-lg border bg-card p-2 sm:p-3">
                {FILAS_ACCESS.map((fila, i) => (
                    <div key={i} className="flex flex-wrap gap-1.5">
                        {fila.map(b => (
                            <Button key={b.boton} size="sm" variant={b.boton === boton ? 'default' : 'outline'} onClick={() => elegirBoton(b)}
                                    className={cn('h-8 px-2.5 text-xs sm:text-sm', b.boton === boton && 'bg-blue-600 text-white hover:bg-blue-700',
                                        b.noMigra && b.boton !== boton && 'text-muted-foreground')}>
                                {b.boton}
                            </Button>
                        ))}
                    </div>
                ))}
            </nav>

            {actual.enlace && (
                <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                    <Users className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{actual.enlace.texto}{' '}
                        <Link href={actual.enlace.href} className="font-medium underline">Ir a Usuarios</Link>
                    </p>
                </div>
            )}
            {actual.noMigra && <AvisoAmbar titulo="No se migra">{actual.noMigra}</AvisoAmbar>}

            {actual.catalogos.length > 0 && (
                <section className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:p-4">
                    {actual.catalogos.length > 1 && (
                        <div role="tablist" className="flex flex-wrap gap-1 border-b pb-2">
                            {actual.catalogos.map(c => (
                                <button key={c} role="tab" aria-selected={c === catalogo} type="button"
                                        onClick={() => { setCatalogo(c); setBuscar('') }}
                                        className={cn('rounded-md px-3 py-1.5 text-sm transition-colors',
                                            c === catalogo ? 'bg-blue-100 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200' : 'text-muted-foreground hover:bg-muted')}>
                                    {CATALOGOS[c].titulo}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold sm:text-lg">{def.titulo}</h2>
                            <Badge variant="secondary" className="tabular-nums">{filas.length}</Badge>
                            {def.soloLectura && <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700 dark:text-blue-300"><Eye className="h-3 w-3" />Solo consulta</Badge>}
                            {def.sinAlta && !def.soloLectura && <Badge variant="outline">Solo modificar</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{def.access}</p>
                        {def.nota && !def.soloLectura && <p className="flex gap-1 text-xs text-muted-foreground"><Info className="mt-0.5 h-3 w-3 shrink-0" />{def.nota}</p>}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="h-9 pl-8" placeholder="Buscar en la lista" value={buscar} onChange={e => setBuscar(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-9 flex-1 sm:flex-none" onClick={cargar} disabled={cargando}>
                                <RefreshCw className={cn('mr-1.5 h-4 w-4', cargando && 'animate-spin')} />Actualizar
                            </Button>
                            {puedeAlta && (
                                <Button size="sm" className="h-9 flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white sm:flex-none" onClick={() => setFicha({ fila: null })}>
                                    <Plus className="mr-1.5 h-4 w-4" />Nuevo
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <AvisoAmbar titulo="No se pudo cargar el catálogo">
                            {error} <button type="button" className="font-medium underline" onClick={cargar}>Reintentar</button>
                        </AvisoAmbar>
                    )}

                    {cargando && filas.length === 0 ? (
                        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Cargando…</p>
                    ) : visibles.length === 0 && !error ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">{buscar ? 'Sin coincidencias.' : 'Sin registros.'}</p>
                    ) : (
                        <>
                            {/* Celular: tarjetas */}
                            <ul className="flex flex-col divide-y rounded-md border md:hidden">
                                {visibles.map(f => (
                                    <li key={String(f.id)} className="flex items-center gap-2 px-3 py-2">
                                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setFicha({ fila: f })}>
                                            <p className="truncate text-sm font-medium">
                                                <span className="mr-2 font-mono text-xs text-muted-foreground">{def.columnas[0].valor(f)}</span>{def.columnas[1]?.valor(f)}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {def.columnas.slice(2).map(c => c.valor(f)).filter(Boolean).join(' · ')}
                                            </p>
                                        </button>
                                        {puedeEliminar && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-amber-700" aria-label="Eliminar" onClick={() => setEliminar(f)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {/* Escritorio: tabla */}
                            <div className="hidden max-h-[60vh] overflow-auto rounded-md border md:block">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                                        <TableRow>
                                            {def.columnas.map(c => <TableHead key={c.etiqueta} className={cn(c.secundaria && 'hidden lg:table-cell')}>{c.etiqueta}</TableHead>)}
                                            {puedeEliminar && <TableHead className="w-12" />}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibles.map(f => (
                                            <TableRow key={String(f.id)} className="cursor-pointer" onClick={() => setFicha({ fila: f })}>
                                                {def.columnas.map(c => (
                                                    <TableCell key={c.etiqueta} className={cn('py-2', c.mono && 'font-mono text-xs', c.secundaria && 'hidden lg:table-cell')}>{c.valor(f)}</TableCell>
                                                ))}
                                                {puedeEliminar && (
                                                    <TableCell className="py-1 text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-700" aria-label="Eliminar"
                                                                onClick={(e) => { e.stopPropagation(); setEliminar(f) }}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <p className="text-xs text-muted-foreground">Toca un registro para ver su ficha{def.soloLectura ? '.' : ' y modificarlo.'}</p>
                        </>
                    )}
                </section>
            )}

            <FichaCatalogoDialog def={def} fila={ficha?.fila ?? null} abierta={!!ficha} combos={combos}
                                 onCerrar={() => setFicha(null)} onCambio={huboCambio}
                                 onEliminar={(f) => { setFicha(null); setEliminar(f) }} />
            <EliminarCatalogoDialog def={def} fila={eliminar} onCerrar={() => setEliminar(null)} onCambio={huboCambio} />
        </div>
    )
}
