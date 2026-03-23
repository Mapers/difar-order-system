'use client'

// ─── Props ────────────────────────────────────────────────────────────────────

import {CatalogosBanco, PlanillaDetalle, TipoComprobante} from "@/app/types/planilla-types";
import {fmtFecha, fmtMoney} from "@/lib/planilla.helper";

interface Props {
    registros:         PlanillaDetalle[]
    tiposComprobante:  TipoComprobante[]
    bancos:            CatalogosBanco[]
    editando?:         boolean
    onCambiar?:        (id: number, campo: string, valor: string) => void
    onEliminar?:       (id: number) => void
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function CellInput({
                       value, onChange, type = 'text', className = '',
                   }: {
    value: string; onChange: (v: string) => void; type?: string; className?: string
}) {
    return (
        <input
            type={type}
            step={type === 'number' ? '0.01' : undefined}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`text-xs border border-amber-200 rounded px-1.5 py-1 bg-white
        focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200
        ${className}`}
        />
    )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MiniTabla({
                                      registros, tiposComprobante, bancos,
                                      editando = false, onCambiar, onEliminar,
                                  }: Props) {

    if (registros.length === 0) {
        return (
            <p className="text-center text-slate-400 text-sm py-8">
                Aún no hay registros. Completa el formulario y presiona{' '}
                <strong>Agregar registro</strong>.
            </p>
        )
    }

    const change = (id: number, campo: string, valor: string) =>
        onCambiar?.(id, campo, valor)

    const tDocs = registros.reduce((s, r) => s + Number(r.importe), 0)
    const tCbza = registros.reduce((s, r) => s + Number(r.importe_cobrado), 0)

    return (
        <>
            {/* ════════════ DESKTOP: mini-table ════════════ */}
            <div className="hidden lg:block overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-[11.5px] min-w-[720px]">
                    <thead>
                    <tr className="bg-slate-800">
                        {[
                            { label: '#',        w: '28px'  },
                            { label: 'Código',   w: '90px'  },
                            { label: 'Nombre',   w: undefined },
                            { label: 'T/D',      w: '42px', center: true },
                            { label: 'Serie',    w: '38px'  },
                            { label: 'N° Doc',   w: '64px'  },
                            { label: 'Importe',  w: '78px', sep: false },
                            { label: 'Recibo',   w: '72px', sep: true  },
                            { label: 'Cobrado',  w: '78px'  },
                            { label: 'Banco',    w: '54px', center: true },
                            { label: 'F. Dep.',  w: '82px', center: true },
                            { label: 'N° Op',    w: '80px'  },
                        ].map(h => (
                            <th
                                key={h.label}
                                style={{ width: h.w }}
                                className={`px-2 py-2 text-left text-[9px] font-semibold tracking-wider
                    uppercase text-blue-100 whitespace-nowrap
                    ${h.sep ? 'border-l-2 border-blue-600' : ''}
                    ${h.center ? 'text-center' : ''}`}
                            >
                                {h.label}
                            </th>
                        ))}
                        {(editando || onEliminar) && (
                            <th className="px-2 py-2 w-8" />
                        )}
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                    {registros.map((r, i) => (
                        <tr
                            key={r.id_detalle}
                            className={`transition-colors
                  ${editando
                                ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                : 'hover:bg-blue-50/30'}`}
                        >
                            <td className="px-2 py-2 text-[10px] text-slate-400">{i + 1}</td>

                            {/* Código */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600">
                                {editando
                                    ? <CellInput value={r.codigo_cliente ?? ''} onChange={v => change(r.id_detalle, 'codigo_cliente', v)} className="w-20" />
                                    : (r.codigo_cliente || '—')}
                            </td>

                            {/* Nombre */}
                            <td className="px-2 py-2 font-medium max-w-[160px] truncate">
                                {editando
                                    ? <CellInput value={r.nombre_cliente} onChange={v => change(r.id_detalle, 'nombre_cliente', v)} className="w-full" />
                                    : r.nombre_cliente}
                            </td>

                            {/* T/D */}
                            <td className="px-2 py-2 text-center font-mono text-[10.5px]">
                                {editando ? (
                                    <select
                                        value={r.tipo_documento}
                                        onChange={e => change(r.id_detalle, 'tipo_documento', e.target.value)}
                                        className="text-xs border border-amber-200 rounded px-1 py-1 bg-white focus:outline-none focus:border-amber-500"
                                    >
                                        {tiposComprobante.map(t => (
                                            <option key={t.codigo} value={t.codigo}>{t.codigo}</option>
                                        ))}
                                    </select>
                                ) : (r.desc_tipo_documento || r.tipo_documento)}
                            </td>

                            {/* Serie */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600">
                                {editando
                                    ? <CellInput value={r.serie ?? ''} onChange={v => change(r.id_detalle, 'serie', v)} className="w-14" />
                                    : (r.serie || '—')}
                            </td>

                            {/* N° Doc */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600">
                                {editando
                                    ? <CellInput value={r.numero_doc ?? ''} onChange={v => change(r.id_detalle, 'numero_doc', v)} className="w-16" />
                                    : (r.numero_doc || '—')}
                            </td>

                            {/* Importe */}
                            <td className="px-2 py-2 font-mono font-medium text-blue-800 text-right">
                                {editando
                                    ? <CellInput type="number" value={String(r.importe)} onChange={v => change(r.id_detalle, 'importe', v)} className="w-20 text-right" />
                                    : fmtMoney(r.importe)}
                            </td>

                            {/* Recibo — separador visual */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600 border-l-2 border-blue-100">
                                {editando
                                    ? <CellInput value={r.numero_recibo ?? ''} onChange={v => change(r.id_detalle, 'numero_recibo', v)} className="w-20" />
                                    : (r.numero_recibo || '—')}
                            </td>

                            {/* Cobrado */}
                            <td className="px-2 py-2 font-mono font-medium text-emerald-600 text-right">
                                {editando
                                    ? <CellInput type="number" value={String(r.importe_cobrado)} onChange={v => change(r.id_detalle, 'importe_cobrado', v)} className="w-20 text-right" />
                                    : Number(r.importe_cobrado) > 0 ? fmtMoney(r.importe_cobrado) : '—'}
                            </td>

                            {/* Banco */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600 text-center">
                                {editando ? (
                                    <select
                                        value={r.cod_banco ?? ''}
                                        onChange={e => change(r.id_detalle, 'cod_banco', e.target.value)}
                                        className="text-xs border border-amber-200 rounded px-1 py-1 bg-white focus:outline-none focus:border-amber-500"
                                    >
                                        <option value="">—</option>
                                        {bancos.map(b => (
                                            <option key={b.CodigoEntidadFinanciera} value={b.CodigoEntidadFinanciera}>{b.DescripcionEntidadFinanciera}</option>
                                        ))}
                                    </select>
                                ) : (r.desc_banco || bancos.find(b => b.CodigoEntidadFinanciera === r.cod_banco)?.DescripcionEntidadFinanciera || '—')}
                            </td>

                            {/* F. Dep. */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600 text-center">
                                {editando
                                    ? <CellInput type="date" value={r.fecha_deposito ?? ''} onChange={v => change(r.id_detalle, 'fecha_deposito', v)} />
                                    : fmtFecha(r.fecha_deposito)}
                            </td>

                            {/* N° Op */}
                            <td className="px-2 py-2 font-mono text-[10.5px] text-slate-600">
                                {editando
                                    ? <CellInput value={r.numero_operacion ?? ''} onChange={v => change(r.id_detalle, 'numero_operacion', v)} className="w-24" />
                                    : (r.numero_operacion || '—')}
                            </td>

                            {/* Acciones */}
                            {(editando || onEliminar) && (
                                <td className="px-2 py-2">
                                    {onEliminar && (
                                        <button
                                            onClick={() => onEliminar(r.id_detalle)}
                                            className="text-red-400 hover:text-red-600 transition-colors p-0.5 rounded"
                                        >
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                                                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>

                    <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                        <td colSpan={6} className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Total
                        </td>
                        <td className="px-2 py-1.5 font-mono font-semibold text-blue-800 text-right">
                            {fmtMoney(tDocs)}
                        </td>
                        <td className="border-l-2 border-blue-100 px-2" />
                        <td className="px-2 py-1.5 font-mono font-semibold text-emerald-600 text-right">
                            {fmtMoney(tCbza)}
                        </td>
                        <td colSpan={4} />
                    </tr>
                    </tfoot>
                </table>
            </div>

            {/* ════════════ MOBILE: cards ════════════ */}
            <div className="lg:hidden space-y-3">
                {registros.map((r, i) => (
                    <div
                        key={r.id_detalle}
                        className={`rounded-xl overflow-hidden border shadow-sm
              ${editando ? 'border-amber-200' : 'border-slate-200'}`}
                    >
                        {/* Head */}
                        <div className={`px-3 py-2.5 flex items-start justify-between
              ${editando ? 'bg-amber-600' : 'bg-slate-800'}`}>
                            <div>
                <span className={`text-[9px] uppercase font-bold tracking-wider
                  ${editando ? 'text-amber-100' : 'text-blue-200'}`}>
                  {editando ? `Editando · Reg ${i + 1}` : `Registro ${i + 1}`}
                </span>
                                <p className="text-sm font-bold text-white mt-0.5 truncate max-w-[220px]">
                                    {r.nombre_cliente}
                                </p>
                                <p className="text-[10px] text-white/60 font-mono">
                                    {r.codigo_cliente || ''}
                                </p>
                            </div>
                            {onEliminar && (
                                <button
                                    onClick={() => onEliminar(r.id_detalle)}
                                    className="text-white/70 hover:text-white p-1"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Sección Documento */}
                        <div className={`p-3 border-b-2 ${editando ? 'border-amber-100' : 'border-blue-50'}`}>
                            <p className={`text-[9px] uppercase font-bold tracking-wider mb-2
                ${editando ? 'text-amber-600' : 'text-blue-500'}`}>
                                Documento
                            </p>
                            {editando ? (
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Código cliente</p>
                                        <input className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:border-amber-500"
                                               value={r.codigo_cliente ?? ''}
                                               onChange={e => change(r.id_detalle, 'codigo_cliente', e.target.value)} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Nombre / Razón social</p>
                                        <input className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:border-amber-500"
                                               value={r.nombre_cliente}
                                               onChange={e => change(r.id_detalle, 'nombre_cliente', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-[9px] uppercase text-slate-400 mb-0.5">T/D</p>
                                            <select className="w-full text-xs border border-amber-200 rounded-md px-1 py-1.5 bg-white focus:outline-none"
                                                    value={r.tipo_documento}
                                                    onChange={e => change(r.id_detalle, 'tipo_documento', e.target.value)}>
                                                {tiposComprobante.map(t => (
                                                    <option key={t.codigo} value={t.codigo}>{t.codigo}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase text-slate-400 mb-0.5">Serie</p>
                                            <input className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none font-mono"
                                                   value={r.serie ?? ''}
                                                   onChange={e => change(r.id_detalle, 'serie', e.target.value)} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase text-slate-400 mb-0.5">N° Doc</p>
                                            <input className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none font-mono"
                                                   value={r.numero_doc ?? ''}
                                                   onChange={e => change(r.id_detalle, 'numero_doc', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Importe S/.</p>
                                        <input type="number" step="0.01" className="w-full text-sm font-bold border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none font-mono"
                                               value={r.importe}
                                               onChange={e => change(r.id_detalle, 'importe', e.target.value)} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        <div>
                                            <p className="text-[9px] uppercase text-slate-400">Tipo</p>
                                            <p className="text-xs font-semibold font-mono">{r.desc_tipo_documento || r.tipo_documento}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase text-slate-400">Serie</p>
                                            <p className="text-xs font-mono text-slate-600">{r.serie || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase text-slate-400">N° Doc</p>
                                            <p className="text-xs font-mono text-slate-600">{r.numero_doc || '—'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400">Importe</p>
                                        <p className="text-xl font-bold text-blue-800 font-mono">{fmtMoney(r.importe)}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sección Liquidación */}
                        <div className={`p-3 ${editando ? 'bg-amber-50 border-t-2 border-amber-100' : 'bg-[#FAFFF8] border-t-2 border-emerald-50'}`}>
                            <p className={`text-[9px] uppercase font-bold tracking-wider mb-2
                ${editando ? 'text-amber-600' : 'text-emerald-600'}`}>
                                Liquidación de cobranza
                            </p>
                            {editando ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Importe cobrado</p>
                                        <input type="number" step="0.01" className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none font-mono"
                                               value={r.importe_cobrado}
                                               onChange={e => change(r.id_detalle, 'importe_cobrado', e.target.value)} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Recibo N°</p>
                                        <input className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none font-mono"
                                               value={r.numero_recibo ?? ''}
                                               onChange={e => change(r.id_detalle, 'numero_recibo', e.target.value)} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Banco</p>
                                        <select className="w-full text-xs border border-amber-200 rounded-md px-1 py-1.5 bg-white focus:outline-none"
                                                value={r.cod_banco ?? ''}
                                                onChange={e => change(r.id_detalle, 'cod_banco', e.target.value)}>
                                            <option value="">— sin banco —</option>
                                            {bancos.map(b => (
                                                <option key={b.CodigoEntidadFinanciera} value={b.CodigoEntidadFinanciera}>{b.DescripcionEntidadFinanciera}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">Fecha depósito</p>
                                        <input type="date" className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none"
                                               value={r.fecha_deposito ?? ''}
                                               onChange={e => change(r.id_detalle, 'fecha_deposito', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[9px] uppercase text-slate-400 mb-0.5">N° Operación</p>
                                        <input className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none font-mono"
                                               value={r.numero_operacion ?? ''}
                                               onChange={e => change(r.id_detalle, 'numero_operacion', e.target.value)} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400">Cobrado</p>
                                        <p className="text-lg font-bold text-emerald-600 font-mono">
                                            {Number(r.importe_cobrado) > 0 ? fmtMoney(r.importe_cobrado) : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400">Recibo</p>
                                        <p className="text-xs font-mono">{r.numero_recibo || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400">Banco</p>
                                        <p className="text-xs">{r.desc_banco || bancos.find(b => b.CodigoEntidadFinanciera === r.cod_banco)?.DescripcionEntidadFinanciera || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] uppercase text-slate-400">F. depósito</p>
                                        <p className="text-xs text-slate-400">{fmtFecha(r.fecha_deposito)}</p>
                                    </div>
                                    {r.numero_operacion && (
                                        <div className="col-span-2">
                                            <p className="text-[9px] uppercase text-slate-400">N° Operación</p>
                                            <p className="text-xs font-mono text-slate-400">{r.numero_operacion}</p>
                                        </div>
                                    )}
                                    {r.numero_cheque && (
                                        <div className="col-span-2">
                                            <p className="text-[9px] uppercase text-slate-400">N° Cheque</p>
                                            <p className="text-xs font-mono text-slate-400">{r.numero_cheque}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Totales móvil */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Total documentos</p>
                        <p className="font-mono text-lg font-semibold text-blue-800">{fmtMoney(tDocs)}</p>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Total cobrado</p>
                        <p className="font-mono text-lg font-semibold text-emerald-600">{fmtMoney(tCbza)}</p>
                    </div>
                </div>
            </div>
        </>
    )
}