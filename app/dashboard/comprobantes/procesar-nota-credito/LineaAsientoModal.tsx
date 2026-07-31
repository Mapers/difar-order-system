'use client'

import { useEffect, useState } from "react"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    AMO_ASIENTO_LABEL, AsientoLinea, ComboCentroCostosRow, CONCEPTO_MAX, DocumentoAplicable,
} from "@/app/types/procesar-nota-credito-types"
import { SeleccionarDocumentoModal, PickerModo } from "./SeleccionarDocumentoModal"

type Side = 'cargo' | 'abono'

interface FormErrors {
    documento?: string
    importe?:   string
}

interface LineaAsientoModalProps {
    open:            boolean
    onOpenChange:    (open: boolean) => void
    linea:           AsientoLinea | null   // null = nueva línea
    fechaAsiento:    string
    glosa:           string
    centrosCosto:    ComboCentroCostosRow[]
    clienteAsiento:  string                // RUC fijado por la N.C. ya cargada
    onSave:          (linea: AsientoLinea) => void
}

function lineaVacia(): AsientoLinea {
    return {
        id: '', tipDoc: '', serie: '', numero: '', codCliente: '', razonSocial: '',
        cargo: 0, abono: 0, ctaContable: null, codContable: '', centroCostos: '',
        undCosto: '', fechaEmision: '', fechaVencimiento: '',
    }
}

export function LineaAsientoModal({
    open, onOpenChange, linea, fechaAsiento, glosa, centrosCosto, clienteAsiento, onSave,
}: LineaAsientoModalProps) {
    const [form, setForm]       = useState<AsientoLinea>(lineaVacia())
    const [side, setSide]       = useState<Side>('cargo')
    const [importe, setImporte] = useState('')
    const [errors, setErrors]   = useState<FormErrors>({})
    const [pickerModo, setPickerModo] = useState<PickerModo | null>(null)

    useEffect(() => {
        if (!open) return
        const base = linea ?? lineaVacia()
        setForm(base)
        setSide(base.abono > 0 ? 'abono' : 'cargo')
        setImporte(base.abono > 0 ? String(base.abono) : base.cargo > 0 ? String(base.cargo) : '')
        setErrors({})
    }, [open, linea])

    const set = <K extends keyof AsientoLinea>(field: K, value: AsientoLinea[K]) =>
        setForm(prev => ({ ...prev, [field]: value }))

    // El documento solo entra por el picker: tiene que existir en el kardex de
    // clientes con su provisión '00', o el SP rechaza el asiento completo.
    const docCargado = !!form.tipDoc && !!form.codCliente
    const esNC       = form.tipDoc === '07'

    function validate(): boolean {
        const newErrors: FormErrors = {}
        const monto = Number(importe)
        if (!docCargado) newErrors.documento = "Carga la N.C. o el comprobante desde el buscador."
        if (!importe || isNaN(monto) || monto <= 0) newErrors.importe = "El importe debe ser mayor a 0.00."
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    function handleGuardar() {
        if (!validate()) return
        const monto = Number(importe)
        onSave({
            ...form,
            id: form.id || crypto.randomUUID(),
            cargo: side === 'cargo' ? monto : 0,
            abono: side === 'abono' ? monto : 0,
        })
        onOpenChange(false)
    }

    function handlePick(doc: DocumentoAplicable) {
        setForm(prev => ({
            ...prev,
            tipDoc: doc.tipDoc, serie: doc.serie, numero: doc.numero,
            codCliente: doc.codCliente, razonSocial: doc.razonSocial,
            ctaContable: doc.idCtaContable, codContable: '',
            fechaEmision: doc.fechaEmision, fechaVencimiento: doc.fechaVencimiento,
        }))
        setImporte(String(doc.monto))
        // N.C. al debe, factura/boleta al haber — así lo graba el sistema.
        setSide(doc.tipDoc === '07' ? 'cargo' : 'abono')
        setErrors({})
        setPickerModo(null)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{linea ? 'Editar línea' : 'Agregar línea'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-12 gap-3.5">
                        <SectionLabel>Documento</SectionLabel>

                        {!docCargado && (
                            <div className="col-span-12 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Aún no hay documento. Usa <b>Cargar N.C</b> o <b>Cargar Factura/Boleta</b>
                                {' '}para traerlo del kardex.
                            </div>
                        )}

                        <Field className="col-span-2" label="tipD">
                            <Input className="bg-muted font-mono text-muted-foreground" value={form.tipDoc} readOnly placeholder="07" />
                        </Field>
                        <Field className="col-span-3" label="Serie">
                            <Input className="bg-muted font-mono text-muted-foreground" value={form.serie} readOnly placeholder="F001" />
                        </Field>
                        <Field className="col-span-3" label="Nro documento">
                            <Input className="bg-muted font-mono text-muted-foreground" value={form.numero} readOnly placeholder="1350" />
                        </Field>
                        <Field className="col-span-4" label="Cta. contable">
                            <Input
                                className="bg-muted font-mono text-muted-foreground"
                                value={form.ctaContable ?? ''}
                                readOnly
                                placeholder="del cliente"
                            />
                        </Field>
                        {errors.documento && (
                            <p className="col-span-12 -mt-1 text-xs text-destructive">{errors.documento}</p>
                        )}

                        <SectionLabel>Tercero y concepto</SectionLabel>
                        <Field className="col-span-4" label="RUC / código">
                            <Input className="bg-muted font-mono text-muted-foreground" value={form.codCliente} readOnly placeholder="—" />
                        </Field>
                        <Field className="col-span-8" label="Razón social">
                            <Input className="bg-muted text-muted-foreground" value={form.razonSocial} readOnly placeholder="—" />
                        </Field>
                        <Field className="col-span-12" label={`Concepto · se copia de la glosa (máx. ${CONCEPTO_MAX})`}>
                            <Input
                                className="bg-muted text-muted-foreground"
                                value={glosa.slice(0, CONCEPTO_MAX)}
                                readOnly
                                placeholder="Define la glosa en la cabecera"
                            />
                        </Field>

                        <SectionLabel>Importe</SectionLabel>
                        <Field className="col-span-4" label="Tipo de movimiento">
                            <div className="flex overflow-hidden rounded-md border">
                                <button
                                    type="button"
                                    onClick={() => setSide('cargo')}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-medium transition-colors",
                                        side === 'cargo' ? "bg-green-100 text-green-800" : "bg-background text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    Cargo · Debe
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSide('abono')}
                                    className={cn(
                                        "flex-1 border-l py-2 text-sm font-medium transition-colors",
                                        side === 'abono' ? "bg-red-100 text-red-800" : "bg-background text-muted-foreground hover:bg-accent"
                                    )}
                                >
                                    Abono · Haber
                                </button>
                            </div>
                        </Field>
                        <Field className="col-span-4" label="Importe" error={errors.importe}>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
                                <Input
                                    inputMode="decimal"
                                    value={importe}
                                    onChange={e => { setImporte(e.target.value); setErrors(p => ({ ...p, importe: undefined })) }}
                                    className={cn("pl-8 text-right font-mono", errors.importe && "border-destructive")}
                                    placeholder="0.00"
                                />
                            </div>
                        </Field>
                        <Field className="col-span-4" label="Centro de costos">
                            <Select value={form.centroCostos} onValueChange={v => set('centroCostos', v)}>
                                <SelectTrigger><SelectValue placeholder="— Seleccionar —" /></SelectTrigger>
                                <SelectContent>
                                    {centrosCosto.map(c => (
                                        <SelectItem key={c.CodCentroCostos} value={c.CodCentroCostos}>
                                            {c.CodCentroCostos} · {c.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <SectionLabel>Amortización y fechas</SectionLabel>
                        <Field className="col-span-4" label="tipAmo">
                            <Input value={AMO_ASIENTO_LABEL} readOnly className="bg-muted text-muted-foreground" />
                        </Field>
                        <Field className="col-span-4" label="F. emisión">
                            <Input className="bg-muted font-mono text-muted-foreground" value={form.fechaEmision} readOnly placeholder="aaaa-mm-dd" />
                        </Field>
                        <Field className="col-span-4" label="F. vencimiento">
                            <Input className="bg-muted font-mono text-muted-foreground" value={form.fechaVencimiento} readOnly placeholder="aaaa-mm-dd" />
                        </Field>
                    </div>

                    <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => setPickerModo('nc')} className="gap-1.5">
                                <FileDown className="h-3.5 w-3.5" />
                                Cargar N.C
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={!clienteAsiento && !esNC}
                                title={!clienteAsiento ? "Primero agrega la línea de la nota de crédito" : undefined}
                                onClick={() => setPickerModo('comp')}
                                className="gap-1.5"
                            >
                                <FileDown className="h-3.5 w-3.5" />
                                Cargar Factura/Boleta
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="button" onClick={handleGuardar}>{linea ? 'Guardar cambios' : 'Agregar línea'}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SeleccionarDocumentoModal
                open={pickerModo !== null}
                modo={pickerModo ?? 'nc'}
                fechaAsiento={fechaAsiento}
                codCliente={clienteAsiento || form.codCliente}
                onClose={() => setPickerModo(null)}
                onPick={handlePick}
            />
        </>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="col-span-12 -mb-1 flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-wide text-blue-700">
            {children}
            <span className="h-px flex-1 bg-blue-100" />
        </div>
    )
}

function Field({ className, label, error, children }: { className?: string; label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <Label className="text-xs uppercase text-muted-foreground">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    )
}
