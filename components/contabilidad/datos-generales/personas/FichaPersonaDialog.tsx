'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Save, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/app/hooks/useToast'
import { PersonasService } from '@/app/services/contabilidad/DatosGeneralesService'
import { CatalogosPersonas, FichaPersona, FilaPersona, Uso } from '@/app/types/datos-generales-types'
import { AlertaUso, AvisoAmbar, Campo, claseInput, Combo, Confirmar, hoy, texto, textoError } from '../comunes'

const CLIENTE = '01'

export const fichaPersonaVacia = (relacion = ''): FichaPersona => ({
    nuevo: true, codigo: '', nombre: '', nombreComercial: '', tipoDoc: '', ruc: '', direccion: '', idDistrito: '', referencia: '',
    correo: '', otros: '', telefono: '', fechaInicio: hoy(), relacion, ctaContable: '', codigoVendedor: '', idZona: '', lineaCredito: '', tipoCliente: '',
})

/** Fila de la lista -> ficha (modificación). */
export const fichaPersonaDe = (f: FilaPersona): FichaPersona => ({
    nuevo: false, codigo: f.Codigo, nombre: texto(f.Nombre), nombreComercial: texto(f.NombreComercial), tipoDoc: texto(f.TipoDocIdent),
    ruc: texto(f.RUC), direccion: texto(f.Direccion), idDistrito: texto(f.idDistrito), referencia: texto(f.referenciaDireccion),
    correo: texto(f.correoElectronico), otros: texto(f.otros), telefono: texto(f.Telefono), fechaInicio: texto(f.FECHA_INICIO).slice(0, 10) || hoy(),
    relacion: texto(f.Relacion), ctaContable: texto(f.CtaContab), codigoVendedor: texto(f.Codigo_Ved), idZona: texto(f.IdZona),
    lineaCredito: f.LineaCredito === null || f.LineaCredito === undefined ? '' : String(Number(f.LineaCredito)), tipoCliente: texto(f.TipoCliente),
})

interface Props {
    abierta: boolean
    ficha: FichaPersona | null
    catalogos: CatalogosPersonas | null
    onCerrar: () => void
    onCambio: () => void
}

/** Ficha de Personas y Empresas (form Access [Perosnas y Empresas]): GuardarNuevo / Modificar / Limpiar / Eliminar Registro. */
export function FichaPersonaDialog({ abierta, ficha, catalogos, onCerrar, onCambio }: Props) {
    const [f, setF] = useState<FichaPersona>(fichaPersonaVacia())
    const [guardando, setGuardando] = useState(false)
    const [aviso, setAviso] = useState('')
    const [avisos, setAvisos] = useState<string[] | null>(null)
    const [preguntaEliminar, setPreguntaEliminar] = useState(false)
    const [usos, setUsos] = useState<Uso[] | null>(null)
    useEffect(() => { if (abierta) { setF(ficha ?? fichaPersonaVacia()); setAviso('') } }, [abierta, ficha])
    const set = (p: Partial<FichaPersona>) => { setF((x) => ({ ...x, ...p })); setAviso('') }

    const esCliente = f.relacion === CLIENTE
    const relacionNombre = catalogos?.relaciones.find((r) => String(r.id) === f.relacion)?.nombre

    /** Relacion_Exit de Access: pone la cuenta por defecto del tipo de relación. */
    function cambiarRelacion(rel: string) {
        const r = catalogos?.relaciones.find((x) => String(x.id) === rel)
        set({ relacion: rel, ctaContable: r?.idCuenta ? String(r.idCuenta) : f.ctaContable })
    }

    /** Lo mismo que revisa el SP (A1, A2): se avisa en ámbar antes de enviar. */
    const faltantes = useMemo(() => {
        const x: string[] = []
        if (!f.codigo.trim()) x.push('código')
        if (!f.nombre.trim()) x.push('nombre / razón social')
        if (!f.tipoDoc) x.push('doc. identidad')
        if (!f.idDistrito) x.push('distrito / provincia / departamento')
        if (!f.fechaInicio) x.push('fecha inicio')
        if (!f.relacion) x.push('tipo de relación')
        if (!f.ctaContable) x.push('cta contable')
        if (esCliente && !f.codigoVendedor) x.push('vendedor')
        if (esCliente && !f.idZona) x.push('zona')
        return x
    }, [f, esCliente])

    async function guardar(confirmado = false) {
        if (faltantes.length) { setAviso(`Datos no completos: ingrese información en los campos (*): ${faltantes.join(', ')}.`); return }
        if (!confirmado) {
            const a: string[] = []
            if (!f.nombreComercial.trim()) a.push('Falta el nombre comercial (marcado (*) en Access).')
            if (!f.direccion.trim()) a.push('Falta la dirección (marcada (*) en Access).')
            if (f.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) a.push(`El email "${f.correo.trim()}" no parece válido.`)
            if (f.tipoDoc === '06' && (f.ruc || f.codigo).trim().length !== 11) a.push('El RUC debería tener 11 dígitos.')
            if (f.tipoDoc === '01' && (f.ruc || f.codigo).trim().length !== 8) a.push('El DNI debería tener 8 dígitos.')
            if (a.length) { setAvisos(a); return }
        }
        setGuardando(true)
        try {
            const r = await PersonasService.guardar(f)
            toast({ title: f.nuevo ? 'Persona registrada' : 'Persona modificada', description: `${f.codigo.trim()} ${f.nombre}` })
            if (r.otrosConMismoRuc > 0) setAviso(`Guardado. Aviso: hay ${r.otrosConMismoRuc} código(s) más con el mismo Nro. Doc. Identidad.`)
            onCambio()
            // Con aviso de RUC repetido la ficha queda abierta (ya grabada: pasa a "Modificar").
            if (r.otrosConMismoRuc) setF((x) => ({ ...x, nuevo: false }))
            else if (f.nuevo) setF(fichaPersonaVacia(f.relacion))
            else onCerrar()
        } catch (e) {
            setAviso(await textoError(e))
        } finally { setGuardando(false) }
    }

    async function eliminar() {
        setPreguntaEliminar(false)
        setGuardando(true)
        try {
            const r = await PersonasService.eliminar(f.codigo)
            if (!r.eliminado) { setUsos(r.usos); return }
            toast({ title: 'Persona eliminada', description: `${f.codigo} ${f.nombre}` })
            onCambio(); onCerrar()
        } catch (e) {
            setAviso(await textoError(e))
        } finally { setGuardando(false) }
    }

    const input = (campo: keyof FichaPersona, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <input className={claseInput} value={String(f[campo] ?? '')} onChange={(e) => set({ [campo]: e.target.value } as Partial<FichaPersona>)} {...props} />
    )

    return (
        <>
            <Dialog open={abierta} onOpenChange={(o) => !o && onCerrar()}>
                <DialogContent className="flex max-h-[94vh] max-w-4xl flex-col gap-0 overflow-hidden p-0" closeClassName="text-white opacity-90 hover:opacity-100 z-10">
                    <DialogHeader className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-4 text-left text-white sm:px-6">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100">
                            <UserRound className="h-3.5 w-3.5" /> {f.nuevo ? 'Nueva persona / empresa' : 'Personas y empresas'}
                        </p>
                        <DialogTitle className="mt-1 flex flex-wrap items-baseline gap-x-3 pr-8 text-xl font-bold">
                            <span className="font-mono tracking-wider">{f.codigo.trim() || '···········'}</span>
                            <span className="max-w-full truncate text-base font-medium text-blue-50/90">{f.nombre || 'Sin nombre'}</span>
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-xs text-blue-100">{relacionNombre ? `Relación: ${relacionNombre}` : 'Los campos con (*) son obligatorios.'}</DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-5">
                        <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso('')} />
                        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:grid-cols-12 sm:p-4">
                            <Campo label="Codigo" obligatorio className="sm:col-span-3">
                                {input('codigo', { maxLength: 11, disabled: !f.nuevo, className: `${claseInput} font-mono`,
                                    onBlur: () => { if (f.nuevo && !f.ruc.trim() && f.codigo.trim()) set({ ruc: f.codigo.trim() }) } })}
                            </Campo>
                            <Campo label="Nombre / Razon Social" obligatorio className="sm:col-span-9">{input('nombre', { maxLength: 255 })}</Campo>

                            <Campo label="NombreComercial" obligatorio className="sm:col-span-5">{input('nombreComercial', { maxLength: 255 })}</Campo>
                            <Campo label="Doc. Identidad" obligatorio className="sm:col-span-4"><Combo items={catalogos?.documentos} valor={f.tipoDoc} onCambio={(v) => set({ tipoDoc: v })} /></Campo>
                            <Campo label="Nro.Doc.Identidad" obligatorio className="sm:col-span-3" ayuda="Vacío = se copia el código">{input('ruc', { maxLength: 11, className: `${claseInput} font-mono` })}</Campo>

                            <Campo label="Dirección" obligatorio className="sm:col-span-7">{input('direccion', { maxLength: 100 })}</Campo>
                            <Campo label="Distrito / Provincia / Departamento" obligatorio className="sm:col-span-5">
                                <Combo items={catalogos?.distritos} valor={f.idDistrito} onCambio={(v) => set({ idDistrito: v })} placeholder="Buscar distrito…" />
                            </Campo>

                            <Campo label="Referencia Direccion" className="sm:col-span-12">{input('referencia', { maxLength: 255 })}</Campo>

                            <Campo label="Email" className="sm:col-span-6">{input('correo', { maxLength: 255, type: 'email' })}</Campo>
                            <Campo label="Otros Datos" className="sm:col-span-6">{input('otros', { maxLength: 255 })}</Campo>

                            <Campo label="Telefonos" className="sm:col-span-4">{input('telefono', { maxLength: 100 })}</Campo>
                            <Campo label="Fecha inicio" obligatorio className="sm:col-span-2">{input('fechaInicio', { type: 'date' })}</Campo>
                            <Campo label="Tipo de Relacion" obligatorio className="sm:col-span-3"><Combo items={catalogos?.relaciones} valor={f.relacion} onCambio={cambiarRelacion} /></Campo>
                            <Campo label="Cta Contable" obligatorio className="sm:col-span-3"><Combo items={catalogos?.cuentas} valor={f.ctaContable} onCambio={(v) => set({ ctaContable: v })} conCodigo /></Campo>

                            <Campo label="Vendedor" obligatorio={esCliente} className="sm:col-span-4">
                                <Combo items={catalogos?.vendedores} valor={f.codigoVendedor} onCambio={(v) => set({ codigoVendedor: v })} disabled={!esCliente} placeholder={esCliente ? 'Seleccionar…' : 'Solo clientes'} />
                            </Campo>
                            <Campo label="Zona" obligatorio={esCliente} className="sm:col-span-4">
                                <Combo items={catalogos?.zonas} valor={f.idZona} onCambio={(v) => set({ idZona: v })} disabled={!esCliente} placeholder={esCliente ? 'Seleccionar…' : 'Solo clientes'} />
                            </Campo>
                            <Campo label="Linea Credito" className="sm:col-span-2">{input('lineaCredito', { inputMode: 'decimal', disabled: !esCliente, className: `${claseInput} text-right` })}</Campo>
                            <Campo label="Tipo Cliente" className="sm:col-span-2">{input('tipoCliente', { maxLength: 10, disabled: !esCliente })}</Campo>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex gap-2">
                            {!f.nuevo && (
                                <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto dark:hover:bg-red-950/40" disabled={guardando} onClick={() => setPreguntaEliminar(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar registro
                                </Button>
                            )}
                            {f.nuevo && <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setF(fichaPersonaVacia(f.relacion))}>Limpiar</Button>}
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto">
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onCerrar}>Cerrar</Button>
                            <Button disabled={guardando} className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md sm:flex-none" onClick={() => guardar()}>
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {f.nuevo ? 'Guardar y nuevo' : 'Modificar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Confirmar abierto={!!avisos} titulo="Revisa antes de guardar" avisos={avisos ?? []} textoAccion="Guardar igual"
                       onCancelar={() => setAvisos(null)} onAceptar={() => { setAvisos(null); guardar(true) }} />
            <Confirmar abierto={preguntaEliminar} titulo={`¿Eliminar ${f.codigo}?`} peligro textoAccion="Eliminar"
                       descripcion="Solo se elimina si no tiene compras, ventas, cuenta corriente, libros contables, pedidos ni datos de la app de ventas."
                       onCancelar={() => setPreguntaEliminar(false)} onAceptar={eliminar} />
            <AlertaUso titulo={`No se puede eliminar ${f.codigo}`} usos={usos} onCerrar={() => setUsos(null)} />
        </>
    )
}
