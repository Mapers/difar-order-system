'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
    AlertTriangle, CalendarDays, CheckCircle2, CircleDashed, Copy, FileDown, GitCompare, Landmark, Loader2,
    PlayCircle, Search, ShieldAlert, ShoppingCart, Trash2, Users, Wallet, BookOpen, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AvisoAmbar, Combo, claseInput, textoError, useSacudir } from '@/components/contabilidad/datos-generales/comunes'
import {
    ActualizacionContableService, BloqueClave, EstadoDiferencia, FilaAlcance, FilaDetalle, ResultadoBloque,
} from '@/app/services/contabilidad/ActualizacionContableService'

// ------------------------------------------------------------------ utilidades
const soles = (v: unknown) => `S/ ${Number(v ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const entero = (v: unknown) => Number(v ?? 0).toLocaleString('es-PE')
const dmy = (v: unknown) => { if (!v) return ''; const s = String(v).slice(0, 10); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` }

/** Los 5 bloques del botón "guardar" del Access, en su orden de ejecución. */
const BLOQUES: { clave: BloqueClave; nombre: string; consultas: number; icono: React.ElementType }[] = [
    { clave: 'bcos', nombre: 'Bancos', consultas: 6, icono: Landmark },
    { clave: 'caja', nombre: 'Caja', consultas: 8, icono: Wallet },
    { clave: 'diar', nombre: 'Diario', consultas: 7, icono: BookOpen },
    { clave: 'clie', nombre: 'Clientes / Ventas', consultas: 12, icono: Users },
    { clave: 'prov', nombre: 'Proveedores / Compras', consultas: 17, icono: ShoppingCart },
]

const ESTADOS: Record<EstadoDiferencia, { texto: string; chip: string; ayuda: string }> = {
    DUPLICADO: { texto: 'Duplicado', chip: 'bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-200', ayuda: 'El movimiento está más veces de lo que corresponde.' },
    FALTA: { texto: 'Falta', chip: 'bg-amber-100 text-amber-900 ring-amber-600/25 dark:bg-amber-950/60 dark:text-amber-200', ayuda: 'El documento existe pero no tiene su movimiento.' },
    SOBRA: { texto: 'Sobra', chip: 'bg-violet-100 text-violet-800 ring-violet-600/20 dark:bg-violet-950/60 dark:text-violet-200', ayuda: 'Hay un movimiento cuyo documento ya no existe.' },
    IMPORTE_DISTINTO: { texto: 'Importe distinto', chip: 'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-200', ayuda: 'El movimiento existe pero con otro monto.' },
}
const POR_PAGINA = 30

type EstadoBloque = { estado: 'espera' | 'revisando' | 'ok' | 'error'; resultado?: ResultadoBloque; error?: string }

// ================================================================== pantalla
export function ActualizacionContable() {
    const hoy = new Date()
    const [anio, setAnio] = useState(String(hoy.getFullYear()))
    const [bloques, setBloques] = useState<Record<BloqueClave, EstadoBloque>>(() => Object.fromEntries(BLOQUES.map(b => [b.clave, { estado: 'espera' }])) as Record<BloqueClave, EstadoBloque>)
    const [activo, setActivo] = useState<BloqueClave>('bcos')
    const [revisando, setRevisando] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const [golpe, setGolpe] = useState(0)
    const [filtro, setFiltro] = useState<'todos' | EstadoDiferencia>('todos')
    const [buscar, setBuscar] = useState('')
    const [pagina, setPagina] = useState(1)
    const [alcance, setAlcance] = useState<{ cargando: boolean; filas?: FilaAlcance[]; noVuelven?: number; total?: number; error?: string } | null>(null)
    const refAviso = useSacudir(!!aviso, golpe)
    const anios = useMemo(() => Array.from({ length: hoy.getFullYear() - 2023 }, (_, i) => String(hoy.getFullYear() - i)).map(a => ({ id: a, nombre: a })), [])

    // Si se cambia el año a mitad de una revisión, se descartan las respuestas del año anterior.
    const turno = useRef(0)
    const reiniciar = (nuevo: string) => {
        turno.current++
        setAnio(nuevo); setAlcance(null); setPagina(1)
        setBloques(Object.fromEntries(BLOQUES.map(b => [b.clave, { estado: 'espera' }])) as Record<BloqueClave, EstadoBloque>)
    }

    /** Revisa un bloque (o todos, uno tras otro: el backend atiende una revisión a la vez). */
    const revisar = async (lista: BloqueClave[]) => {
        const yo = ++turno.current
        setRevisando(true); setAviso(null)
        for (const clave of lista) {
            if (yo !== turno.current) break
            setActivo(clave); setPagina(1)
            setBloques(b => ({ ...b, [clave]: { estado: 'revisando' } }))
            try {
                const r = await ActualizacionContableService.revisar(clave, Number(anio))
                if (yo !== turno.current) break
                setBloques(b => ({ ...b, [clave]: { estado: 'ok', resultado: r } }))
            } catch (e) {
                if (yo !== turno.current) break
                const msg = await textoError(e, 'No se pudo revisar este bloque.')
                setBloques(b => ({ ...b, [clave]: { estado: 'error', error: msg } }))
                setAviso(msg); setGolpe(g => g + 1)
            }
        }
        if (yo === turno.current) setRevisando(false)
    }

    const verAlcance = async () => {
        setAlcance({ cargando: true })
        try {
            const r = await ActualizacionContableService.alcanceElimina(Number(anio))
            setAlcance({ cargando: false, filas: r.filas, noVuelven: r.resumen.filasQueNoVuelven, total: r.resumen.totalFilas })
        } catch (e) { setAlcance({ cargando: false, error: await textoError(e, 'No se pudo calcular el alcance.') }) }
    }

    const actual = bloques[activo]
    const res = actual.resultado
    const detalle = useMemo(() => {
        const t = buscar.trim().toLowerCase()
        return (res?.detalle ?? []).filter(f =>
            (filtro === 'todos' || f.estado === filtro) &&
            (!t || `${f.consulta} ${f.tabla_destino} ${f.clave ?? ''} ${f.cod_persona ?? ''} ${f.nombre_persona ?? ''} ${f.documento ?? ''} ${f.cuenta ?? ''} ${f.voucher ?? ''} ${f.ids_reales ?? ''}`.toLowerCase().includes(t)))
    }, [res, filtro, buscar])
    const paginas = Math.max(1, Math.ceil(detalle.length / POR_PAGINA))
    const visibles = detalle.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
    const cuenta = (e: 'todos' | EstadoDiferencia) => (res?.detalle ?? []).filter(f => e === 'todos' || f.estado === e).length

    const global = useMemo(() => {
        const t = { revisados: 0, duplicados: 0, faltantes: 0, sobrantes: 0, importe_distinto: 0 }
        for (const b of Object.values(bloques)) if (b.resultado) {
            t.revisados++; t.duplicados += b.resultado.totales.duplicados; t.faltantes += b.resultado.totales.faltantes
            t.sobrantes += b.resultado.totales.sobrantes; t.importe_distinto += b.resultado.totales.importe_distinto
        }
        return t
    }, [bloques])

    const exportar = async () => {
        const hechos = BLOQUES.filter(b => bloques[b.clave].resultado)
        if (!hechos.length) return
        const ExcelJS = (await import('exceljs')).default
        const wb = new ExcelJS.Workbook()
        const fmt = '"S/ "#,##0.00;[Red]"S/ "-#,##0.00'
        const cab = (ws: any) => { const r = ws.getRow(1); r.font = { bold: true, color: { argb: 'FFFFFFFF' } }; r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4078' } }; ws.views = [{ state: 'frozen', ySplit: 1 }] }
        const r = wb.addWorksheet('Resumen')
        r.columns = [{ header: 'Bloque', key: 'b', width: 22 }, { header: 'Consulta Access', key: 'consulta', width: 34 }, { header: 'Tabla destino', key: 'tabla_destino', width: 24 }, { header: 'Módulo', key: 'modulo', width: 12 },
            { header: 'Esperado', key: 'esperado_filas', width: 11 }, { header: 'Real', key: 'real_filas', width: 11 }, { header: 'Importe esperado', key: 'esperado_importe', width: 17 }, { header: 'Importe real', key: 'real_importe', width: 17 },
            { header: 'OK', key: 'ok', width: 8 }, { header: 'Duplicados', key: 'duplicados', width: 11 }, { header: 'Faltan', key: 'faltantes', width: 9 }, { header: 'Sobran', key: 'sobrantes', width: 9 }, { header: 'Importe distinto', key: 'importe_distinto', width: 15 }, { header: 'Origen web', key: 'origen_web', width: 11 }]
        hechos.forEach(b => bloques[b.clave].resultado!.resumen.forEach(f => r.addRow({ ...f, b: b.nombre })))
        r.getColumn('esperado_importe').numFmt = fmt; r.getColumn('real_importe').numFmt = fmt; cab(r)
        const d = wb.addWorksheet('Diferencias')
        d.columns = [{ header: 'Bloque', key: 'b', width: 18 }, { header: 'Estado', key: 'estado', width: 16 }, { header: 'Consulta', key: 'consulta', width: 28 }, { header: 'Tabla', key: 'tabla_destino', width: 22 },
            { header: 'Fecha', key: 'fecha', width: 11 }, { header: 'Mes', key: 'mes', width: 6 }, { header: 'Voucher', key: 'voucher', width: 10 }, { header: 'Cód. persona', key: 'cod_persona', width: 13 }, { header: 'Nombre', key: 'nombre_persona', width: 36 },
            { header: 'Documento', key: 'documento', width: 20 }, { header: 'Cuenta', key: 'cuenta', width: 10 }, { header: 'Esperado', key: 'esperado_filas', width: 9 }, { header: 'Real', key: 'real_filas', width: 7 },
            { header: 'Importe esperado', key: 'esperado_importe', width: 16 }, { header: 'Importe real', key: 'real_importe', width: 16 }, { header: 'Id que se conserva', key: 'id_original', width: 14 }, { header: 'Ids de más', key: 'ids_sobrantes', width: 22 }, { header: 'Ids reales', key: 'ids_reales', width: 26 }, { header: 'Clave', key: 'clave', width: 40 }]
        hechos.forEach(b => bloques[b.clave].resultado!.detalle.forEach(f => d.addRow({ ...f, b: b.nombre, estado: ESTADOS[f.estado]?.texto ?? f.estado, fecha: dmy(f.fecha) })))
        d.getColumn('esperado_importe').numFmt = fmt; d.getColumn('real_importe').numFmt = fmt; cab(d)
        d.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 19 } }
        const buf = await wb.xlsx.writeBuffer()
        const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
        const a = document.createElement('a'); a.href = url; a.download = `Actualizacion_Contable_${anio}.xlsx`; a.click(); URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-4 p-3 sm:p-5">
            {/* Cabecera */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"><GitCompare className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contabilidad · Datos de movimientos</p>
                        <h1 className="text-xl font-bold leading-tight sm:text-2xl">Actualización Contable</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">Compara lo que grabaría el Access con lo que hay en kardex, mayor y registros. <b>No borra ni graba nada.</b></p>
                    </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                    <div className="w-32 space-y-1"><p className="text-xs font-medium text-muted-foreground">Año</p><Combo items={anios} valor={anio} onCambio={v => v && reiniciar(v)} icono={CalendarDays} disabled={revisando} /></div>
                    <Button variant="outline" onClick={exportar} disabled={revisando || global.revisados === 0}><FileDown className="mr-2 h-4 w-4" /> Exportar Excel</Button>
                    <Button onClick={() => revisar(BLOQUES.map(b => b.clave))} disabled={revisando}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700">
                        {revisando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} Revisar todo
                    </Button>
                </div>
            </div>

            {aviso && <div ref={refAviso}><AvisoAmbar mensaje={aviso} onCerrar={() => setAviso(null)} /></div>}

            {/* Totales generales */}
            {global.revisados > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Tarjeta titulo="Duplicados" valor={global.duplicados} clase="text-rose-700 dark:text-rose-300" icono={Copy} />
                    <Tarjeta titulo="Faltan" valor={global.faltantes} clase="text-amber-700 dark:text-amber-300" icono={CircleDashed} />
                    <Tarjeta titulo="Sobran" valor={global.sobrantes} clase="text-violet-700 dark:text-violet-300" icono={XCircle} />
                    <Tarjeta titulo="Importe distinto" valor={global.importe_distinto} clase="text-sky-700 dark:text-sky-300" icono={AlertTriangle} />
                </div>
            )}

            {/* Bloques del botón "guardar" */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {BLOQUES.map(b => {
                    const e = bloques[b.clave]; const t = e.resultado?.totales
                    const problemas = t ? t.duplicados + t.faltantes + t.sobrantes + t.importe_distinto : 0
                    const Icono = b.icono
                    return (
                        <button key={b.clave} type="button" onClick={() => { setActivo(b.clave); setPagina(1) }}
                                className={cn('rounded-xl border bg-card p-3 text-left shadow-md shadow-slate-900/10 transition duration-200 animate-in fade-in-0 slide-in-from-top-2 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/40', activo === b.clave && 'ring-2 ring-blue-500', e.estado === 'revisando' && 'animate-pulse')}>
                            <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2 font-semibold"><Icono className="h-4 w-4 text-blue-600" /> {b.nombre}</span>
                                {e.estado === 'revisando' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                                {e.estado === 'ok' && (problemas ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />)}
                                {e.estado === 'error' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{b.consultas} consultas del Access</p>
                            <p className="mt-2 text-sm">
                                {e.estado === 'espera' && <span className="text-muted-foreground">Sin revisar</span>}
                                {e.estado === 'revisando' && <span className="text-blue-700 dark:text-blue-300">Revisando…</span>}
                                {e.estado === 'error' && <span className="text-amber-700 dark:text-amber-300">No se pudo revisar</span>}
                                {e.estado === 'ok' && (problemas
                                    ? <span className="font-medium text-amber-800 dark:text-amber-200">{entero(problemas)} con diferencias</span>
                                    : <span className="font-medium text-emerald-700 dark:text-emerald-300">Todo cuadra</span>)}
                            </p>
                        </button>
                    )
                })}
            </div>

            {/* Bloque activo */}
            <div className="rounded-2xl border bg-card p-3 shadow-md shadow-slate-900/5 dark:shadow-black/30 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{BLOQUES.find(b => b.clave === activo)?.nombre} · {anio}</h2>
                    <Button variant="outline" size="sm" onClick={() => revisar([activo])} disabled={revisando}>
                        {actual.estado === 'revisando' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />} Revisar este bloque
                    </Button>
                </div>

                {actual.estado === 'espera' && <p className="py-8 text-center text-sm text-muted-foreground">Pulsa <b>Revisar todo</b> o <b>Revisar este bloque</b>. La revisión solo lee la base.</p>}
                {actual.estado === 'revisando' && <p className="flex items-center justify-center gap-2 py-8 text-sm text-blue-700 dark:text-blue-300"><Loader2 className="h-4 w-4 animate-spin" /> Comparando todo el año {anio}… puede tardar unos segundos.</p>}
                {actual.estado === 'error' && <AvisoAmbar className="mt-3" mensaje={actual.error} />}

                {res && (
                    <>
                        {/* Resumen por consulta del Access (cards) */}
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {res.resumen.map((f, i) => {
                                const mal = f.duplicados + f.faltantes + f.sobrantes + f.importe_distinto > 0
                                return (
                                    <div key={`${activo}-${i}`} style={{ animationDelay: `${Math.min(i, 12) * 45}ms`, animationFillMode: 'both' }}
                                         className={cn('rounded-xl border bg-card p-3 shadow-md shadow-slate-900/10 transition duration-200 animate-in fade-in-0 slide-in-from-bottom-2 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/40',
                                             mal ? 'border-amber-300 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-900')}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="break-words font-semibold leading-tight">{f.consulta}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">{f.tabla_destino}{f.modulo ? ` · ${f.modulo}` : ''}</p>
                                            </div>
                                            {mal ? <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <Dato titulo="Debería haber" valor={entero(f.esperado_filas)} sub={soles(f.esperado_importe)} />
                                            <Dato titulo="Hay" valor={entero(f.real_filas)} sub={soles(f.real_importe)} resaltar={f.real_filas !== f.esperado_filas} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            <Pastilla texto="OK" v={f.ok} clase="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200" siempre />
                                            <Pastilla texto="Duplicados" v={f.duplicados} clase={ESTADOS.DUPLICADO.chip} />
                                            <Pastilla texto="Faltan" v={f.faltantes} clase={ESTADOS.FALTA.chip} />
                                            <Pastilla texto="Sobran" v={f.sobrantes} clase={ESTADOS.SOBRA.chip} />
                                            <Pastilla texto="Imp. distinto" v={f.importe_distinto} clase={ESTADOS.IMPORTE_DISTINTO.chip} />
                                            <Pastilla texto="Origen web" v={f.origen_web} clase="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">"Origen web": movimientos que graba la web (ventas, notas de crédito, facturación electrónica). El formulario del Access no los genera, por eso no se cuentan como sobrantes.</p>

                        {/* Detalle de diferencias */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {(['todos', 'DUPLICADO', 'FALTA', 'SOBRA', 'IMPORTE_DISTINTO'] as const).map(e => (
                                <button key={e} type="button" onClick={() => { setFiltro(e); setPagina(1) }}
                                        className={cn('rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition', filtro === e ? 'bg-blue-600 text-white ring-blue-600' : e === 'todos' ? 'bg-muted ring-border' : ESTADOS[e].chip)}
                                        title={e === 'todos' ? undefined : ESTADOS[e].ayuda}>
                                    {e === 'todos' ? 'Todas' : ESTADOS[e].texto} ({entero(cuenta(e))})
                                </button>
                            ))}
                            <div className="relative ml-auto w-full sm:w-80">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1) }} placeholder="Cliente, proveedor, documento, cuenta, voucher o Id" className={cn(claseInput, 'pl-9')} />
                            </div>
                        </div>

                        {detalle.length === 0 ? (
                            <p className="flex items-center justify-center gap-2 py-6 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {res.detalle.length ? 'No hay diferencias con ese filtro.' : 'Todo cuadra: no hay diferencias en este bloque.'}</p>
                        ) : (
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {visibles.map((f, i) => (
                                    <div key={`${activo}-${pagina}-${filtro}-${i}`} style={{ animationDelay: `${Math.min(i, 15) * 35}ms`, animationFillMode: 'both' }}
                                         className="rounded-xl border bg-card p-3 shadow-md shadow-slate-900/10 transition duration-200 animate-in fade-in-0 zoom-in-95 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/40">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', ESTADOS[f.estado]?.chip)}>{ESTADOS[f.estado]?.texto ?? f.estado}</span>
                                            <span className="text-xs text-muted-foreground">{dmy(f.fecha)}{f.voucher != null && f.voucher !== '' ? ` · Voucher ${f.voucher}` : ''}</span>
                                        </div>
                                        <p className="mt-2 break-words font-semibold leading-tight">{f.nombre_persona || 'Sin nombre'}</p>
                                        <p className="text-xs text-muted-foreground">{[f.cod_persona, f.documento, f.cuenta ? `Cta. ${f.cuenta}` : null].filter(Boolean).join(' · ') || '—'}</p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <Dato titulo="Debería haber" valor={entero(f.esperado_filas)} sub={soles(f.esperado_importe)} />
                                            <Dato titulo="Hay" valor={entero(f.real_filas)} sub={soles(f.real_importe)} resaltar />
                                        </div>
                                        <div className="mt-3 rounded-lg bg-muted/50 px-2.5 py-2 text-xs">
                                            <p className="text-muted-foreground">{f.consulta} · {f.tabla_destino}</p>
                                            {f.id_original != null && <p className="mt-0.5">Se conserva Id <b>{f.id_original}</b></p>}
                                            {f.ids_sobrantes && <p className="mt-0.5 break-all text-rose-700 dark:text-rose-300">De más: {f.ids_sobrantes}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {paginas > 1 && (
                            <div className="mt-2 flex items-center justify-end gap-2 text-sm">
                                <span className="text-muted-foreground">{entero(detalle.length)} diferencias · página {pagina} de {paginas}</span>
                                <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
                                <Button size="sm" variant="outline" disabled={pagina >= paginas} onClick={() => setPagina(p => p + 1)}>Siguiente</Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Lo que borraría "elimina" del Access (informativo) */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/20 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Botón "elimina" del Access</h3>
                            <p className="text-sm text-amber-900/80 dark:text-amber-200/80">Aquí no existe: solo se muestra cuánto borraría en el Access para {anio} y qué no se volvería a generar.</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={verAlcance} disabled={revisando || alcance?.cargando} className="border-amber-400">
                        {alcance?.cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Ver alcance
                    </Button>
                </div>
                {alcance?.error && <AvisoAmbar className="mt-3" mensaje={alcance.error} />}
                {alcance?.filas && (
                    <>
                        <p className="mt-3 text-sm font-medium text-amber-900 dark:text-amber-200">Borraría {entero(alcance.total)} filas; {entero(alcance.noVuelven)} no se volverían a generar.</p>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {alcance.filas.map((f, i) => {
                                const pierde = String(f.se_regenera).toUpperCase() === 'NO'
                                return (
                                    <div key={i} style={{ animationDelay: `${Math.min(i, 12) * 45}ms`, animationFillMode: 'both' }}
                                         className={cn('rounded-xl border bg-card p-3 shadow-md shadow-slate-900/10 transition duration-200 animate-in fade-in-0 slide-in-from-bottom-2 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/40',
                                             pierde ? 'border-amber-400 dark:border-amber-700' : 'border-border')}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0"><p className="font-semibold">{f.tabla}</p><p className="text-xs text-muted-foreground">{f.modulo ? `Módulo ${f.modulo}` : 'Todo el año'}</p></div>
                                            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', pierde ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200')}>
                                                {pierde ? 'Se perdería' : 'Vuelve con "guardar"'}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <Dato titulo="Filas que borraría" valor={entero(f.filas)} resaltar={pierde} />
                                            <Dato titulo="Importe" valor={soles(f.importe)} />
                                        </div>
                                        {f.nota && <p className="mt-2 text-xs text-muted-foreground">{f.nota}</p>}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function Tarjeta({ titulo, valor, clase, icono: Icono }: { titulo: string; valor: number; clase: string; icono: React.ElementType }) {
    return (
        <div className="rounded-xl border bg-card p-3 shadow-md shadow-slate-900/10 animate-in fade-in-0 zoom-in-95 dark:shadow-black/40">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icono className="h-3.5 w-3.5" /> {titulo}</p>
            <p className={cn('mt-1 text-2xl font-bold tabular-nums', clase)}>{entero(valor)}</p>
        </div>
    )
}

function Dato({ titulo, valor, sub, resaltar }: { titulo: string; valor: string; sub?: string; resaltar?: boolean }) {
    return (
        <div className={cn('rounded-lg border px-2.5 py-2', resaltar ? 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30' : 'bg-muted/30')}>
            <p className="text-[11px] text-muted-foreground">{titulo}</p>
            <p className="text-base font-bold tabular-nums">{valor}</p>
            {sub && <p className="text-xs tabular-nums text-muted-foreground">{sub}</p>}
        </div>
    )
}

function Pastilla({ texto, v, clase, siempre }: { texto: string; v: number; clase: string; siempre?: boolean }) {
    if (!v && !siempre) return null
    return <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-black/5 animate-in fade-in-0 zoom-in-90', clase)}>{texto}: {entero(v)}</span>
}
