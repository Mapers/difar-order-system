'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Edit, Trash2, RefreshCw, Save,
    AlertCircle, Search, FlaskConical, X,
} from 'lucide-react'
import { toast } from '@/app/hooks/useToast'
import apiClient from '@/app/api/client'

interface Laboratorio {
    IdLineaGe:          number
    Codigo_Linea:       string
    Descripcion:        string
    Procedencia:        number
    NombreProcedencia?: string
    EmpRegistro:        string
    NombreEmpresa?:     string
    FechaReg:           string
}

interface Pais     { Id: number;          Descripcion:         string }
interface Empresa  { CodigoEmpresa: string; NombreRazSocial: string }

interface FormState {
    codigo_linea: string
    descripcion:  string
    procedencia:  string
    emp_registro: string
}

const FORM_INICIAL: FormState = {
    codigo_linea: '',
    descripcion:  '',
    procedencia:  '0',
    emp_registro: '',
}

interface Props {
    onOpenModalChange: (fn: () => void) => void
}


export default function LaboratoriosSection({ onOpenModalChange }: Props) {

    const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
    const [paises,       setPaises]       = useState<Pais[]>([])
    const [empresas,     setEmpresas]     = useState<Empresa[]>([])
    const [loading,      setLoading]      = useState(true)
    const [loadingSave,  setLoadingSave]  = useState(false)
    const [busqueda,     setBusqueda]     = useState('')

    const [isFormOpen,   setIsFormOpen]   = useState(false)
    const [editando,     setEditando]     = useState<Laboratorio | null>(null)

    const [form,   setForm]   = useState<FormState>(FORM_INICIAL)
    const [errors, setErrors] = useState<Partial<FormState>>({})

    const fetchLaboratorios = useCallback(async (q = '') => {
        setLoading(true)
        try {
            const res = await apiClient.get('/laboratorios/listar/laboratorios', {
                params: q ? { q } : {},
            })

            setLaboratorios(res.data?.data?.data ?? [])
        } catch {
            toast({ title: 'Error', description: 'No se pudieron cargar los laboratorios.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchCombos = async () => {
        try {
            const [resPaises, resEmpresas] = await Promise.all([
                apiClient.get('/laboratorios/combos/laboratorios/paises'),
                apiClient.get('/laboratorios/combos/laboratorios/empresas'),
            ])
            setPaises(resEmpresas.data?.data?.data  ?? [])
            setPaises(resPaises.data?.data?.data    ?? [])
            setEmpresas(resEmpresas.data?.data?.data ?? [])
        } catch {
        }
    }

    useEffect(() => {
        fetchLaboratorios()
        fetchCombos()
    }, [fetchLaboratorios])

    const abrirNuevo = useCallback(() => {
        setEditando(null)
        setForm(FORM_INICIAL)
        setErrors({})
        setIsFormOpen(true)
    }, [])

    useEffect(() => {
        onOpenModalChange(abrirNuevo)
    }, [onOpenModalChange, abrirNuevo])

    const abrirEditar = (lab: Laboratorio) => {
        setEditando(lab)
        setForm({
            codigo_linea: lab.Codigo_Linea,
            descripcion:  lab.Descripcion,
            procedencia:  String(lab.Procedencia ?? 0),
            emp_registro: lab.EmpRegistro ?? '',
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const validar = (): boolean => {
        const e: Partial<FormState> = {}
        if (!form.codigo_linea.trim()) e.codigo_linea = 'Requerido'
        else if (form.codigo_linea.trim().length > 4) e.codigo_linea = 'Máximo 4 caracteres'
        if (!form.descripcion.trim()) e.descripcion = 'Requerido'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleGuardar = async () => {
        if (!validar()) return
        setLoadingSave(true)
        try {
            const payload = {
                codigo_linea: form.codigo_linea.trim().toUpperCase(),
                descripcion:  form.descripcion.trim(),
                procedencia:  Number(form.procedencia) || 0,
                emp_registro: form.emp_registro || '',
            }

            if (editando) {
                await apiClient.put(`/laboratorios/actualizar/laboratorios/${editando.IdLineaGe}`, payload)
                toast({ title: '✓ Actualizado', description: `${payload.descripcion} actualizado correctamente.` })
            } else {
                await apiClient.post('/laboratorios/crear/laboratorios', payload)
                toast({ title: '✓ Creado', description: `${payload.descripcion} creado correctamente.` })
            }

            setIsFormOpen(false)
            fetchLaboratorios(busqueda)
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'No se pudo guardar el laboratorio.'
            toast({ title: 'Error', description: msg, variant: 'destructive' })
        } finally {
            setLoadingSave(false)
        }
    }

    const handleBuscar = () => fetchLaboratorios(busqueda)
    const handleLimpiar = () => { setBusqueda(''); fetchLaboratorios('') }

    return (
        <>
            <div className="flex gap-2 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por código o descripción..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleBuscar} variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                </Button>
                {busqueda && (
                    <Button onClick={handleLimpiar} variant="ghost" size="icon">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                </div>
            ) : laboratorios.length === 0 ? (
                <div className="text-center py-12">
                    <FlaskConical className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No se encontraron laboratorios</p>
                    <p className="text-xs text-slate-400 mt-1">
                        {busqueda ? 'Intenta con otro término de búsqueda.' : 'Crea el primer laboratorio con el botón "Nuevo Registro".'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {laboratorios.map(lab => (
                        <Card key={lab.IdLineaGe} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardContent className="p-4">

                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                                            <FlaskConical className="h-4 w-4 text-sky-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{lab.Descripcion}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200">
                                                    {lab.Codigo_Linea}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 mb-4 bg-slate-50 rounded-lg p-2.5 text-xs">
                                    <div className="flex justify-between gap-2">
                                        <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Procedencia</span>
                                        <span className="text-slate-700 font-medium truncate">{lab.NombreProcedencia || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Empresa</span>
                                        <span className="text-slate-700 font-medium truncate max-w-[180px]">{lab.NombreEmpresa || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">Registro</span>
                                        <span className="text-slate-500 font-mono text-[10px]">{lab.EmpRegistro || '—'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline" size="sm"
                                        className="flex-1 text-xs"
                                        onClick={() => abrirEditar(lab)}
                                    >
                                        <Edit className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-sky-600" />
                            {editando ? 'Editar' : 'Nuevo'} Laboratorio
                        </DialogTitle>
                        <DialogDescription>
                            {editando
                                ? `Modifica los datos del laboratorio "${editando.Descripcion}".`
                                : 'Completa los campos para registrar un nuevo laboratorio (línea genética).'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-1">

                        <div className="space-y-1.5">
                            <Label htmlFor="codigo_linea">
                                Código de línea <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="codigo_linea"
                                maxLength={4}
                                placeholder="Ej: AB01"
                                value={form.codigo_linea}
                                onChange={e => setForm(p => ({ ...p, codigo_linea: e.target.value.toUpperCase() }))}
                                className={errors.codigo_linea ? 'border-red-500' : ''}
                            />
                            {errors.codigo_linea && (
                                <p className="text-xs text-red-500">{errors.codigo_linea}</p>
                            )}
                            <p className="text-[11px] text-slate-400">Máximo 4 caracteres. Se convierte a mayúsculas.</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="descripcion">
                                Descripción <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="descripcion"
                                maxLength={50}
                                placeholder="Ej: LABORATORIO BAYER"
                                value={form.descripcion}
                                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                                className={errors.descripcion ? 'border-red-500' : ''}
                            />
                            {errors.descripcion && (
                                <p className="text-xs text-red-500">{errors.descripcion}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Procedencia (País)</Label>
                            <Select
                                value={String(form.procedencia)}
                                onValueChange={v => setForm(p => ({ ...p, procedencia: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar país..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">— Sin procedencia —</SelectItem>
                                    {paises.map(p => (
                                        <SelectItem key={p.Id} value={String(p.Id)}>
                                            {p.Descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Empresa registrante</Label>
                            <Select
                                value={form.emp_registro || '__none__'}
                                onValueChange={v => setForm(p => ({ ...p, emp_registro: v === '__none__' ? '' : v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar empresa..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">— Sin empresa —</SelectItem>
                                    {empresas.map(e => (
                                        <SelectItem key={e.CodigoEmpresa} value={e.CodigoEmpresa}>
                                            {e.NombreRazSocial}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsFormOpen(false)}
                            disabled={loadingSave}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleGuardar} disabled={loadingSave}>
                            {loadingSave
                                ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                : <Save className="h-4 w-4 mr-2" />}
                            {editando ? 'Guardar cambios' : 'Crear laboratorio'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}