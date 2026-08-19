'use client'

import { LineaRecibo } from '@/app/types/recibo-cliente-types'

interface Props {
    lineas: LineaRecibo[]
    onChange: (lineas: LineaRecibo[]) => void
    buscador: React.ReactNode
    simbolo: string
    observacion: string
    onObservacionChange: (v: string) => void
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
        observaciones: '',
        simbolo_moneda: '',
    }
}

export function ReciboDetalleTabla({
    lineas,
    onChange,
    buscador,
    simbolo,
    observacion,
    onObservacionChange,
}: Props) {
    const total = lineas.reduce((s, l) => s + (parseFloat(l.importe) || 0), 0)

    const actualizar = (uid: string, campo: keyof LineaRecibo, valor: string) => {
        onChange(lineas.map(l => (l.uid === uid ? { ...l, [campo]: valor } : l)))
    }

    const celda = 'w-full bg-transparent border-0 outline-none px-1.5 py-2 text-[13px] text-[#12388f] focus:bg-[#f4f7ff]'
    const celdaFija = `${celda} bg-[#eef2fb] font-bold cursor-default`

    return (
        <div className="mt-4">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px] min-w-[560px]">
                    <thead>
                        <tr>
                            <th className="w-[26%] border-[1.4px] border-[#12388f] bg-[#eef2fb] px-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#12388f]">
                                Tipo de<br />Documento
                            </th>
                            <th className="w-[22%] border-[1.4px] border-[#12388f] bg-[#eef2fb] px-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#12388f]">
                                N°
                            </th>
                            <th className="w-[20%] border-[1.4px] border-[#12388f] bg-[#eef2fb] px-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#12388f]">
                                Importe
                            </th>
                            <th className="border-[1.4px] border-[#12388f] bg-[#eef2fb] px-1 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#12388f]">
                                Observaciones
                            </th>
                            <th className="w-9 border-[1.4px] border-[#12388f] bg-[#eef2fb]" aria-label="Acciones" />
                        </tr>
                    </thead>

                    <tbody>
                        {lineas.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="border-[1.4px] border-[#12388f] px-3 py-6 text-center text-[12px] italic text-[#8aa0cf]"
                                >
                                    Sin documentos. Agrega los que estás cobrando.
                                </td>
                            </tr>
                        )}

                        {lineas.map((l) => {
                            const delKardex = l.id_kardex_cliente != null

                            return (
                                <tr key={l.uid}>
                                    <td className="border-[1.4px] border-[#12388f] p-0">
                                        <input
                                            value={l.abre_documento || l.tipo_documento}
                                            onChange={(e) => actualizar(l.uid, 'tipo_documento', e.target.value)}
                                            readOnly={delKardex}
                                            className={delKardex ? celdaFija : celda}
                                            placeholder="FAC / BOL"
                                            aria-label="Tipo de documento"
                                        />
                                    </td>

                                    <td className="border-[1.4px] border-[#12388f] p-0">
                                        <input
                                            value={l.documento_completo}
                                            onChange={(e) => actualizar(l.uid, 'documento_completo', e.target.value)}
                                            readOnly={delKardex}
                                            className={delKardex ? celdaFija : celda}
                                            placeholder="F001-00012"
                                            aria-label="Número de documento"
                                        />
                                    </td>

                                    <td className="border-[1.4px] border-[#12388f] p-0">
                                        <div className="flex items-center gap-1 px-1.5">
                                            <span className="shrink-0 text-[12px] font-bold text-[#2b52a8]">{simbolo}</span>
                                            <input
                                                value={l.importe}
                                                onChange={(e) => actualizar(l.uid, 'importe', e.target.value)}
                                                inputMode="decimal"
                                                className={`${celda} px-0 text-right`}
                                                placeholder="0.00"
                                                aria-label="Importe"
                                            />
                                        </div>
                                    </td>

                                    <td className="border-[1.4px] border-[#12388f] p-0">
                                        <input
                                            value={l.observaciones}
                                            onChange={(e) => actualizar(l.uid, 'observaciones', e.target.value)}
                                            className={celda}
                                            aria-label="Observaciones"
                                        />
                                    </td>

                                    <td className="border-[1.4px] border-[#12388f] p-0 text-center">
                                        <button
                                            type="button"
                                            onClick={() => onChange(lineas.filter(x => x.uid !== l.uid))}
                                            title="Quitar del recibo"
                                            aria-label={`Quitar ${l.documento_completo || 'la línea'}`}
                                            className="h-[26px] w-[26px] rounded text-[18px] leading-none text-[#d21f27] transition-colors hover:bg-[#fde8e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d21f27]"
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
                            <td
                                colSpan={2}
                                className="border-[1.4px] border-t-2 border-[#12388f] px-2 py-2 text-right text-[14px] font-extrabold text-[#12388f]"
                            >
                                TOTAL {simbolo}
                            </td>
                            <td className="border-[1.4px] border-t-2 border-[#12388f] p-0">
                                <div className="flex items-center gap-1 bg-[#eef2fb] px-1.5">
                                    <span className="shrink-0 text-[12px] font-bold text-[#2b52a8]">{simbolo}</span>
                                    <span className="w-full py-2 text-right text-[13px] font-extrabold text-[#12388f]">
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                            </td>
                            <td className="border-[1.4px] border-t-2 border-[#12388f] p-0">
                                <input
                                    value={observacion}
                                    onChange={(e) => onObservacionChange(e.target.value)}
                                    className={celda}
                                    aria-label="Observación del total"
                                />
                            </td>
                            <td className="border-[1.4px] border-t-2 border-[#12388f]" />
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <div className="min-w-[240px] flex-1">{buscador}</div>

                <button
                    type="button"
                    onClick={() => onChange([...lineas, lineaVacia()])}
                    className="shrink-0 rounded-lg border border-[#12388f] px-3.5 py-2 text-[13px] font-semibold text-[#12388f] transition-colors hover:bg-[#12388f] hover:text-white"
                >
                    + Fila libre
                </button>
            </div>
        </div>
    )
}
