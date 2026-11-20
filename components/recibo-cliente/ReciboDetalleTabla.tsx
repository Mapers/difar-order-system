'use client'

import { LineaRecibo, saldoDeLinea } from '@/app/types/recibo-cliente-types'

interface Props {
    lineas: LineaRecibo[]
    onChange: (lineas: LineaRecibo[]) => void
    buscador: React.ReactNode
    simbolo: string
    observacion: string
    onObservacionChange: (v: string) => void
}

const TOLERANCIA = 0.01

/**
 * Error de importe por fila (uid → mensaje). Mismas reglas que el servidor
 * (integ-back helpers/reciboReglas.js): mayor a cero y, si viene de la cuenta
 * del cliente, no más que su saldo.
 */
export function erroresDeLineas(lineas: LineaRecibo[]): Record<string, string> {
    const errores: Record<string, string> = {}
    for (const l of lineas) {
        const importe = Number(l.importe)
        if (!Number.isFinite(importe) || importe <= 0) {
            errores[l.uid] = 'El importe debe ser mayor a cero'
        } else if (l.saldo_documento != null && importe > Number(l.saldo_documento) + TOLERANCIA) {
            errores[l.uid] = `No puede ser mayor que el saldo (${Number(l.saldo_documento).toFixed(2)})`
        }
    }
    return errores
}

function lineaVacia(): LineaRecibo {
    return {
        uid: `libre-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        id_kardex_cliente: null,
        tipo_documento: '',
        abre_documento: '',
        serie: '',
        numero_doc: '',
        documento_completo: '',
        importe: '',
        /* Una linea libre no viene de un documento del kardex, asi que no hay
           un "cuanto debia" contra el que medir. null y no 0: se pinta "—". */
        saldo_documento: null,
        observaciones: '',
        simbolo_moneda: '',
    }
}

function fechaCorta(iso?: string | null) {
    const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
    return m ? `${m[3]}/${m[2]}/${m[1]}` : null
}

const TINTA = 'text-[#1b2f63]'
const BORDE = 'border-[1.2px] border-[#1b2f63]/70'
const CABECERA = `${BORDE} bg-[#efe5c8] px-1.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] ${TINTA}`

export function ReciboDetalleTabla({
    lineas,
    onChange,
    buscador,
    simbolo,
    observacion,
    onObservacionChange,
}: Props) {
    const total = lineas.reduce((s, l) => s + (parseFloat(l.importe) || 0), 0)

    const saldos = lineas.map(l => saldoDeLinea(l.saldo_documento, l.importe)).filter(x => x !== null) as number[]
    const totalSaldo = saldos.length === 0 ? null : saldos.reduce((s, n) => s + n, 0)
    const errores = erroresDeLineas(lineas)

    const actualizar = (uid: string, campo: keyof LineaRecibo, valor: string) => {
        onChange(lineas.map(l => (l.uid === uid ? { ...l, [campo]: valor } : l)))
    }

    const celda = `w-full bg-transparent border-0 outline-none px-1.5 py-2 text-[13px] ${TINTA} focus:bg-[#fbf6e8]`

    return (
        <div data-guia="documentos" className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                    <thead>
                        <tr>
                            <th className={`${CABECERA} w-[34%]`}>Documento</th>
                            <th className={`${CABECERA} w-[15%]`}>Saldo</th>
                            <th className={`${CABECERA} w-[17%]`}>Importe</th>
                            <th className={CABECERA}>Observaciones</th>
                            <th className={`${BORDE} w-9 bg-[#efe5c8]`} aria-label="Acciones" />
                        </tr>
                    </thead>

                    <tbody>
                        {lineas.length === 0 && (
                            <tr>
                                <td colSpan={5} className={`${BORDE} px-3 py-7 text-center text-[12.5px] italic text-[#8c7d58]`}>
                                    Sin documentos. Busca abajo los comprobantes que estás cobrando.
                                </td>
                            </tr>
                        )}

                        {lineas.map((l) => {
                            const delKardex = l.id_kardex_cliente != null
                            const err = errores[l.uid]
                            const vence = fechaCorta(l.fecha_vcto)

                            return (
                                <tr key={l.uid} className="align-top">
                                    <td className={`${BORDE} px-2 py-1.5`}>
                                        {delKardex ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`font-bold ${TINTA}`}>
                                                    {l.abre_documento || l.tipo_documento}{' '}
                                                    <span className="font-mono text-[12.5px]">{l.serie}-{l.numero_doc}</span>
                                                </span>
                                                {vence && <span className="text-[11px] text-[#7a6c4a]">Vence {vence}</span>}
                                                {l.en_recibos && (
                                                    <span className="mt-0.5 w-fit rounded-sm border border-[#c48a2c]/60 bg-[#f6e3b8] px-1.5 py-px text-[10.5px] font-semibold text-[#7a4d06]">
                                                        Ya en recibo N° {l.en_recibos.ultimo ?? '—'} · {simbolo} {l.en_recibos.importe.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-1">
                                                    <input
                                                        value={l.tipo_documento}
                                                        onChange={(e) => actualizar(l.uid, 'tipo_documento', e.target.value)}
                                                        className={`${celda} w-[70px] shrink-0 border-b border-[#9a8c6a]/60 px-1 py-1`}
                                                        placeholder="FAC"
                                                        aria-label="Tipo de documento"
                                                    />
                                                    <input
                                                        value={l.documento_completo}
                                                        onChange={(e) => actualizar(l.uid, 'documento_completo', e.target.value)}
                                                        className={`${celda} border-b border-[#9a8c6a]/60 px-1 py-1 font-mono`}
                                                        placeholder="F001-00012"
                                                        aria-label="Número de documento"
                                                    />
                                                </div>
                                                <span className="w-fit rounded-sm border border-[#9a8c6a]/60 bg-[#ece3c9] px-1.5 py-px text-[10.5px] font-semibold text-[#5f5233]">
                                                    Fila libre · no se verifica con la cuenta del cliente
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    <td className={`${BORDE} px-2 py-2 text-right tabular-nums ${TINTA}`}>
                                        {l.saldo_documento != null
                                            ? <>{simbolo} {Number(l.saldo_documento).toFixed(2)}</>
                                            : <span className="text-[#b7aa8a]">—</span>}
                                    </td>

                                    <td className={`${BORDE} p-0 ${err ? 'bg-[#f7d9d4]' : ''}`}>
                                        <div className="flex items-center gap-1 px-1.5">
                                            <span className="shrink-0 text-[12px] font-bold text-[#3b4f86]">{simbolo}</span>
                                            <input
                                                value={l.importe}
                                                onChange={(e) => actualizar(l.uid, 'importe', e.target.value)}
                                                inputMode="decimal"
                                                className={`${celda} px-0 text-right font-semibold tabular-nums`}
                                                placeholder="0.00"
                                                aria-label="Importe"
                                                aria-invalid={!!err}
                                            />
                                        </div>
                                        {err && <p className="px-1.5 pb-1 text-[10.5px] font-semibold leading-tight text-[#9b1c22]">{err}</p>}
                                    </td>

                                    <td className={`${BORDE} p-0`}>
                                        <input
                                            value={l.observaciones}
                                            onChange={(e) => actualizar(l.uid, 'observaciones', e.target.value)}
                                            className={celda}
                                            aria-label="Observaciones"
                                        />
                                    </td>

                                    <td className={`${BORDE} p-0 text-center align-middle`}>
                                        <button
                                            type="button"
                                            onClick={() => onChange(lineas.filter(x => x.uid !== l.uid))}
                                            title="Quitar del recibo"
                                            aria-label={`Quitar ${l.documento_completo || 'la línea'}`}
                                            className="h-[26px] w-[26px] rounded text-[18px] leading-none text-[#9b1c22] transition-colors hover:bg-[#f3d6d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9b1c22]"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>

                    <tfoot>
                        <tr>
                            <td colSpan={2} className={`${BORDE} border-t-[2.5px] border-double px-2 py-2 text-right text-[14px] font-bold tracking-wide ${TINTA}`}
                                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                                TOTAL
                            </td>
                            <td className={`${BORDE} border-t-[2.5px] border-double bg-[#efe5c8] p-0`}>
                                <div className="flex items-center gap-1 px-1.5">
                                    <span className="shrink-0 text-[12px] font-bold text-[#3b4f86]">{simbolo}</span>
                                    <span className={`w-full py-2 text-right text-[14px] font-extrabold tabular-nums ${TINTA}`}>
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                            </td>
                            <td className={`${BORDE} border-t-[2.5px] border-double p-0`}>
                                <input
                                    value={observacion}
                                    onChange={(e) => onObservacionChange(e.target.value)}
                                    className={celda}
                                    placeholder="observación general"
                                    aria-label="Observación del total"
                                />
                            </td>
                            <td className={`${BORDE} border-t-[2.5px] border-double`} />
                        </tr>

                        {totalSaldo !== null && totalSaldo > 0.004 && (
                            <tr>
                                <td colSpan={2} className={`${BORDE} px-2 py-1.5 text-right text-[12px] font-semibold ${TINTA}`}>
                                    Queda debiendo
                                </td>
                                <td className={`${BORDE} px-1.5 py-1.5 text-right text-[12.5px] font-bold tabular-nums ${TINTA}`}>
                                    {simbolo} {totalSaldo.toFixed(2)}
                                </td>
                                <td className={BORDE} />
                                <td className={BORDE} />
                            </tr>
                        )}
                    </tfoot>
                </table>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="min-w-[240px] flex-1">{buscador}</div>

                <button
                    type="button"
                    onClick={() => onChange([...lineas, lineaVacia()])}
                    className="shrink-0 rounded-md border border-[#1b2f63]/70 bg-[#fbf6e8] px-3.5 py-2 text-[13px] font-semibold text-[#1b2f63] transition-colors hover:bg-[#1b2f63] hover:text-[#fbf6e8]"
                >
                    + Fila libre
                </button>
            </div>
        </div>
    )
}
