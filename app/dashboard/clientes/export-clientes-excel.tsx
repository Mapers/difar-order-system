'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import ExcelJS from 'exceljs'
import apiClient from '@/app/api/client'
import { IClient } from '@/app/types/clients/client-interface'
import { formatSafeDate } from '@/app/utils/date'
import {
    GRUPOS_EXPORTACION_CLIENTES, TITULO_SIN_GRUPO,
} from './gruposExportacion'

const HEADER_ARGB = 'FF163161'
const GRUPO_ARGB  = 'FF1E4A8A'
const ZONA_ARGB   = 'FFDCE6F1'
const SIN_GRUPO_ARGB = 'FF9C5700'

const COLUMNS = [
    { header: 'CÓDIGO',              key: 'codigoInterno',           width: 13, numFmt: '@' },
    { header: 'RAZÓN SOCIAL',        key: 'razonSocial',             width: 38, numFmt: '@' },
    { header: 'NOMBRE COMERCIAL',    key: 'nombreComercial',         width: 30, numFmt: '@' },
    { header: 'RUC / DNI',           key: 'numeroDocumento',         width: 13, numFmt: '@' },
    { header: 'TIPO DOC.',           key: 'tipoDocumento',           width:  9, numFmt: '@' },
    { header: 'DIRECCIÓN',           key: 'direccion',               width: 40, numFmt: '@' },
    { header: 'REFERENCIA',          key: 'referenciaDireccion',     width: 30, numFmt: '@' },
    { header: 'TELÉFONO',            key: 'telefono',                width: 16, numFmt: '@' },
    { header: 'CORREO',              key: 'correoElectronico',       width: 28, numFmt: '@' },
    { header: 'PROVINCIA',           key: 'provincia',               width: 20, numFmt: '@' },
    { header: 'DISTRITO',            key: 'distrito',                width: 20, numFmt: '@' },
    { header: 'ZONA',                key: 'zona',                    width: 26, numFmt: '@' },
    { header: 'FECHA INICIO',        key: 'fechaInicio',             width: 13, numFmt: '@' },
    { header: 'RELACIÓN',            key: 'relacion',                width: 16, numFmt: '@' },
    { header: 'CTA. CONTABLE',       key: 'ctaContab',               width: 14, numFmt: '@' },
    { header: 'CÓD. VENDEDOR',       key: 'codigoVendedor',          width: 13, numFmt: '@' },
    { header: 'VENDEDOR',            key: 'nombreVendedor',          width: 26, numFmt: '@' },
    { header: 'LÍNEA CRÉDITO',       key: 'lineaCredito',            width: 14, numFmt: '#,##0.00' },
    { header: 'TIPO CLIENTE',        key: 'tipoCliente',             width: 13, numFmt: '@' },
    { header: 'SITUACIÓN',           key: 'situacion',               width: 14, numFmt: '@' },
    { header: 'NRO. REGISTRO',       key: 'nroRegistro',             width: 14, numFmt: '@' },
    { header: 'RESULTADO',           key: 'resultado',               width: 14, numFmt: '@' },
    { header: 'ESTADO SUNAT',        key: 'estadoSunat',             width: 14, numFmt: '@' },
    { header: 'REP. LEGAL',          key: 'nomRepLegal',             width: 26, numFmt: '@' },
    { header: 'AUT. SANITARIA',      key: 'nroResAutSani',           width: 16, numFmt: '@' },
    { header: 'SIT. FUNCIONAMIENTO', key: 'situacionFuncionamiento', width: 18, numFmt: '@' },
    { header: 'CERTIFICACIONES',     key: 'certificaciones',         width: 26, numFmt: '@' },
    { header: 'CATEGORÍA',           key: 'categoria',               width: 16, numFmt: '@' },
    { header: 'ITEM LISTA',          key: 'itemLista',               width: 12, numFmt: '@' },
    { header: 'OTROS',               key: 'otros',                   width: 20, numFmt: '@' },
    { header: 'FECHA REGISTRO',      key: 'fechaRegistros',          width: 14, numFmt: '@' },
] as const

async function cargarCatalogo(ruta: string): Promise<Map<string, string>> {
    const mapa = new Map<string, string>()

    try {
        const res = await apiClient.get(ruta)
        const filas = res.data?.data ?? []

        for (const fila of filas) {
            if (fila?.id == null) continue
            mapa.set(String(fila.id), String(fila.nombre ?? '').trim())
        }
    } catch (error) {
        console.warn(`No se pudo cargar el catálogo ${ruta}:`, error)
    }

    return mapa
}

function resolverNombre(mapa: Map<string, string>, id: unknown): string {
    if (id == null || id === '') return ''
    const nombre = mapa.get(String(id))
    return nombre && nombre !== '' ? nombre : String(id)
}

interface BloqueZona {
    idZona: string
    nombreZona: string
    clientes: IClient[]
}

interface BloqueGrupo {
    titulo: string
    zonas: BloqueZona[]
}

export function agruparClientes(clientes: IClient[]): BloqueGrupo[] {
    const porZona = new Map<string, IClient[]>()

    for (const cliente of clientes) {
        const id = String(cliente.idZona ?? '').trim()
        const lista = porZona.get(id) ?? []
        lista.push(cliente)
        porZona.set(id, lista)
    }

    const asignadas = new Set<string>()
    const grupos: BloqueGrupo[] = []

    for (const grupo of GRUPOS_EXPORTACION_CLIENTES) {
        const zonas: BloqueZona[] = []

        for (const idZona of grupo.zonas) {
            asignadas.add(idZona)
            const clientesZona = porZona.get(idZona) ?? []
            if (clientesZona.length === 0) continue

            zonas.push({
                idZona,
                nombreZona: clientesZona[0].zona || `(zona ${idZona} sin nombre)`,
                clientes: clientesZona,
            })
        }

        if (zonas.length > 0) grupos.push({ titulo: grupo.titulo, zonas })
    }

    const sobrantes: BloqueZona[] = []
    for (const [idZona, clientesZona] of porZona) {
        if (asignadas.has(idZona)) continue

        sobrantes.push({
            idZona,
            nombreZona: idZona === ''
                ? '(cliente sin zona asignada)'
                : (clientesZona[0].zona || `(zona ${idZona} sin nombre)`),
            clientes: clientesZona,
        })
    }

    sobrantes.sort((a, b) => a.idZona.localeCompare(b.idZona))
    if (sobrantes.length > 0) grupos.push({ titulo: TITULO_SIN_GRUPO, zonas: sobrantes })

    return grupos
}

const ExportClientesExcelButton = ({ clientes }: { clientes: IClient[] }) => {
    const [loading, setLoading] = useState(false)

    const exportar = async () => {
        if (loading || clientes.length === 0) return
        setLoading(true)

        try {
            const [provincias, distritos] = await Promise.all([
                cargarCatalogo('/clientes/ciudad/provincias-ciudades'),
                cargarCatalogo('/clientes/ciudad/distritos'),
            ])

            const grupos = agruparClientes(clientes)

            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'DROGUERÍA DIFAR'

            const ws = workbook.addWorksheet('Clientes por zona', {
                views: [{ state: 'frozen', ySplit: 1 }],
            })

            ws.columns = COLUMNS.map(c => ({ key: c.key, width: c.width }))

            const cabecera = ws.addRow(COLUMNS.map(c => c.header))
            cabecera.eachCell(celda => {
                celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
                celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ARGB } }
                celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            })
            cabecera.height = 26

            const anchoTotal = COLUMNS.length

            for (const grupo of grupos) {
                const esSinGrupo = grupo.titulo === TITULO_SIN_GRUPO
                const totalGrupo = grupo.zonas.reduce((s, z) => s + z.clientes.length, 0)

                ws.addRow([])

                const filaGrupo = ws.addRow([`${grupo.titulo}  —  ${totalGrupo} cliente(s)`])
                ws.mergeCells(filaGrupo.number, 1, filaGrupo.number, anchoTotal)
                filaGrupo.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
                filaGrupo.getCell(1).fill = {
                    type: 'pattern', pattern: 'solid',
                    fgColor: { argb: esSinGrupo ? SIN_GRUPO_ARGB : GRUPO_ARGB },
                }
                filaGrupo.getCell(1).alignment = { vertical: 'middle', indent: 1 }
                filaGrupo.height = 22

                for (const zona of grupo.zonas) {
                    const filaZona = ws.addRow([
                        `${zona.nombreZona}   (IdZona ${zona.idZona || '—'})   ·   ${zona.clientes.length} cliente(s)`,
                    ])
                    ws.mergeCells(filaZona.number, 1, filaZona.number, anchoTotal)
                    filaZona.getCell(1).font = { bold: true, size: 10 }
                    filaZona.getCell(1).fill = {
                        type: 'pattern', pattern: 'solid', fgColor: { argb: ZONA_ARGB },
                    }
                    filaZona.getCell(1).alignment = { vertical: 'middle', indent: 2 }

                    for (const cliente of zona.clientes) {
                        const fila = ws.addRow({
                            codigoInterno:           cliente.codigoInterno ?? '',
                            razonSocial:             cliente.razonSocial ?? '',
                            nombreComercial:         cliente.nombreComercial ?? '',
                            numeroDocumento:         cliente.numeroDocumento ?? '',
                            tipoDocumento:           cliente.tipoDocumento ?? '',
                            direccion:               cliente.direccion ?? '',
                            referenciaDireccion:     cliente.referenciaDireccion ?? '',
                            telefono:                cliente.telefono ?? '',
                            correoElectronico:       cliente.correoElectronico ?? '',
                            provincia:               resolverNombre(provincias, cliente.provinciaId),
                            distrito:                resolverNombre(distritos, cliente.idDistrito),
                            zona:                    cliente.zona ?? '',
                            fechaInicio:             formatSafeDate(cliente.fechaInicio ?? '', ''),
                            relacion:                cliente.relacion ?? '',
                            ctaContab:               cliente.ctaContab ?? '',
                            codigoVendedor:          cliente.codigoVendedor ?? '',
                            nombreVendedor:          cliente.nombreVendedor ?? '',
                            lineaCredito:            Number(cliente.lineaCredito ?? 0),
                            tipoCliente:             cliente.tipoCliente ?? '',
                            situacion:               cliente.situacion ?? '',
                            nroRegistro:             cliente.nroRegistro ?? '',
                            resultado:               cliente.resultado ?? '',
                            estadoSunat:             cliente.estadoSunat ?? '',
                            nomRepLegal:             cliente.nomRepLegal ?? '',
                            nroResAutSani:           cliente.nroResAutSani ?? '',
                            situacionFuncionamiento: cliente.situacionFuncionamiento ?? '',
                            certificaciones:         cliente.certificaciones ?? '',
                            categoria:               cliente.categoria ?? '',
                            itemLista:               cliente.itemLista ?? '',
                            otros:                   cliente.otros ?? '',
                            fechaRegistros:          formatSafeDate(cliente.fechaRegistros ?? '', ''),
                        })

                        fila.eachCell((celda, col) => {
                            celda.font = { size: 9 }
                            celda.numFmt = COLUMNS[col - 1].numFmt
                            celda.alignment = { vertical: 'top' }
                        })
                    }
                }

                ws.addRow([])
            }

            ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: anchoTotal } }

            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = `clientes-por-zona-${new Date().toISOString().split('T')[0]}.xlsx`
            link.click()
            URL.revokeObjectURL(link.href)
        } catch (error) {
            console.error('Error al generar el Excel de clientes:', error)
            alert('Ocurrió un error al generar el Excel.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            disabled={loading || clientes.length === 0}
            onClick={exportar}
            className="flex items-center gap-2"
        >
            {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileSpreadsheet className="h-4 w-4" />}
            {loading ? 'Generando...' : 'Exportar Excel'}
        </Button>
    )
}

export default ExportClientesExcelButton
