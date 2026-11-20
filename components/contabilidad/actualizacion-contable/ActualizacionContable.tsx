'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
    AlertTriangle, CalendarDays, CheckCircle2, CircleDashed, Copy, FileDown, GitCompare, Landmark, Loader2,
    PlayCircle, Search, Wrench, ShieldAlert, ShoppingCart, Trash2, Users, Wallet, BookOpen, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AvisoAmbar, Combo, claseInput, textoError, useSacudir } from '@/components/contabilidad/datos-generales/comunes'
import {
    ActualizacionContableService, BloqueClave, EstadoDiferencia, FilaAlcance, FilaDetalle, FilaResumen, ResultadoBloque,
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

const ESTADOS: Record<EstadoDiferencia, { texto: string; plural: string; chip: string; ayuda: string }> = {
    DUPLICADO: { texto: 'Duplicado', plural: 'Duplicados', chip: 'bg-rose-100 text-rose-800 ring-rose-600/20 dark:bg-rose-950/60 dark:text-rose-200', ayuda: 'El movimiento está más veces de lo que corresponde.' },
    FALTA: { texto: 'Falta', plural: 'Faltan', chip: 'bg-amber-100 text-amber-900 ring-amber-600/25 dark:bg-amber-950/60 dark:text-amber-200', ayuda: 'El documento existe pero no tiene su movimiento.' },
    SOBRA: { texto: 'Sobra', plural: 'Sin documento', chip: 'bg-violet-100 text-violet-800 ring-violet-600/20 dark:bg-violet-950/60 dark:text-violet-200', ayuda: 'Hay un movimiento cuyo documento ya no existe.' },
    IMPORTE_DISTINTO: { texto: 'Importe distinto', plural: 'Otro monto', chip: 'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-950/60 dark:text-sky-200', ayuda: 'El movimiento existe pero con otro monto.' },
}
const POR_PAGINA = 30

// ------------------------------------------------------------------ textos claros (sin nombres del Access)
/** Qué es cada consulta del Access, dicho en palabras. Se busca por el primer nombre de la consulta. */
const QUE_ES: [RegExp, string][] = [
    [/^BCOS_clientes/i, 'Cobros a clientes por bancos'],
    [/^BCOS_proveedores/i, 'Pagos a proveedores por bancos'],
    [/^BCOS_mdestino/i, 'Asiento de destino de bancos'],
    [/^BCOS_mprovision/i, 'Asiento de bancos (movimiento del banco)'],
    [/^CAJA_clientes/i, 'Cobros a clientes por caja'],
    [/^CAJA_proveedores/i, 'Pagos a proveedores por caja'],
    [/^CAJA_mdestino/i, 'Asiento de destino de caja'],
    [/^CAJA_megresos/i, 'Asiento de salida de caja (egreso)'],
    [/^CAJA_mingresos/i, 'Asiento de entrada de caja (ingreso)'],
    [/^DIAR_clientes_a/i, 'Aplicación a cliente en el diario (NC, canje)'],
    [/^DIAR_clientes_p/i, 'Cargo a cliente en el diario'],
    [/^DIAR_proveedores_a/i, 'Aplicación a proveedor en el diario (NC, canje de letras)'],
    [/^DIAR_proveedores_p/i, 'Cargo a proveedor en el diario (letras)'],
    [/^DIAR_mprovision/i, 'Asiento del libro diario'],
    [/^CLIE_msaldoinicial/i, 'Asiento de saldo inicial de clientes'],
    [/^CLIE_mventas/i, 'Asiento de venta'],
    [/^CLIE_provision_doc/i, 'Venta (deuda del cliente)'],
    [/^CLIE_regventas/i, 'Venta en el Registro de Ventas'],
    [/^CLIE_saldoinicial/i, 'Saldo inicial del cliente (canje de letras)'],
    [/^CLIE_ventas_inv/i, 'Salida de mercadería por venta'],
    [/^CLIE_pllacob/i, 'Cobranza de planilla (pago del cliente)'],
    [/^CLIE_mpllacob/i, 'Asiento de cobranza de planilla'],
    [/^PROV_compras_ing/i, 'Ingreso de mercadería por compra'],
    [/^PROV_mcompras_igv/i, 'Asiento del IGV de la compra'],
    [/^PROV_mcompras_total/i, 'Asiento del total de la compra (deuda con el proveedor)'],
    [/^PROV_mcompras_vv/i, 'Asiento del valor de la compra (gasto o mercadería)'],
    [/^PROV_mcompras_d/i, 'Asiento de destino de la compra'],
    [/^PROV_mpagos/i, 'Asiento del pago de la compra'],
    [/^PROV_saldoinicial/i, 'Saldo inicial del proveedor (letras)'],
    [/^PROV_msaldoinicial/i, 'Asiento de saldo inicial de proveedores'],
    [/^PROV_provision_doc/i, 'Compra (deuda con el proveedor)'],
    [/^PROV_pagos/i, 'Pago de la compra al proveedor'],
    [/^PROV_regcompras/i, 'Compra en el Registro de Compras'],
]
const queEs = (consulta: string) => QUE_ES.find(([re]) => re.test(consulta.trim()))?.[1] ?? consulta
const DONDE: Record<string, string> = {
    'kardex clientes': 'Cuenta corriente de clientes (kardex de clientes)',
    'kardex proveedores': 'Cuenta corriente de proveedores (kardex de proveedores)',
    'mayor auxiliar': 'Libro mayor (mayor auxiliar)',
    'mkardexinventarios': 'Kardex de inventarios',
    'registro de compras': 'Registro de Compras',
    'registro de ventas': 'Registro de Ventas',
}
const donde = (tabla: string) => DONDE[tabla.trim().toLowerCase()] ?? tabla
const TIPO_DOC: Record<string, string> = { '00': 'Documento', '01': 'Factura', '02': 'Recibo por honorarios', '03': 'Boleta', '07': 'Nota de crédito', '08': 'Nota de débito', '12': 'Ticket', '14': 'Recibo de servicio', '50': 'DUA', '91': 'Comprobante del exterior' }
/** "01-F002-82512" → "Factura F002-82512". */
const documentoClaro = (d: string | null) => {
    if (!d) return null
    const [tipo, ...resto] = d.split('-')
    return TIPO_DOC[tipo] ? `${TIPO_DOC[tipo]} ${resto.join('-')}` : d
}
const veces = (n: number) => n === 1 ? '1 vez' : `${entero(n)} veces`


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
        setAnio(nuevo); setAlcance(null); setPagina(1); setSel(new Set())
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
    // Un "caso" = un mismo documento/voucher con el mismo problema (junta, por ejemplo, el cargo y el abono
    // del mismo pago en el mayor y su fila en la cuenta corriente).
    const casosTodos = useMemo(() => agruparCasos(res?.detalle ?? []), [res])
    const detalle = useMemo(() => {
        const t = buscar.trim().toLowerCase()
        return casosTodos.filter(c =>
            (filtro === 'todos' || c.estado === filtro) &&
            (!t || c.items.some(f => `${f.consulta} ${f.tabla_destino} ${f.cod_persona ?? ''} ${f.nombre_persona ?? ''} ${f.documento ?? ''} ${documentoClaro(f.documento) ?? ''} ${f.cuenta ?? ''} ${f.voucher ?? ''} ${f.ids_reales ?? ''} ${dmy(f.fecha)}`.toLowerCase().includes(t))))
    }, [casosTodos, filtro, buscar])
    const paginas = Math.max(1, Math.ceil(detalle.length / POR_PAGINA))
    const visibles = detalle.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
    const cuenta = (e: 'todos' | EstadoDiferencia) => casosTodos.filter(c => e === 'todos' || c.estado === e).length
    const [verTecnico, setVerTecnico] = useState(false)
    const [sel, setSel] = useState<Set<string>>(new Set())
    const [arreglo, setArreglo] = useState<EstadoArreglo | null>(null)
    const duplicadosVisibles = detalle.filter(c => c.estado === 'DUPLICADO')
    const seleccionados = casosTodos.filter(c => sel.has(c.clave) && c.estado === 'DUPLICADO')
    const copiasSel = seleccionados.reduce((s, c) => s + copiasDe(c).length, 0)
    const todosSel = duplicadosVisibles.length > 0 && duplicadosVisibles.every(c => sel.has(c.clave))
    const alternar = (c: Caso) => setSel(p => { const n = new Set(p); n.has(c.clave) ? n.delete(c.clave) : n.add(c.clave); return n })
    const alternarTodos = () => setSel(p => { const n = new Set(p); if (todosSel) duplicadosVisibles.forEach(c => n.delete(c.clave)); else duplicadosVisibles.forEach(c => n.add(c.clave)); return n })

    /** Arreglar: prepara (el backend vuelve a revisar) y ejecuta lote por lote: primero backup, luego borra. */
    const arreglar = async () => {
        const seleccion = seleccionados.flatMap(copiasDe)
        setArreglo({ paso: 'preparando', hechos: 0, lotes: 0, respaldadas: 0, eliminadas: 0, total: seleccion.length, porTabla: [] })
        try {
            const p = await ActualizacionContableService.repararPreparar(Number(anio), activo, seleccion)
            setArreglo(a => ({ ...a!, paso: 'ejecutando', lotes: p.lotes, total: p.total, porTabla: p.porTabla, rechazadas: p.rechazadas }))
            let respaldadas = 0, eliminadas = 0, loteBackup = ''
            for (let i = 0; i < p.lotes; i++) {
                const r = await ActualizacionContableService.repararEjecutar(p.token, i)
                respaldadas += r.respaldadas; eliminadas += r.eliminadas; loteBackup = r.loteBackup
                setArreglo(a => ({ ...a!, hechos: i + 1, respaldadas, eliminadas, tablaActual: r.tabla, loteBackup }))
            }
            setArreglo(a => ({ ...a!, paso: 'listo' }))
            setSel(new Set())
            revisar([activo])
        } catch (e) {
            const msg = await textoError(e, 'No se pudo arreglar.')
            setArreglo(a => ({ ...(a ?? { hechos: 0, lotes: 0, respaldadas: 0, eliminadas: 0, total: 0, porTabla: [] }), paso: 'error', error: msg }))
        }
    }

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
                        <p className="mt-0.5 text-sm text-muted-foreground">Compara lo que grabaría el Access con lo que hay en kardex, mayor y registros. <b>Revisar no borra ni graba nada.</b> Solo el botón <b>Arreglar</b> quita copias duplicadas, y antes las guarda en su tabla <b>backup_</b>.</p>
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
                        <button key={b.clave} type="button" onClick={() => { setActivo(b.clave); setPagina(1); setSel(new Set()) }}
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
                        {/* Lo que pasó en este bloque, en una frase */}
                        <Titular casos={casosTodos} bloque={BLOQUES.find(b => b.clave === activo)?.nombre ?? ''} anio={anio} />

                        <button type="button" onClick={() => setVerTecnico(v => !v)} className="mt-3 text-xs font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300">
                            {verTecnico ? 'Ocultar el resumen técnico' : 'Ver el resumen técnico (para la contadora)'}
                        </button>
                        {verTecnico && (<>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {res.resumen.map((f, i) => {
                                const mal = f.duplicados + f.faltantes + f.sobrantes + f.importe_distinto > 0
                                return (
                                    <div key={`${activo}-${i}`} style={{ animationDelay: `${Math.min(i, 12) * 45}ms`, animationFillMode: 'both' }}
                                         className={cn('rounded-xl border bg-card p-3 shadow-md shadow-slate-900/10 transition duration-200 animate-in fade-in-0 slide-in-from-bottom-2 hover:-translate-y-0.5 hover:shadow-lg dark:shadow-black/40',
                                             mal ? 'border-amber-300 dark:border-amber-800' : 'border-emerald-200 dark:border-emerald-900')}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="break-words font-semibold leading-tight">{queEs(f.consulta)}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">{donde(f.tabla_destino)}</p>
                                            </div>
                                            {mal ? <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" /> : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                                        </div>
                                        <p className={cn('mt-2 text-sm', mal ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-700 dark:text-emerald-300')}>{frase(f)}</p>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                            <Dato titulo="Según los documentos" valor={`${entero(f.esperado_filas)} mov.`} sub={soles(f.esperado_importe)} />
                                            <Dato titulo="En la contabilidad" valor={`${entero(f.real_filas)} mov.`} sub={soles(f.real_importe)} resaltar={f.real_filas !== f.esperado_filas} />
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
                        </>)}

                        {/* Detalle de diferencias */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {(['todos', 'DUPLICADO', 'FALTA', 'SOBRA', 'IMPORTE_DISTINTO'] as const).map(e => (
                                <button key={e} type="button" onClick={() => { setFiltro(e); setPagina(1) }}
                                        className={cn('rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition', filtro === e ? 'bg-blue-600 text-white ring-blue-600' : e === 'todos' ? 'bg-muted ring-border' : ESTADOS[e].chip)}
                                        title={e === 'todos' ? undefined : ESTADOS[e].ayuda}>
                                    {e === 'todos' ? 'Todos los casos' : ESTADOS[e].plural} ({entero(cuenta(e))})
                                </button>
                            ))}
                            <div className="relative ml-auto w-full sm:w-80">
                                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input value={buscar} onChange={e => { setBuscar(e.target.value); setPagina(1) }} placeholder="Cliente, proveedor, documento, cuenta, voucher o Id" className={cn(claseInput, 'pl-9')} />
                            </div>
                        </div>

                        {duplicadosVisibles.length > 0 && (
                            <div className="sticky top-2 z-10 mt-3 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 px-3 py-2 shadow-lg backdrop-blur animate-in fade-in-0 slide-in-from-top-2">
                                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                                    <input type="checkbox" className="h-4 w-4 accent-rose-600" checked={todosSel} onChange={alternarTodos} />
                                    Seleccionar todos los duplicados ({entero(duplicadosVisibles.length)})
                                </label>
                                <span className="text-sm text-muted-foreground">{entero(seleccionados.length)} caso{seleccionados.length === 1 ? '' : 's'} · {entero(copiasSel)} copia{copiasSel === 1 ? '' : 's'} para quitar</span>
                                <Button size="sm" disabled={!copiasSel || revisando || !!arreglo && arreglo.paso !== 'listo' && arreglo.paso !== 'error'} onClick={() => setArreglo({ paso: 'confirmar', hechos: 0, lotes: 0, respaldadas: 0, eliminadas: 0, total: copiasSel, porTabla: resumenPorTabla(seleccionados) })}
                                        className="ml-auto bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25 hover:from-rose-700 hover:to-red-700">
                                    <Wrench className="mr-2 h-4 w-4" /> Arreglar ({entero(copiasSel)})
                                </Button>
                            </div>
                        )}

                        {detalle.length === 0 ? (
                            <p className="flex items-center justify-center gap-2 py-6 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> {res.detalle.length ? 'No hay diferencias con ese filtro.' : 'Todo cuadra: no hay diferencias en este bloque.'}</p>
                        ) : (
                            <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-2">
                                {visibles.map((c, i) => (
                                    <CardCaso key={`${activo}-${pagina}-${filtro}-${i}`} caso={c} seleccionado={sel.has(c.clave)} onAlternar={() => alternar(c)} n={(pagina - 1) * POR_PAGINA + i + 1} total={detalle.length} retraso={Math.min(i, 15) * 35} />
                                ))}
                            </div>
                        )}
                        {paginas > 1 && (
                            <div className="mt-2 flex items-center justify-end gap-2 text-sm">
                                <span className="text-muted-foreground">{entero(detalle.length)} casos · página {pagina} de {paginas}</span>
                                <Button size="sm" variant="outline" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</Button>
                                <Button size="sm" variant="outline" disabled={pagina >= paginas} onClick={() => setPagina(p => p + 1)}>Siguiente</Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {arreglo && <DialogoArreglo a={arreglo} onConfirmar={arreglar} onCerrar={() => setArreglo(null)} />}

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

/** Resumen de una consulta en una frase. */
function frase(f: FilaResumen) {
    const partes: string[] = []
    if (f.duplicados) partes.push(`${entero(f.duplicados)} movimiento${f.duplicados === 1 ? ' está' : 's están'} repetido${f.duplicados === 1 ? '' : 's'}`)
    if (f.faltantes) partes.push(`falta${f.faltantes === 1 ? '' : 'n'} ${entero(f.faltantes)}`)
    if (f.sobrantes) partes.push(`${entero(f.sobrantes)} sin documento`)
    if (f.importe_distinto) partes.push(`${entero(f.importe_distinto)} con otro monto`)
    if (!partes.length) return f.esperado_filas || f.real_filas ? 'Todo cuadra: cada documento tiene su movimiento una sola vez.' : 'No hay movimientos de este tipo en el año.'
    const t = partes.join(', ')
    return t.charAt(0).toUpperCase() + t.slice(1) + '.'
}

// ------------------------------------------------------------------ casos (lo que ve el usuario)
interface Caso {
    clave: string
    estado: EstadoDiferencia
    persona: string | null
    cod: string | null
    documento: string | null
    fecha: string | null
    voucher: string | null
    importe: number
    items: FilaDetalle[]
}

// ------------------------------------------------------------------ Arreglar
type EstadoArreglo = {
    paso: 'confirmar' | 'preparando' | 'ejecutando' | 'listo' | 'error'
    hechos: number; lotes: number; respaldadas: number; eliminadas: number; total: number
    porTabla: { tabla: string; filas: number; backup?: string }[]
    rechazadas?: number; tablaActual?: string; loteBackup?: string; error?: string
}

/** Las copias de más de un caso duplicado: { tabla, id } de cada fila que sobra. */
function copiasDe(c: Caso): { tabla: string; id: number }[] {
    return c.items.filter(f => f.estado === 'DUPLICADO' && f.ids_sobrantes)
        .flatMap(f => String(f.ids_sobrantes).split(',').map(x => ({ tabla: f.tabla_destino, id: Number(x.trim()) })).filter(x => x.id > 0))
}
function resumenPorTabla(casos: Caso[]) {
    const m = new Map<string, number>()
    casos.flatMap(copiasDe).forEach(x => m.set(x.tabla, (m.get(x.tabla) ?? 0) + 1))
    return [...m].map(([tabla, filas]) => ({ tabla, filas, backup: `backup_${tabla}` }))
}

function DialogoArreglo({ a, onConfirmar, onCerrar }: { a: EstadoArreglo; onConfirmar: () => void; onCerrar: () => void }) {
    const pct = a.paso === 'listo' ? 100 : a.lotes ? Math.round((a.hechos / a.lotes) * 100) : 0
    const trabajando = a.paso === 'preparando' || a.paso === 'ejecutando'
    const pasos: [string, boolean, boolean][] = [
        ['Verificando que sigan duplicados', a.paso !== 'confirmar', a.paso === 'preparando'],
        ['Copiando al backup (con fecha y usuario)', a.paso === 'ejecutando' || a.paso === 'listo', a.paso === 'ejecutando'],
        ['Comprobando que el backup esté completo', a.paso === 'ejecutando' || a.paso === 'listo', a.paso === 'ejecutando'],
        ['Quitando las copias repetidas', a.paso === 'ejecutando' || a.paso === 'listo', a.paso === 'ejecutando'],
        ['Listo', a.paso === 'listo', false],
    ]
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
            <div className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4">
                <h3 className="flex items-center gap-2 text-lg font-bold"><Wrench className="h-5 w-5 text-rose-600" /> Arreglar duplicados</h3>

                {a.paso === 'confirmar' && (
                    <>
                        <p className="mt-3 text-sm">Se van a quitar <b>{entero(a.total)}</b> copia{a.total === 1 ? '' : 's'} repetida{a.total === 1 ? '' : 's'}. La fila original de cada movimiento <b>se queda</b>.</p>
                        <div className="mt-3 space-y-2">
                            {a.porTabla.map(t => (
                                <div key={t.tabla} className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                                    <b>{entero(t.filas)}</b> en {donde(t.tabla)}
                                    <p className="text-xs text-muted-foreground">Primero se copian a la tabla <b>{t.backup}</b> con la fecha y tu usuario; recién después se borran.</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Antes de borrar, el sistema vuelve a comprobar que cada fila siga siendo una copia. Si algo no cuadra, no se borra nada de ese grupo.</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
                            <Button onClick={onConfirmar} className="bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-700 hover:to-red-700">Sí, arreglar</Button>
                        </div>
                    </>
                )}

                {a.paso !== 'confirmar' && (
                    <>
                        {/* Barra animada */}
                        <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-emerald-500 transition-all duration-700 ease-out', trabajando && 'animate-pulse')}
                                 style={{ width: `${a.paso === 'preparando' ? 8 : Math.max(pct, 8)}%` }} />
                        </div>
                        <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">{a.paso === 'preparando' ? 'Preparando…' : `${pct}% · ${entero(a.eliminadas)} de ${entero(a.total)} copias`}</p>
                        <ul className="mt-3 space-y-1.5 text-sm">
                            {pasos.map(([t, hecho, activo]) => (
                                <li key={t} className={cn('flex items-center gap-2 transition', hecho ? 'text-foreground' : 'text-muted-foreground')}>
                                    {activo ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : hecho ? <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-in zoom-in-50" /> : <CircleDashed className="h-4 w-4" />}
                                    {t}{activo && a.tablaActual ? ` (${donde(a.tablaActual)})` : ''}
                                </li>
                            ))}
                        </ul>
                        {a.paso === 'listo' && (
                            <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 animate-in fade-in-0 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                                ✅ Se respaldaron <b>{entero(a.respaldadas)}</b> y se quitaron <b>{entero(a.eliminadas)}</b> copias.
                                {a.loteBackup && <p className="mt-1 text-xs">Backup: {a.porTabla.map(t => t.backup ?? `backup_${t.tabla}`).join(', ')} · lote <b>{a.loteBackup}</b></p>}
                                {!!a.rechazadas && <p className="mt-1 text-xs">{entero(a.rechazadas)} ya no estaban duplicadas y no se tocaron.</p>}
                            </div>
                        )}
                        {a.paso === 'error' && <AvisoAmbar className="mt-3" mensaje={<>{a.error}{a.eliminadas ? <> · Ya se habían arreglado {entero(a.eliminadas)} copias (con backup).</> : ' · No se borró nada.'}</>} />}
                        <div className="mt-4 flex justify-end">
                            <Button variant="outline" disabled={trabajando} onClick={onCerrar}>{trabajando ? 'Trabajando…' : 'Cerrar'}</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

/** Junta en un caso las filas del mismo documento/voucher con el mismo problema. */
function agruparCasos(detalle: FilaDetalle[]): Caso[] {
    const m = new Map<string, Caso>()
    for (const f of detalle) {
        const voucher = f.voucher != null && f.voucher !== '' ? String(f.voucher) : null
        const k = [f.estado, f.cod_persona ?? '', f.documento ?? '', voucher ?? '', String(f.fecha ?? '').slice(0, 10)].join('|')
        let c = m.get(k)
        if (!c) { c = { clave: k, estado: f.estado, persona: f.nombre_persona, cod: f.cod_persona, documento: documentoClaro(f.documento), fecha: f.fecha, voucher, importe: 0, items: [] }; m.set(k, c) }
        c.items.push(f)
        // Importe del movimiento: el de un solo registro correcto (en el mayor, cada lado lleva el mismo monto).
        const uno = f.esperado_filas > 0 ? f.esperado_importe / f.esperado_filas : f.real_filas > 0 ? f.real_importe / f.real_filas : 0
        c.importe = Math.max(c.importe, Math.abs(uno))
    }
    return [...m.values()]
}

const TITULO: Record<EstadoDiferencia, string> = {
    DUPLICADO: 'SE DUPLICÓ',
    FALTA: 'FALTA REGISTRAR',
    SOBRA: 'REGISTRO SIN DOCUMENTO',
    IMPORTE_DISTINTO: 'MONTO EQUIVOCADO',
}

/** Frase grande de lo que pasó en el bloque. */
function Titular({ casos, bloque, anio }: { casos: Caso[]; bloque: string; anio: string }) {
    const n = (e: EstadoDiferencia) => casos.filter(c => c.estado === e).length
    const dup = n('DUPLICADO'), falta = n('FALTA'), sobra = n('SOBRA'), monto = n('IMPORTE_DISTINTO')
    if (!casos.length) return (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900 shadow-md animate-in fade-in-0 slide-in-from-bottom-2 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="h-8 w-8 shrink-0" />
            <p className="text-base font-semibold">En {bloque} {anio} todo está bien: cada movimiento está registrado una sola vez y no falta ninguno.</p>
        </div>
    )
    return (
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-md animate-in fade-in-0 slide-in-from-bottom-2 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="flex items-center gap-2 text-base font-bold"><AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" /> Esto es lo que se encontró en {bloque} {anio}:</p>
            <ul className="mt-2 space-y-1 pl-8 text-sm sm:text-base">
                {dup > 0 && <li>🔴 <b>{entero(dup)}</b> movimiento{dup === 1 ? ' está registrado' : 's están registrados'} <b>dos veces</b> (o más). Se cuentan doble en la contabilidad.</li>}
                {falta > 0 && <li>🟠 <b>{entero(falta)}</b> documento{falta === 1 ? ' no tiene' : 's no tienen'} su registro en la contabilidad.</li>}
                {sobra > 0 && <li>🟣 <b>{entero(sobra)}</b> registro{sobra === 1 ? '' : 's'} en la contabilidad sin documento que lo respalde.</li>}
                {monto > 0 && <li>🔵 <b>{entero(monto)}</b> registro{monto === 1 ? '' : 's'} con un monto distinto al del documento.</li>}
            </ul>
            <p className="mt-2 pl-8 text-xs opacity-80">Abajo está la lista, uno por uno. Esta pantalla no cambia nada: solo muestra.</p>
        </div>
    )
}

/** Una card = un caso, explicado para cualquiera. */
function CardCaso({ caso: c, n, total, retraso, seleccionado, onAlternar }: { caso: Caso; n: number; total: number; retraso: number; seleccionado: boolean; onAlternar: () => void }) {
    const tipo = queEs(c.items[0].consulta).toLowerCase()
    const quien = c.persona ? <b>{c.persona}</b> : c.cod ? <b>{c.cod}</b> : null
    const color = { DUPLICADO: 'border-rose-300 dark:border-rose-800', FALTA: 'border-amber-300 dark:border-amber-800', SOBRA: 'border-violet-300 dark:border-violet-800', IMPORTE_DISTINTO: 'border-sky-300 dark:border-sky-800' }[c.estado]
    const cabecera = { DUPLICADO: 'bg-rose-600', FALTA: 'bg-amber-500', SOBRA: 'bg-violet-600', IMPORTE_DISTINTO: 'bg-sky-600' }[c.estado]
    return (
        <div style={{ animationDelay: `${retraso}ms`, animationFillMode: 'both' }}
             className={cn('overflow-hidden rounded-2xl border-2 bg-card shadow-lg shadow-slate-900/10 transition duration-200 animate-in fade-in-0 zoom-in-95 hover:-translate-y-1 hover:shadow-xl dark:shadow-black/40', color, seleccionado && 'ring-4 ring-rose-400/60')}>
            <div className={cn('flex items-center justify-between gap-2 px-4 py-2 text-white', cabecera)}>
                <span className="flex items-center gap-2 text-sm font-extrabold tracking-wide">
                    {c.estado === 'DUPLICADO' && <input type="checkbox" aria-label="Seleccionar para arreglar" className="h-4 w-4 cursor-pointer accent-white" checked={seleccionado} onChange={onAlternar} />}
                    {TITULO[c.estado]}
                </span>
                <span className="text-xs opacity-90">Caso {entero(n)} de {entero(total)}</span>
            </div>
            <div className="p-4">
                {/* La frase */}
                <p className="text-[15px] leading-relaxed">
                    {c.estado === 'DUPLICADO' && <>El movimiento de <b>{soles(c.importe)}</b>{quien && <> de {quien}</>}{c.documento && <> ({c.documento})</>}{c.fecha && <>, del <b>{dmy(c.fecha)}</b></>}{c.voucher && <>, voucher <b>{c.voucher}</b></>}, está registrado <b className="text-rose-700 dark:text-rose-300">más de una vez</b>. Debe estar <b>una sola vez</b>.</>}
                    {c.estado === 'FALTA' && <>El documento{c.documento && <> <b>{c.documento}</b></>}{quien && <> de {quien}</>}{c.fecha && <>, del <b>{dmy(c.fecha)}</b></>}, por <b>{soles(c.importe)}</b>, <b className="text-amber-700 dark:text-amber-300">no está registrado</b> en la contabilidad.</>}
                    {c.estado === 'SOBRA' && <>Hay un registro de <b>{soles(c.importe)}</b>{quien && <> de {quien}</>}{c.documento && <> ({c.documento})</>} que <b className="text-violet-700 dark:text-violet-300">no tiene ningún documento</b> que lo respalde.</>}
                    {c.estado === 'IMPORTE_DISTINTO' && <>El documento{c.documento && <> <b>{c.documento}</b></>}{quien && <> de {quien}</>} está registrado con <b className="text-sky-700 dark:text-sky-300">otro monto</b>.</>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Tipo de movimiento: {tipo}{c.cod && c.persona ? ` · Código ${c.cod}` : ''}</p>

                {/* Dónde y cómo está */}
                <div className="mt-3 space-y-3">
                    {c.items.map((f, j) => <Registros key={j} f={f} />)}
                </div>
            </div>
        </div>
    )
}

/** Muestra los registros de un lugar como cajitas: ✅ original · ❌ copia que sobra · ⛔ no existe. */
function Registros({ f }: { f: FilaDetalle }) {
    const ids = (f.ids_reales ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const sobran = new Set((f.ids_sobrantes ?? '').split(',').map(s => s.trim()).filter(Boolean))
    const uno = f.esperado_filas > 0 ? f.esperado_importe / f.esperado_filas : f.real_filas > 0 ? f.real_importe / f.real_filas : 0
    const faltan = Math.max(0, f.esperado_filas - f.real_filas)
    return (
        <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-sm font-semibold">{donde(f.tabla_destino)}</p>
            <p className="text-xs text-muted-foreground">{queEs(f.consulta)}{f.cuenta ? ` · cuenta ${f.cuenta}` : ''}</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {ids.map((id, k) => {
                    const copia = f.estado === 'DUPLICADO' ? sobran.has(id) : f.estado === 'SOBRA'
                    return (
                        <div key={id} style={{ animationDelay: `${k * 90}ms`, animationFillMode: 'both' }}
                             className={cn('min-w-[150px] flex-1 rounded-lg border-2 px-3 py-2 text-sm shadow-sm animate-in fade-in-0 slide-in-from-left-2',
                                 copia ? 'border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40' : 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40')}>
                            <p className={cn('font-bold', copia ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300')}>
                                {copia ? (f.estado === 'SOBRA' ? '⚠️ Sin documento' : '❌ Copia repetida') : '✅ Registro correcto'}
                            </p>
                            <p className="tabular-nums">{soles(uno)}</p>
                            <p className="text-xs text-muted-foreground">N.º interno {id}{copia && f.estado === 'DUPLICADO' ? ' · sobra' : ''}</p>
                        </div>
                    )
                })}
                {Array.from({ length: faltan }).map((_, k) => (
                    <div key={`f${k}`} className="min-w-[150px] flex-1 rounded-lg border-2 border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-sm animate-in fade-in-0 dark:border-amber-700 dark:bg-amber-950/40">
                        <p className="font-bold text-amber-700 dark:text-amber-300">⛔ No existe</p>
                        <p className="tabular-nums">{soles(uno)}</p>
                        <p className="text-xs text-muted-foreground">Debería estar registrado</p>
                    </div>
                ))}
                {f.estado === 'IMPORTE_DISTINTO' && (
                    <p className="text-sm">Debería ser <b>{soles(f.esperado_importe)}</b> y está como <b>{soles(f.real_importe)}</b>.</p>
                )}
            </div>
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
