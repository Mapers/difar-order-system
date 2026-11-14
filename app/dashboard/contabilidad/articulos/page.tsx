'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, PackagePlus, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArticulosService } from '@/app/services/contabilidad/DatosGeneralesService'
import { CatalogosArticulos, FichaArticulo, FilaArticulo, Opcion } from '@/app/types/datos-generales-types'
import { AvisoAmbar, Buscador, CabeceraMantenimiento, Combo, texto, textoError, VerMas } from '@/components/contabilidad/datos-generales/comunes'
import { FichaArticuloDialog, fichaArticuloDe, fichaArticuloVacia, ListasAbiertas } from '@/components/contabilidad/datos-generales/articulos/FichaArticuloDialog'
import { PestanaOsce } from '@/components/contabilidad/datos-generales/articulos/PestanaOsce'

const PASO = 100
const distintos = (filas: FilaArticulo[], campo: keyof FilaArticulo) =>
    [...new Set(filas.map((f) => texto(f[campo]).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Bienes y Servicios — ficha contable (Access: Datos Fijos › Datos Generales › BienesServicios, form
 * [Bienes y Servicios 2]) y OSCE (form [BienesYServicios_OSCE]). Los precios de venta siguen en
 * Lista de Precios: aquí no se tocan.
 */
export default function ArticulosContablesPage() {
    const [catalogos, setCatalogos] = useState<CatalogosArticulos | null>(null)
    const [todos, setTodos] = useState<FilaArticulo[]>([])
    const [buscar, setBuscar] = useState('')
    const [filtro, setFiltro] = useState('')
    const [subGrupo, setSubGrupo] = useState('')
    const [cargando, setCargando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [mostrar, setMostrar] = useState(PASO)
    const [ficha, setFicha] = useState<FichaArticulo | null>(null)
    const [fila, setFila] = useState<FilaArticulo | null>(null)
    const [abierta, setAbierta] = useState(false)

    const cargar = useCallback(async () => {
        setCargando(true); setAviso('')
        try { setTodos(await ArticulosService.listar('', '')) } catch (e) { setAviso(await textoError(e, 'No se pudo cargar la lista de bienes y servicios.')) } finally { setCargando(false) }
    }, [])
    useEffect(() => {
        cargar()
        ArticulosService.catalogos().then(setCatalogos).catch(async (e) => setAviso(await textoError(e, 'No se pudieron cargar los combos de la ficha.')))
    }, [cargar])

    const filas = useMemo(() => {
        const t = normal(filtro.trim())
        return todos.filter((a) => (!subGrupo || String(a.SubLinea) === subGrupo)
            && (!t || texto(a.Codigo_Art).startsWith(filtro.trim()) || normal(texto(a.NombreItem)).includes(t)))
    }, [todos, filtro, subGrupo])
    useEffect(() => { setMostrar(PASO) }, [filtro, subGrupo])
    const visibles = useMemo(() => filas.slice(0, mostrar), [filas, mostrar])

    const listas = useMemo<ListasAbiertas>(() => ({
        medida: distintos(todos, 'Medida'), tipo: distintos(todos, 'Presentacion'), modelo: distintos(todos, 'PrincipioAdictivo'),
        marca: distintos(todos, 'idMarca'), otros1: distintos(todos, 'otros1'), otros2: distintos(todos, 'otros2'), control: distintos(todos, 'CodigoAsisa'),
    }), [todos])
    const subGrupos = useMemo<Opcion[]>(() => (catalogos?.subGrupos ?? []).map((s) => ({ id: s.id, codigo: s.codigo, nombre: s.nombre })), [catalogos])

    const abrir = (a: FilaArticulo | null) => { setFila(a); setFicha(a ? fichaArticuloDe(a) : fichaArticuloVacia()); setAbierta(true) }

    return (
        <div className="flex flex-col gap-4 p-0 md:p-2">
            <CabeceraMantenimiento icono={<Boxes className="h-5 w-5" />} titulo="Bienes y Servicios"
                                   descripcion="Ficha contable de los artículos: sub-grupo, unidad, tipo de existencia, cuentas contables y código OSCE.">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white" onClick={() => abrir(null)}><PackagePlus className="mr-1.5 h-4 w-4" /> Nuevo artículo</Button>
            </CabeceraMantenimiento>
            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />

            <Tabs defaultValue="articulos">
                <TabsList className="h-auto gap-1 bg-muted p-1">
                    <TabsTrigger value="articulos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Bienes y servicios</TabsTrigger>
                    <TabsTrigger value="osce" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">OSCE</TabsTrigger>
                </TabsList>

                <TabsContent value="articulos">
                    <Card className="overflow-hidden shadow-md">
                        <div className="grid grid-cols-1 gap-2 border-b border-border p-3 sm:grid-cols-[1fr_18rem] sm:p-4">
                            <Buscador valor={buscar} onCambio={(v) => { setBuscar(v); if (!v) setFiltro('') }} onBuscar={() => setFiltro(buscar)} placeholder="Código (empieza con) o descripción" />
                            <Combo items={subGrupos} valor={subGrupo} onCambio={setSubGrupo} placeholder="Todos los sub-grupos" vaciable />
                        </div>
                        {cargando && !todos.length ? (
                            <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
                        ) : !filas.length ? (
                            <p className="p-10 text-center text-sm text-muted-foreground">No hay artículos con ese filtro.</p>
                        ) : (
                            <>
                                <ul className="divide-y divide-border md:hidden">
                                    {visibles.map((a) => (
                                        <li key={a.IdArticulo}>
                                            <button className="w-full px-3 py-2.5 text-left active:bg-muted" onClick={() => abrir(a)}>
                                                <div className="flex items-baseline justify-between gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">{a.Codigo_Art ?? 'sin código'}</span>
                                                    <span className="truncate text-[11px] text-blue-700 dark:text-blue-300">{a.SubGrupo}</span>
                                                </div>
                                                <p className="truncate text-sm font-medium text-foreground">{a.NombreItem || '(sin descripción)'}</p>
                                                <p className="truncate text-xs text-muted-foreground">{[a.UnidadDescripcion, a.TipoExistenciaDescripcion, a.CodCtaVentas && `Vta ${a.CodCtaVentas}`].filter(Boolean).join(' · ')}</p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2">Sub-grupo</th><th className="px-3 py-2">Unidad</th>
                                                <th className="px-3 py-2">Tipo existencia</th><th className="px-3 py-2">Cta ventas</th><th className="px-3 py-2">Cta existencias</th><th className="px-3 py-2">OSCE</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {visibles.map((a) => (
                                                <tr key={a.IdArticulo} className="cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-950/30" onClick={() => abrir(a)}>
                                                    <td className="px-3 py-1.5 font-mono text-xs">{a.Codigo_Art ?? <span className="text-amber-600">sin código</span>}</td>
                                                    <td className="max-w-[340px] truncate px-3 py-1.5">{a.NombreItem}</td>
                                                    <td className="max-w-[180px] truncate px-3 py-1.5 text-xs text-muted-foreground">{a.SubGrupo}</td>
                                                    <td className="px-3 py-1.5 text-xs">{a.UnidadDescripcion}</td>
                                                    <td className="max-w-[160px] truncate px-3 py-1.5 text-xs">{a.TipoExistenciaDescripcion}</td>
                                                    <td className="px-3 py-1.5 font-mono text-xs">{a.CodCtaVentas}</td>
                                                    <td className="px-3 py-1.5 font-mono text-xs">{a.CodCtaExistencias ?? <span className="text-muted-foreground">—</span>}</td>
                                                    <td className="px-3 py-1.5 font-mono text-xs">{a.CodigoOsce}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-t border-border px-3"><VerMas mostrados={mostrar} total={filas.length} onMas={() => setMostrar((n) => n + PASO)} /></div>
                            </>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="osce">
                    <Card className="p-3 shadow-md sm:p-4"><PestanaOsce catalogos={catalogos} /></Card>
                </TabsContent>
            </Tabs>

            <FichaArticuloDialog abierta={abierta} ficha={ficha} fila={fila} catalogos={catalogos} listas={listas}
                                 onCerrar={() => setAbierta(false)} onCambio={cargar} />
        </div>
    )
}
