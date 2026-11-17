'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import {
    ArrowRightLeft, Boxes, Building2, ClipboardList, Contact, FilePlus2, ListX, Loader2, Lock, PackageMinus, PackagePlus,
    ChevronRight, MessageSquareText, Plus, Printer, RotateCcw, Save, Search, Trash2, User, Warehouse, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/app/hooks/useToast"
import { cn } from "@/lib/utils"
import { AvisoAmbar, AvisoExito, Campo, Combo, Confirmar, Seccion, claseInput, useSacudir } from "@/components/contabilidad/datos-generales/comunes"
import { BuscadorRemoto } from "./BuscadorRemoto"
import { ConfirmarEliminacion } from "./ConfirmarEliminacion"
import { generarPdfNotaAlmacen } from "./pdfNotaAlmacen"
import { PdfVistaPreviaDialog } from "@/components/reporte/PdfVistaPreviaDialog"
import { OpcionesPdfReporte } from "@/components/reporte/pdfOpciones"
import { FichaArticuloDialog, fichaArticuloVacia, ListasAbiertas } from "@/components/contabilidad/datos-generales/articulos/FichaArticuloDialog"
import { FichaPersonaDialog, fichaPersonaVacia } from "@/components/contabilidad/datos-generales/personas/FichaPersonaDialog"
import { ArticulosService, PersonasService } from "@/app/services/contabilidad/DatosGeneralesService"
import { CatalogosArticulos, CatalogosPersonas } from "@/app/types/datos-generales-types"
import {
    AlmacenService, ArticuloAlmacen, CatalogosAlmacen, FilaListado, LineaNota, LoteConSaldo, PersonaAlmacen,
    TipoMovimiento, mensajeError,
} from "@/app/services/almacen/AlmacenService"

const EMPRESA = { ruc: '20481321892', nombre: 'DISTRIBUIDORA E IMPORTADORA FARMACEUTICA S.A.C.' }
const hoy = () => format(new Date(), 'yyyy-MM-dd')
const soloFecha = (v: any) => (v ? String(typeof v === 'string' ? v : new Date(v).toISOString()).slice(0, 10) : '')
const dmy = (v: any) => { const f = soloFecha(v); return f ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}` : '' }
const num = (v: any) => Number(v ?? 0)
const fmt = (v: any, d = 2) => num(v).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d })
const soles = (v: any) => `S/ ${fmt(v)}`
/** Listas abiertas de la ficha de artículo (sugerencias de Medida, Tipo, etc.): desde Almacén van vacías. */
const LISTAS_VACIAS: ListasAbiertas = { medida: [], tipo: [], modelo: [], marca: [], otros1: [], otros2: [], control: [] }
let contador = 0
const nuevaClave = () => `n${++contador}`

const lineaVacia = (centro = ''): LineaNota => ({
    clave: nuevaClave(), id: null, marcada: false, codigoArt: '', articulo: '', unidad: '', cantidad: '', costoTotal: '',
    lote: '', fechaVcto: '', centroCostos: centro, almacenDestino: '', idGalpon: '',
})

interface Cabecera {
    id: number | null
    fecha: string
    concepto: string
    documento: string
    serie: string
    numero: string
    persona: string
    personaNombre: string
    personaRel: string
    almacen: string
    undCosto: string
    observaciones: string
    /** Nota guardada en un periodo ya cerrado (PeriodoCerrado / EditableCierre del SP): solo lectura. */
    bloqueada: boolean
}

/** Textos de cada lado, con los mensajes del Access ("Formulario Ingreso Almacen" / "Formulario Salida Almacen"). */
const TEXTOS: Record<TipoMovimiento, {
    titulo: string; sub: string; nota: string; informe: string; concepto: string; persona: string; docDefecto: string
    msgConcepto: string; msgPersona: string
}> = {
    ingresos: {
        titulo: 'Ingresos de Almacén', sub: 'Notas de ingreso de mercadería al almacén. Al guardar se actualizan el kardex y los lotes.',
        nota: 'Nota de Ingreso', informe: 'Ingreso de Almacen', concepto: 'Concepto de ingreso', persona: 'Proveedor', docDefecto: 'NI',
        msgConcepto: 'SELECCIONE TIPO DE INGRESO', msgPersona: 'SELECCIONE PROVEEDOR / CLIENTE',
    },
    salidas: {
        titulo: 'Salidas de Almacén', sub: 'Notas de egreso y transferencias entre almacenes. Al guardar se actualiza el kardex.',
        nota: 'Nota de Salida', informe: 'Salidas de Almacen', concepto: 'Concepto de salida', persona: 'Cliente', docDefecto: 'NE',
        msgConcepto: 'SELECCIONE TIPO DE SALIDA', msgPersona: 'SELECCIONE CLIENTE / PROVEEDOR',
    },
}
const MSG_CIERRE = 'EL REGISTRO ESTA FUERA DE FECHA DE CIERRE CONTABLE Y NO SE GUARDARA'
const MSG_TERMINE = 'Termine Ingreso de Datos, Luego Guardar o Eliminar'

/** Lo que cuenta como "cambio sin guardar" (sin claves internas ni marcas E). */
const huella = (c: Cabecera | null, ls: LineaNota[]) => JSON.stringify([
    c && { ...c, bloqueada: undefined },
    ls.filter(l => l.id || l.codigoArt || l.cantidad || l.costoTotal || l.lote)
        .map(l => [l.id, l.codigoArt, l.cantidad, l.costoTotal, l.lote, l.fechaVcto, l.centroCostos, l.almacenDestino, l.idGalpon]),
])

export function NotaAlmacen({ tipo }: { tipo: TipoMovimiento }) {
    const T = TEXTOS[tipo]
    const esSalida = tipo === 'salidas'
    const IconoTipo = esSalida ? PackageMinus : PackagePlus
    const [cat, setCat] = useState<CatalogosAlmacen | null>(null)
    const [avisoLista, setAvisoLista] = useState<string | null>(null)
    const [ahora, setAhora] = useState(() => new Date())
    useEffect(() => { const t = setInterval(() => setAhora(new Date()), 30000); return () => clearInterval(t) }, [])

    // ------------------------------------------------------------ listado (botón Buscar)
    const [desde, setDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [hasta, setHasta] = useState(hoy())
    const [buscar, setBuscar] = useState('')
    const [fConcepto, setFConcepto] = useState('')
    const [fAlmacen, setFAlmacen] = useState('')
    const [filas, setFilas] = useState<FilaListado[]>([])
    const [cargandoLista, setCargandoLista] = useState(false)

    const cargarLista = useCallback(async () => {
        setCargandoLista(true); setAvisoLista(null)
        try {
            setFilas(await AlmacenService.listar(tipo, {
                desde, hasta, buscar: buscar.trim() || undefined, concepto: fConcepto || undefined, almacen: fAlmacen || undefined,
            }))
        } catch (e) { setAvisoLista(mensajeError(e, 'No se pudo cargar el listado.')) }
        finally { setCargandoLista(false) }
    }, [tipo, desde, hasta, buscar, fConcepto, fAlmacen])

    useEffect(() => {
        AlmacenService.catalogos(tipo).then(setCat).catch(e => setAvisoLista(mensajeError(e, 'No se pudieron cargar los catálogos.')))
        cargarLista()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipo])

    // ------------------------------------------------------------ modal de la nota
    const [abierta, setAbierta] = useState(false)
    const [cab, setCab] = useState<Cabecera | null>(null)
    const [lineas, setLineas] = useState<LineaNota[]>([])
    const [aviso, setAviso] = useState<string | null>(null)
    const [errores, setErrores] = useState<Set<string>>(new Set())
    const [golpe, setGolpe] = useState(0)
    const refSacudir = useSacudir(true, golpe)
    const [exito, setExito] = useState<{ texto: string; id?: number } | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [abriendo, setAbriendo] = useState<number | null>(null)
    const [confirmar, setConfirmar] = useState<null | string>(null)
    /** Datos del informe para el PDF (modal de vista previa estándar de la web). */
    const [pdfFilas, setPdfFilas] = useState<any[] | null>(null)
    const [lotes, setLotes] = useState<Record<string, LoteConSaldo[]>>({})
    const numeroManual = useRef(false)
    const original = useRef('')

    const centroDefecto = cat?.centrosCosto.find(c => c.PorDefecto)?.Cod_CC ?? cat?.centrosCosto[0]?.Cod_CC ?? ''
    const galpones = useMemo(() => (esSalida ? cat?.unidadesCosto : cat?.galpones) ?? [], [cat, esSalida])
    const conUnidadCosto = galpones.length > 0
    const concepto = cat?.conceptos.find(c => c.Codigo_Op === cab?.concepto)
    const esTransferencia = esSalida && Number(concepto?.EsTransferencia) === 1
    const fechaCerrada = !!(cab && cat?.fechaCierre && cab.fecha && cab.fecha <= soloFecha(cat.fechaCierre))
    const bloqueada = !!cab?.bloqueada
    const sucio = !!cab && huella(cab, lineas) !== original.current

    // Opciones de los combos (mismo Combo con buscador de Contabilidad). Conceptos por código, como Access.
    const opConceptos = useMemo(() => [...(cat?.conceptos ?? [])].sort((a, b) => a.Codigo_Op.localeCompare(b.Codigo_Op))
        .map(c => ({ id: c.Codigo_Op, codigo: c.Codigo_Op, nombre: `${c.Codigo_Op} · ${c.Operacion}` })), [cat])
    const opDocumentos = useMemo(() => (cat?.documentos ?? []).map(d => ({ id: d.Cod_Tipo, codigo: d.Cod_Tipo, nombre: d.Descripcion })), [cat])
    const opAlmacenes = useMemo(() => (cat?.almacenes ?? []).map(a => ({ id: String(a.IdAlmacen), codigo: a.Codigo_Alm, nombre: a.Descripcion })), [cat])
    const opCentros = useMemo(() => (cat?.centrosCosto ?? []).map(c => ({ id: c.Cod_CC, codigo: c.Cod_CC, nombre: c.Descripcion })), [cat])
    const opGalpones = useMemo(() => galpones.map(g => ({ id: String(g.IdGalpon), nombre: g.Descripcion })), [galpones])

    const fallar = (mensaje: string, campos: string[] = []) => {
        setAviso(mensaje); setErrores(new Set(campos)); setGolpe(g => g + 1); setExito(null)
    }
    const limpiarError = (campo: string) => setErrores(e => { if (!e.has(campo)) return e; const n = new Set(e); n.delete(campo); return n })

    // ------------------------------------------------------------ nueva / abrir
    /** Nota nueva como Access: solo Documento por defecto y Fecha de hoy; lo demás vacío. */
    const prepararNueva = () => {
        if (!cat) return
        numeroManual.current = false
        const doc = cat.documentos.find(d => d.Cod_Tipo === T.docDefecto) ?? cat.documentos.find(d => d.PorDefecto) ?? cat.documentos[0]
        const c: Cabecera = {
            id: null, fecha: hoy(), concepto: '', documento: doc?.Cod_Tipo ?? '', serie: '', numero: '',
            persona: '', personaNombre: '', personaRel: '', almacen: '', undCosto: '', observaciones: '', bloqueada: false,
        }
        const ls = [lineaVacia(centroDefecto)]
        setCab(c); setLineas(ls); setLotes({})
        original.current = huella(c, ls)
        setAviso(null); setErrores(new Set())
    }
    const nueva = () => { prepararNueva(); setExito(null); setAbierta(true) }

    const cargarNota = async (id: number) => {
        const { cabecera: c, detalle } = await AlmacenService.obtener(tipo, id)
        numeroManual.current = true
        const nc: Cabecera = {
            id: c.Codigo_Mvto, fecha: soloFecha(c.Fecha_Mvto), concepto: c.Codigo_Op ?? '', documento: c.Codigo_Doc ?? '',
            serie: c.Serie_Doc ?? '', numero: String(c.Nro_Doc ?? ''), persona: c.Codigo_Prov_Clie ?? '',
            personaNombre: (esSalida ? c.Cliente : c.Proveedor) ?? c.Codigo_Prov_Clie ?? '', personaRel: '',
            almacen: String((esSalida ? c.IdAlmacen : c.CodigoAlmacen) ?? ''), undCosto: c.idUndCosto ? String(c.idUndCosto) : '',
            observaciones: c.Glosa ?? '',
            bloqueada: esSalida ? Number(c.EditableCierre) === 0 : Number(c.PeriodoCerrado) === 1,
        }
        const ls: LineaNota[] = detalle.map((d: any) => ({
            clave: nuevaClave(), id: esSalida ? d.Id_Mvto_Salidas : d.Id_Detalle_Ingresos,
            marcada: Number(esSalida ? d.EliminaIS : d.EliminaII) === 1,
            codigoArt: d.Codigo_Art ?? '', articulo: d.NombreItem ?? d.Codigo_Art ?? '', unidad: d.AbrevUnidMed ?? '',
            cantidad: String(num(esSalida ? d.Cantidad_Sal : d.Cantidad_Ing)), costoTotal: esSalida ? '' : String(num(d.Cost_Tot)),
            lote: d.Lote ?? '', fechaVcto: soloFecha(d.FechaVctoLote), centroCostos: d.CentroCostos ?? '',
            almacenDestino: d.Almacen2 ? String(d.Almacen2) : '', idGalpon: d.idGalpon ? String(d.idGalpon) : '',
        }))
        setCab(nc); setLineas(ls); setLotes({})
        original.current = huella(nc, ls)
    }

    const abrir = async (id: number) => {
        setAbriendo(id); setAvisoLista(null)
        try { await cargarNota(id); setAviso(null); setErrores(new Set()); setExito(null); setAbierta(true) }
        catch (e) { setAvisoLista(mensajeError(e, 'No se pudo abrir la nota.')) }
        finally { setAbriendo(null) }
    }

    /** Cerrar / Nueva con cambios sin guardar: Access no deja ("Termine Ingreso de Datos…"); aquí se pregunta. */
    const intentarCerrar = () => { if (guardando) return; if (sucio) setConfirmar('cerrar'); else setAbierta(false) }
    const intentarNueva = () => { if (sucio) setConfirmar('nueva'); else nueva() }

    // Número sugerido (NumeroMax / SERIE_DOC_Exit del Access): solo en nota nueva, sin número escrito, con documento y serie.
    useEffect(() => {
        if (!cab || cab.id || numeroManual.current || !cab.documento || !cab.serie.trim()) return
        let vivo = true
        AlmacenService.siguienteNumero(tipo, cab.documento, cab.serie.trim())
            .then(n => { if (vivo && !numeroManual.current) setCab(c => (c && !c.id ? { ...c, numero: String(n) } : c)) }).catch(() => {})
        return () => { vivo = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cab?.documento, cab?.serie, cab?.id])

    // Lotes con saldo (solo salidas): por artículo, almacén de origen y nota (el saldo excluye la propia nota).
    const claveLotes = (art: string) => `${art}|${cab?.almacen}|${cab?.id ?? 'nueva'}`
    useEffect(() => {
        if (!esSalida || !cab?.almacen) return
        const faltan = [...new Set(lineas.map(l => l.codigoArt).filter(a => a && !lotes[claveLotes(a)]))]
        faltan.forEach(a => AlmacenService.lotes(a, Number(cab.almacen), cab.id)
            .then(r => setLotes(p => ({ ...p, [claveLotes(a)]: r }))).catch(() => setLotes(p => ({ ...p, [claveLotes(a)]: [] }))))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [esSalida, cab?.almacen, cab?.id, lineas.map(l => l.codigoArt).join(','), lotes])

    const set = (c: Partial<Cabecera>) => { setCab(x => (x ? { ...x, ...c } : x)); Object.keys(c).forEach(limpiarError); setExito(null) }
    const cambiar = (clave: string, cambios: Partial<LineaNota>) => {
        setLineas(ls => ls.map(l => (l.clave === clave ? { ...l, ...cambios } : l)))
        Object.keys(cambios).forEach(k => limpiarError(`${clave}:${k}`))
    }
    const quitarFilaYa = (clave: string) => setLineas(ls => { const r = ls.filter(l => l.clave !== clave); return r.length ? r : [lineaVacia(centroDefecto)] })
    const quitarFila = (clave: string) => {
        const l = lineas.find(x => x.clave === clave)
        if (l && (l.codigoArt || l.cantidad)) setConfirmar(`fila:${clave}`); else quitarFilaYa(clave)
    }

    // ------------------------------------------------------------ guardar (Access: cmdSaveandNew)
    const guardar = async () => {
        if (!cab) return
        if (bloqueada || fechaCerrada) return fallar(MSG_CIERRE, ['fecha'])
        // Mensajes de Access, en el orden del formulario; se marcan todos los campos que faltan.
        const faltan: [string, string][] = []
        if (!cab.fecha) faltan.push(['fecha', 'INGRESE FECHA'])
        if (!cab.concepto) faltan.push(['concepto', T.msgConcepto])
        if (!cab.documento) faltan.push(['documento', 'INGRESE INFORMACION A REGISTRAR'])
        if (!cab.serie.trim()) faltan.push(['serie', 'INGRESE INFORMACION A REGISTRAR'])
        if (!cab.persona) faltan.push(['persona', T.msgPersona])
        if (!cab.almacen) faltan.push(['almacen', 'SELECCIONE ALMACEN'])
        if (faltan.length) return fallar(faltan[0][1], faltan.map(f => f[0]))
        const conDatos = lineas.filter(l => l.codigoArt)
        if (conDatos.length === 0) return fallar('INGRESE INFORMACION A REGISTRAR: agrega al menos un artículo.', lineas[0] ? [`${lineas[0].clave}:codigoArt`] : [])
        const malas = conDatos.filter(l => !(Number(l.cantidad) > 0))
        if (malas.length) return fallar(`La cantidad debe ser mayor que 0 (${malas.length} fila${malas.length === 1 ? '' : 's'}).`, malas.map(l => `${l.clave}:cantidad`))
        if (esTransferencia) {
            const sinDestino = conDatos.filter(l => !l.almacenDestino || l.almacenDestino === cab.almacen)
            if (sinDestino.length) return fallar('Seleccione Almacen de Transferencia (distinto del almacén de origen).', sinDestino.map(l => `${l.clave}:almacenDestino`))
        }
        setGuardando(true); setAviso(null); setErrores(new Set())
        try {
            const r = await AlmacenService.guardar(tipo, cab.id, {
                fecha: cab.fecha, concepto: cab.concepto, documento: cab.documento, serie: cab.serie.trim(),
                // Nota nueva con el número sugerido: va vacío y lo asigna el SP (evita choque si otro usuario grabó antes).
                numero: !cab.id && !numeroManual.current ? null : cab.numero ? Number(cab.numero) : null,
                ...(esSalida ? { cliente: cab.persona, undCosto: cab.undCosto ? Number(cab.undCosto) : null } : { proveedor: cab.persona }),
                almacen: Number(cab.almacen), observaciones: cab.observaciones,
                detalle: conDatos.map(l => ({ ...l, almacenDestino: esTransferencia ? l.almacenDestino : '' })),
            })
            const id = Number(r.data?.Codigo_Mvto)
            toast({ title: 'Guardado', description: r.message })
            cargarLista()
            // Como Access: después de guardar pasa a una nota nueva; la guardada se reabre o imprime desde el aviso verde.
            prepararNueva()
            setExito({ texto: r.message, id })
        } catch (e) { fallar(mensajeError(e, 'No se pudo guardar la nota.')) }
        finally { setGuardando(false) }
    }

    // ------------------------------------------------------------ eliminar (EliminarRegistro / EliminaDetalle)
    const pedirEliminarFilas = () => {
        const marcadasL = lineas.filter(l => l.marcada)
        if (!marcadasL.length) return fallar('Marque en la columna E las filas a eliminar.')
        const guardadasMarcadas = marcadasL.filter(l => l.id)
        // Access guarda antes de eliminar (SaveRecord); aquí se pide guardar primero para no perder lo escrito.
        if (guardadasMarcadas.length && huella(cab, lineas.filter(l => !(l.marcada && !l.id))) !== original.current)
            return fallar('Guarde primero los cambios de la nota y luego elimine las filas marcadas.')
        setConfirmar('filas')
    }

    const eliminar = async () => {
        const que = confirmar
        if (que?.startsWith('fila:')) { quitarFilaYa(que.slice(5)); setConfirmar(null); return }
        if (que === 'filas') {
            const nuevas = lineas.filter(l => l.marcada && !l.id)
            const guardadas = lineas.filter(l => l.marcada && l.id)
            if (!guardadas.length || !cab?.id) {
                const resto = lineas.filter(l => !l.marcada)
                setLineas(resto.length ? resto : [lineaVacia(centroDefecto)])
                setConfirmar(null)
                setExito({ texto: `${nuevas.length} fila${nuevas.length === 1 ? '' : 's'} quitada${nuevas.length === 1 ? '' : 's'} (aún no estaban guardadas).` })
                return
            }
        }
        if (!cab?.id) return
        setAviso(null)
        try {
            if (que === 'nota') {
                const r = await AlmacenService.eliminar(tipo, cab.id)
                toast({ title: 'Eliminada', description: r.message })
                setAbierta(false); setCab(null); cargarLista()
            } else {
                const ids = lineas.filter(l => l.marcada && l.id).map(l => Number(l.id))
                const r = await AlmacenService.eliminarDetalle(tipo, cab.id, ids)
                await cargarNota(cab.id)
                setExito({ texto: r.message || 'Filas eliminadas.' })
                cargarLista()
            }
        } catch (e) { fallar(mensajeError(e, 'No se pudo eliminar.')) }
        finally { setConfirmar(null) }
    }

    const imprimir = async (id = cab?.id) => {
        if (!id) return
        try {
            const filasR = await AlmacenService.reporte(tipo, id)
            if (!filasR.length) return fallar('La nota no tiene líneas para imprimir.')
            setPdfFilas(filasR)
        } catch (e) { fallar(mensajeError(e, 'No se pudo preparar la impresión.')) }
    }

    // ------------------------------------------------------------ fichas BienesServicios / PersonasEmpresas
    const [fichaArt, setFichaArt] = useState(false)
    const [fichaPer, setFichaPer] = useState(false)
    const [catArt, setCatArt] = useState<CatalogosArticulos | null>(null)
    const [catPer, setCatPer] = useState<CatalogosPersonas | null>(null)
    const [fichaArtVacia] = useState(() => fichaArticuloVacia())
    const [fichaPerVacia] = useState(() => fichaPersonaVacia(esSalida ? '01' : '02'))
    const abrirBienes = () => {
        setFichaArt(true)
        if (!catArt) ArticulosService.catalogos().then(setCatArt).catch(e => fallar(mensajeError(e, 'No se pudo abrir Bienes y Servicios (revisa que tu rol tenga ese menú en Contabilidad).')))
    }
    const abrirPersonas = () => {
        setFichaPer(true)
        if (!catPer) PersonasService.catalogos().then(setCatPer).catch(e => fallar(mensajeError(e, 'No se pudo abrir Personas y Empresas (revisa que tu rol tenga ese menú en Contabilidad).')))
    }
    const usarArticuloNuevo = (a: { codigo: string; nombre: string }) => {
        if (!a.codigo || bloqueada) return
        setLineas(ls => {
            const i = ls.findIndex(l => !l.codigoArt)
            if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, codigoArt: a.codigo, articulo: a.nombre, lote: '' } : l))
            return [...ls, { ...lineaVacia(centroDefecto), codigoArt: a.codigo, articulo: a.nombre }]
        })
        setExito({ texto: `Artículo ${a.codigo} ${a.nombre} agregado a la nota.` })
    }
    const usarPersonaNueva = (p: { codigo: string; nombre: string }) => {
        if (!p.codigo || bloqueada) return
        setCab(c => (c ? { ...c, persona: p.codigo, personaNombre: p.nombre, personaRel: '' } : c))
        setExito({ texto: `${T.persona} ${p.nombre} puesto en la nota.` })
    }

    // ------------------------------------------------------------ cálculos de pantalla
    const marcadas = lineas.filter(l => l.marcada).length
    const totales = useMemo(() => ({
        cantidad: lineas.reduce((a, l) => a + (Number(l.cantidad) || 0), 0),
        costo: lineas.reduce((a, l) => a + (Number(l.costoTotal) || 0), 0),
    }), [lineas])
    /** Salidas: cantidad pedida por artículo + lote (sumando todas las filas), para avisar si supera el saldo. */
    const pedidoPorLote = useMemo(() => {
        const m = new Map<string, number>()
        lineas.forEach(l => { if (l.codigoArt && l.lote) m.set(`${l.codigoArt}|${l.lote}`, (m.get(`${l.codigoArt}|${l.lote}`) ?? 0) + (Number(l.cantidad) || 0)) })
        return m
    }, [lineas])
    const totalLista = useMemo(() => filas.reduce((a, f) => a + num(f.CostoTotal), 0), [filas])
    const err = (c: string) => errores.has(c)
    const soloLectura = bloqueada

    // ------------------------------------------------------------ celdas del detalle
    const celdaE = (l: LineaNota, i: number) => (
        <td className="px-2 py-2 text-center">
            <div className="flex items-center justify-center gap-1">
                <input type="checkbox" className="h-4 w-4 accent-red-600" checked={l.marcada} disabled={soloLectura}
                       title="Marcar para eliminar (E)" onChange={e => cambiar(l.clave, { marcada: e.target.checked })} aria-label={`Marcar fila ${i + 1}`} />
                {!l.id && !soloLectura && (
                    <button type="button" onClick={() => quitarFila(l.clave)} title="Quitar esta fila (aún no guardada)"
                            className="rounded p-0.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><X className="h-3.5 w-3.5" /></button>
                )}
            </div>
        </td>
    )
    const celdaArticulo = (l: LineaNota) => (
        <td className="px-2 py-1.5">
            <BuscadorRemoto<ArticuloAlmacen>
                etiqueta="artículo" placeholder="Buscar artículo" error={err(`${l.clave}:codigoArt`)} disabled={soloLectura}
                valor={l.codigoArt ? l.articulo : ''}
                buscar={q => AlmacenService.articulos(tipo, q)} getKey={a => a.Codigo_Art}
                getLabel={a => a.NombreItem} getSub={a => a.Codigo_Art} getExtra={a => a.AbrevUnidMed ?? ''}
                onElegir={a => cambiar(l.clave, { codigoArt: a.Codigo_Art, articulo: a.NombreItem, unidad: a.AbrevUnidMed ?? '', lote: '' })} />
            {l.codigoArt && <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{l.codigoArt}{l.unidad ? ` · ${l.unidad}` : ''}</span>}
        </td>
    )
    const celdaCantidad = (l: LineaNota, excede = false) => (
        <td className="px-2 py-1.5">
            <input inputMode="decimal" disabled={soloLectura} className={cn(claseInput, 'text-right font-mono', (excede || err(`${l.clave}:cantidad`)) && 'almacen-campo-error')}
                   value={l.cantidad} onChange={e => cambiar(l.clave, { cantidad: e.target.value.replace(/[^\d.]/g, '') })} />
            {excede && <span className="mt-0.5 block text-[10px] font-medium text-amber-700 dark:text-amber-400">Supera el saldo del lote</span>}
        </td>
    )
    const celdaCentro = (l: LineaNota) => <td className="px-2 py-1.5"><Combo items={opCentros} valor={l.centroCostos} onCambio={v => cambiar(l.clave, { centroCostos: v })} disabled={soloLectura} /></td>
    const celdaGalpon = (l: LineaNota) => (conUnidadCosto
        ? <td className="px-2 py-1.5"><Combo items={opGalpones} valor={l.idGalpon} onCambio={v => cambiar(l.clave, { idGalpon: v })} vaciable disabled={soloLectura} /></td>
        : null)
    const botonAgregar = (
        <Button size="sm" variant="outline" className="border-dashed" onClick={() => setLineas(ls => [...ls, lineaVacia(centroDefecto)])}><Plus className="mr-1 h-4 w-4" /> Agregar artículo</Button>
    )

    // ------------------------------------------------------------ vista
    return (
        <div className="grid grid-cols-1 gap-4 p-4 md:p-6">
            {/* Cabecera de página (estilo Contabilidad) */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"><IconoTipo className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Almacén</p>
                        <h1 className="text-xl font-bold leading-tight sm:text-2xl">{T.titulo}</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">{T.sub}</p>
                    </div>
                </div>
                <Button onClick={nueva} disabled={!cat} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700">
                    <FilePlus2 className="mr-2 h-4 w-4" /> Nueva {T.nota.toLowerCase()}
                </Button>
            </div>

            <AvisoAmbar mensaje={avisoLista} onCerrar={() => setAvisoLista(null)} />

            {/* Filtros (botón Buscar del Access) */}
            <div className="rounded-2xl border bg-card p-3 shadow-md shadow-slate-900/5 sm:p-4 dark:shadow-black/30">
                <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[9.5rem_9.5rem_minmax(11rem,1fr)_minmax(9rem,0.8fr)_minmax(12rem,1.2fr)_auto] lg:items-end"
                      onSubmit={e => { e.preventDefault(); cargarLista() }}>
                    <Campo label="Desde"><input type="date" className={claseInput} value={desde} onChange={e => setDesde(e.target.value)} /></Campo>
                    <Campo label="Hasta"><input type="date" className={claseInput} value={hasta} onChange={e => setHasta(e.target.value)} /></Campo>
                    <Campo label="Concepto"><Combo items={opConceptos} valor={fConcepto} onCambio={setFConcepto} placeholder="Todos" vaciable /></Campo>
                    <Campo label="Almacén"><Combo items={opAlmacenes} valor={fAlmacen} onCambio={setFAlmacen} placeholder="Todos" vaciable /></Campo>
                    <Campo label="Buscar">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input className={cn(claseInput, 'pl-9')} placeholder={`Número, ${T.persona.toLowerCase()} u observación`} value={buscar} onChange={e => setBuscar(e.target.value)} />
                        </div>
                    </Campo>
                    <Button type="submit" variant="outline" className="h-9" disabled={cargandoLista}>
                        {cargandoLista ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />} Buscar
                    </Button>
                </form>
            </div>

            {/* Listado en tarjetas */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
                <span><b className="text-foreground">{filas.length}</b> nota{filas.length === 1 ? '' : 's'} · clic en una tarjeta para abrirla</span>
                {!esSalida && filas.length > 0 && <span>Costo total del periodo: <b className="font-mono text-foreground">{soles(totalLista)}</b></span>}
            </div>
            {cargandoLista && filas.length === 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl border bg-card shadow-sm" />)}
                </div>
            ) : filas.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card px-6 py-14 text-center text-muted-foreground shadow-sm">
                    <ClipboardList className="h-9 w-9 opacity-50" />
                    <p className="font-medium text-foreground">No hay notas con esos filtros</p>
                    <p className="text-sm">Cambia el rango de fechas o crea una {T.nota.toLowerCase()} nueva.</p>
                </div>
            ) : (
                <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3", cargandoLista && "opacity-60")}>
                    {filas.map((f, i) => {
                        const transf = f.Transferencia === '1'
                        return (
                            <button key={f.Codigo_Mvto} type="button" onClick={() => abrir(f.Codigo_Mvto)}
                                    style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                                    className={cn(
                                        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-md shadow-slate-900/5 transition-all duration-200 animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both",
                                        "hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-600/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 dark:shadow-black/30 dark:hover:border-blue-700 dark:hover:shadow-blue-900/30",
                                    )}>
                                {/* franja de color arriba */}
                                <span className={cn("h-1.5 w-full bg-gradient-to-r", transf ? "from-indigo-500 via-violet-500 to-fuchsia-500" : esSalida ? "from-orange-500 to-rose-500" : "from-emerald-500 to-teal-500")} />
                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform duration-200 group-hover:scale-110",
                                                transf ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-600/30" : esSalida ? "bg-gradient-to-br from-orange-500 to-rose-500 shadow-orange-600/30" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-600/30")}>
                                                {transf ? <ArrowRightLeft className="h-5 w-5" /> : <IconoTipo className="h-5 w-5" />}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-mono text-base font-bold leading-tight text-blue-700 dark:text-blue-300">{f.Serie_Doc}-{f.Nro_Doc}</p>
                                                <p className="text-[11px] text-muted-foreground">{f.Codigo_Doc} · {dmy(f.Fecha_Mvto)}</p>
                                            </div>
                                        </div>
                                        {abriendo === f.Codigo_Mvto
                                            ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                                            : <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{f.Items ?? f.Lineas} ítem{(f.Items ?? f.Lineas) === 1 ? '' : 's'}</span>}
                                    </div>

                                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{f.Operacion}</p>

                                    <div className="space-y-1.5 text-xs text-muted-foreground">
                                        <p className="flex items-center gap-1.5 truncate"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{f.Proveedor ?? f.Cliente}</span></p>
                                        <p className="flex items-center gap-1.5">
                                            <Warehouse className="h-3.5 w-3.5 shrink-0" /> {f.Almacen}
                                            {transf && <><ArrowRightLeft className="mx-0.5 h-3 w-3 text-indigo-500" /><span className="font-medium text-indigo-600 dark:text-indigo-300">{f.AlmacenesDestino ?? 'Otro almacén'}</span></>}
                                        </p>
                                        {f.Glosa && <p className="flex items-start gap-1.5"><MessageSquareText className="mt-px h-3.5 w-3.5 shrink-0" /><span className="line-clamp-1">{f.Glosa}</span></p>}
                                    </div>

                                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-dashed pt-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cantidad</p>
                                            <p className="font-mono text-sm font-bold">{fmt(f.CantidadTotal)}</p>
                                        </div>
                                        {!esSalida ? (
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Costo total</p>
                                                <p className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">{soles(f.CostoTotal)}</p>
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-blue-300">Abrir <ChevronRight className="h-3.5 w-3.5" /></span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Modal de la nota */}
            <Dialog open={abierta} onOpenChange={o => { if (!o) intentarCerrar() }}>
                {cab && cat && (
                    <DialogContent ref={refSacudir} className="flex max-h-[94vh] max-w-6xl flex-col gap-0 overflow-hidden p-0"
                                   closeClassName="text-white opacity-90 hover:opacity-100 z-10">
                        <DialogHeader className="shrink-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-4 text-left text-white sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pr-8 text-[11px] text-blue-100">
                                <p className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.18em]"><IconoTipo className="h-3.5 w-3.5" /> {cab.id ? T.nota : `${T.nota} nueva`}</p>
                                <p className="text-right">{EMPRESA.nombre} · {ahora.getFullYear()} · {format(ahora, "EEEE, d 'de' MMMM 'de' yyyy · HH:mm", { locale: es })}</p>
                            </div>
                            <DialogTitle className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pr-8 text-xl font-bold">
                                <span className="font-mono tracking-wider">{cab.serie || '—'}-{cab.numero || '…'}</span>
                                {esTransferencia && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold"><ArrowRightLeft className="h-3.5 w-3.5" /> Transferencia entre almacenes</span>}
                                {(bloqueada || fechaCerrada) && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-semibold text-amber-950"><Lock className="h-3 w-3" /> Periodo cerrado</span>}
                                {sucio && !guardando && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">Cambios sin guardar</span>}
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-xs text-blue-100">
                                {cab.id ? `${concepto?.Operacion ?? ''} · ${dmy(cab.fecha)}` : 'Los campos con (*) son obligatorios. El número lo asigna el sistema al guardar (puedes cambiarlo).'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 px-3 py-4 sm:px-5">
                            {exito && (
                                <AvisoExito onCerrar={() => setExito(null)} mensaje={
                                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        {exito.texto}
                                        {exito.id ? <>
                                            <button type="button" className="text-xs font-semibold underline underline-offset-2" onClick={() => abrir(exito.id!)}>Abrir nota guardada</button>
                                            <button type="button" className="text-xs font-semibold underline underline-offset-2" onClick={() => imprimir(exito.id)}>Imprimir</button>
                                        </> : null}
                                    </span>
                                } />
                            )}
                            <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso(null)} />
                            {(bloqueada || fechaCerrada) && (
                                <AvisoAmbar mensaje={<span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 shrink-0" /> {MSG_CIERRE} (cierre contable {dmy(cat.fechaCierre)}).{bloqueada ? ' La nota se muestra solo para consulta.' : ''}</span>} />
                            )}

                            <fieldset disabled={soloLectura} className="min-w-0 space-y-3">
                                <Seccion titulo="Datos de la nota">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                                        <Campo label="Fecha" obligatorio className="lg:col-span-2">
                                            <input type="date" className={cn(claseInput, err('fecha') && 'almacen-campo-error')} value={cab.fecha} onChange={e => set({ fecha: e.target.value })} />
                                        </Campo>
                                        <Campo label={T.concepto} obligatorio className="lg:col-span-4">
                                            <div className={cn('rounded-md', err('concepto') && 'almacen-campo-error ring-1 ring-amber-400')}><Combo items={opConceptos} valor={cab.concepto} onCambio={v => set({ concepto: v })} placeholder="Elige el concepto" disabled={soloLectura} /></div>
                                        </Campo>
                                        <Campo label="Documento" obligatorio className="lg:col-span-3">
                                            <div className={cn('rounded-md', err('documento') && 'almacen-campo-error ring-1 ring-amber-400')}><Combo items={opDocumentos} valor={cab.documento} onCambio={v => set({ documento: v })} disabled={soloLectura} /></div>
                                        </Campo>
                                        <Campo label="Serie" obligatorio className="lg:col-span-1">
                                            <input list={`series-${tipo}`} maxLength={8} className={cn(claseInput, 'font-mono uppercase', err('serie') && 'almacen-campo-error')} value={cab.serie}
                                                   onChange={e => set({ serie: e.target.value.toUpperCase() })} />
                                            <datalist id={`series-${tipo}`}>{cat.series.map(s => <option key={s.Serie_Doc} value={s.Serie_Doc} />)}</datalist>
                                        </Campo>
                                        <Campo label="Número" className="lg:col-span-2" ayuda={cab.id ? undefined : numeroManual.current ? 'Escrito a mano' : 'Sugerido'}>
                                            <input inputMode="numeric" className={cn(claseInput, 'text-right font-mono')} value={cab.numero}
                                                   onChange={e => { numeroManual.current = true; set({ numero: e.target.value.replace(/\D/g, '') }) }} />
                                        </Campo>
                                        <Campo label={T.persona} obligatorio className="lg:col-span-6">
                                            <BuscadorRemoto<PersonaAlmacen>
                                                etiqueta={T.persona.toLowerCase()} placeholder={`Buscar ${T.persona.toLowerCase()}`} icono={esSalida ? User : Building2}
                                                descripcion="Por RUC / DNI o razón social" error={err('persona')} disabled={soloLectura}
                                                valor={cab.persona ? cab.personaNombre : ''} subValor={cab.persona ? `${cab.persona}${cab.personaRel ? ` · ${cab.personaRel}` : ''}` : undefined}
                                                buscar={q => AlmacenService.personas(tipo, q)} getKey={p => p.Codigo}
                                                getLabel={p => (p.Nombre || '').trim()}
                                                getSub={p => [p.RUC || p.Codigo, (p.NombreComercial || '').trim()].filter(Boolean).join(' · ')}
                                                getExtra={p => (p.RelacionDescripcion || p.Relacion || '').trim()}
                                                onElegir={p => set({ persona: p.Codigo, personaNombre: (p.Nombre || '').trim(), personaRel: (p.RelacionDescripcion || p.Relacion || '').trim() })} />
                                        </Campo>
                                        <Campo label={esTransferencia ? 'Almacén de origen' : 'Almacén'} obligatorio className={esSalida && conUnidadCosto ? 'lg:col-span-2' : 'lg:col-span-3'}>
                                            <div className={cn('rounded-md', err('almacen') && 'almacen-campo-error ring-1 ring-amber-400')}><Combo items={opAlmacenes} valor={cab.almacen} onCambio={v => set({ almacen: v })} placeholder="Elige el almacén" disabled={soloLectura} /></div>
                                        </Campo>
                                        {esSalida && conUnidadCosto && (
                                            <Campo label="UndCosto Transferencia" className="lg:col-span-2">
                                                <Combo items={opGalpones} valor={cab.undCosto} onCambio={v => set({ undCosto: v })} vaciable disabled={soloLectura} />
                                            </Campo>
                                        )}
                                        <Campo label="Observaciones" className={esSalida && conUnidadCosto ? 'lg:col-span-2' : 'lg:col-span-3'}>
                                            <input className={claseInput} maxLength={255} value={cab.observaciones} onChange={e => set({ observaciones: e.target.value })} placeholder="Opcional" />
                                        </Campo>
                                    </div>
                                </Seccion>

                                <Seccion titulo="Artículos" ayuda={esSalida
                                    ? 'El lote sugiere los que tienen saldo en el almacén de origen; si la cantidad (sumando las filas del mismo lote) lo supera se avisa, pero se puede grabar (igual que en Access). Marca E para eliminar filas; la X quita una fila aún no guardada.'
                                    : 'Las filas sin artículo no se guardan. Marca E para eliminar filas; la X quita una fila aún no guardada.'}>
                                    <div className="overflow-x-auto rounded-lg border bg-background">
                                        <table className="w-full min-w-[60rem] text-sm">
                                            <thead className="border-b bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                                                {esSalida ? (
                                                    <tr>
                                                        <th className="w-14 px-2 py-2 text-center" title="Marcar para eliminar">E</th>
                                                        <th className="px-2 py-2">Artículo</th>
                                                        <th className="w-48 px-2 py-2">Lote</th>
                                                        <th className="w-28 px-2 py-2 text-right">Cantidad</th>
                                                        <th className="w-48 px-2 py-2">Centro costos</th>
                                                        {conUnidadCosto && <th className="w-40 px-2 py-2">Und costo</th>}
                                                        {esTransferencia && <th className="w-44 px-2 py-2">Almacén transferencia</th>}
                                                    </tr>
                                                ) : (
                                                    <tr>
                                                        <th className="w-14 px-2 py-2 text-center" title="Marcar para eliminar">E</th>
                                                        <th className="w-28 px-2 py-2 text-right">Cantidad</th>
                                                        <th className="px-2 py-2">Artículo</th>
                                                        {conUnidadCosto && <th className="w-40 px-2 py-2">Unidad costo</th>}
                                                        <th className="w-36 px-2 py-2 text-right">Costo total</th>
                                                        <th className="w-32 px-2 py-2">Lote</th>
                                                        <th className="w-40 px-2 py-2">Fecha vcto.</th>
                                                        <th className="w-48 px-2 py-2">Centro costos</th>
                                                    </tr>
                                                )}
                                            </thead>
                                            <tbody className="divide-y">
                                                {lineas.map((l, i) => {
                                                    if (esSalida) {
                                                        const lotesArt = l.codigoArt ? lotes[claveLotes(l.codigoArt)] : undefined
                                                        const saldo = lotesArt?.find(x => x.Lote === l.lote)?.SumaDeSaldo
                                                        const excede = saldo !== undefined && (pedidoPorLote.get(`${l.codigoArt}|${l.lote}`) ?? 0) > Number(saldo)
                                                        return (
                                                            <tr key={l.clave} className={cn("align-top transition-colors animate-in fade-in-0", l.marcada && "bg-red-50/70 dark:bg-red-950/20")}>
                                                                {celdaE(l, i)}
                                                                {celdaArticulo(l)}
                                                                <td className="px-2 py-1.5">
                                                                    <input list={`lotes-${l.clave}`} className={cn(claseInput, 'font-mono')} value={l.lote} placeholder={lotesArt?.length ? 'Elige o escribe' : 'Lote'}
                                                                           onChange={e => cambiar(l.clave, { lote: e.target.value })} />
                                                                    <datalist id={`lotes-${l.clave}`}>
                                                                        {(lotesArt ?? []).map(x => <option key={x.Lote} value={x.Lote}>{`Saldo ${fmt(x.SumaDeSaldo)}${x.MinVctoItem ? ' · vence ' + dmy(x.MinVctoItem) : ''}`}</option>)}
                                                                    </datalist>
                                                                    {saldo !== undefined && <span className="mt-0.5 block text-[10px] text-muted-foreground">Saldo del lote: {fmt(saldo)}</span>}
                                                                </td>
                                                                {celdaCantidad(l, excede)}
                                                                {celdaCentro(l)}
                                                                {celdaGalpon(l)}
                                                                {esTransferencia && (
                                                                    <td className="px-2 py-1.5">
                                                                        <div className={cn('rounded-md', err(`${l.clave}:almacenDestino`) && 'almacen-campo-error ring-1 ring-amber-400')}>
                                                                            <Combo items={opAlmacenes.filter(a => a.id !== cab.almacen)} valor={l.almacenDestino} onCambio={v => cambiar(l.clave, { almacenDestino: v })} placeholder="Destino" disabled={soloLectura} />
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        )
                                                    }
                                                    return (
                                                        <tr key={l.clave} className={cn("align-top transition-colors animate-in fade-in-0", l.marcada && "bg-red-50/70 dark:bg-red-950/20")}>
                                                            {celdaE(l, i)}
                                                            {celdaCantidad(l)}
                                                            {celdaArticulo(l)}
                                                            {celdaGalpon(l)}
                                                            <td className="px-2 py-1.5">
                                                                <div className="relative">
                                                                    <span className="pointer-events-none absolute left-2.5 top-2 text-sm text-muted-foreground">S/</span>
                                                                    <input inputMode="decimal" className={cn(claseInput, 'pl-8 text-right font-mono')} value={l.costoTotal}
                                                                           onChange={e => cambiar(l.clave, { costoTotal: e.target.value.replace(/[^\d.]/g, '') })} />
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-1.5"><input className={cn(claseInput, 'font-mono')} value={l.lote} onChange={e => cambiar(l.clave, { lote: e.target.value })} /></td>
                                                            <td className="px-2 py-1.5"><input type="date" className={claseInput} value={l.fechaVcto} onChange={e => cambiar(l.clave, { fechaVcto: e.target.value })} /></td>
                                                            {celdaCentro(l)}
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                            <tfoot className="border-t bg-muted/40 text-sm">
                                                {esSalida ? (
                                                    <tr>
                                                        <td colSpan={3} className="px-2 py-2">{botonAgregar}</td>
                                                        <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(totales.cantidad)}</td>
                                                        <td colSpan={9} />
                                                    </tr>
                                                ) : (
                                                    <tr>
                                                        <td className="px-2 py-2" />
                                                        <td className="px-2 py-2 text-right font-mono font-semibold">{fmt(totales.cantidad)}</td>
                                                        <td className="px-2 py-2">{botonAgregar}</td>
                                                        {conUnidadCosto && <td />}
                                                        <td className="whitespace-nowrap px-2 py-2 text-right font-mono font-semibold">{soles(totales.costo)}</td>
                                                        <td colSpan={3} />
                                                    </tr>
                                                )}
                                            </tfoot>
                                        </table>
                                    </div>
                                </Seccion>
                            </fieldset>
                        </div>

                        {/* Botones abajo (estilo Contabilidad) */}
                        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="flex flex-wrap gap-1.5">
                                <Button variant="ghost" disabled={guardando || soloLectura} onClick={abrirBienes} title="Crear un artículo (Access: BienesServicios)">
                                    <Boxes className="mr-2 h-4 w-4" /> Bienes y Servicios
                                </Button>
                                <Button variant="ghost" disabled={guardando || soloLectura} onClick={abrirPersonas} title="Crear un proveedor / cliente (Access: PersonasEmpresas)">
                                    <Contact className="mr-2 h-4 w-4" /> Personas y Empresas
                                </Button>
                                <span className="mx-1 hidden w-px self-stretch bg-border sm:block" />
                                <Button variant="ghost" disabled={guardando || soloLectura || marcadas === 0} onClick={pedirEliminarFilas} title="Access: EliminaDetalle">
                                    <ListX className="mr-2 h-4 w-4" /> Eliminar filas marcadas{marcadas ? ` (${marcadas})` : ''}
                                </Button>
                                {cab.id && <Button variant="ghost" disabled={guardando} onClick={() => imprimir()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>}
                                {cab.id && sucio && (
                                    <Button variant="ghost" disabled={guardando} title="Descartar los cambios y volver a leer la nota guardada"
                                            onClick={() => cargarNota(cab.id!).then(() => { setAviso(null); setExito(null); setErrores(new Set()) })}>
                                        <RotateCcw className="mr-2 h-4 w-4" /> Deshacer cambios
                                    </Button>
                                )}
                                {cab.id && (
                                    <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40" disabled={guardando || soloLectura} onClick={() => setConfirmar('nota')} title="Access: EliminarRegistro">
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar nota
                                    </Button>
                                )}
                            </div>
                            <div className="flex w-full gap-2 sm:w-auto">
                                <Button variant="outline" className="flex-1 sm:flex-none" disabled={guardando} onClick={intentarCerrar}>Cerrar</Button>
                                <Button variant="outline" className="flex-1 sm:flex-none" disabled={guardando} onClick={intentarNueva} title="Access: Actualiza (registro nuevo)"><FilePlus2 className="mr-2 h-4 w-4" /> Nueva</Button>
                                <Button disabled={guardando || soloLectura || fechaCerrada} onClick={guardar}
                                        className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-indigo-700 sm:flex-none">
                                    {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {guardando ? 'Guardando…' : cab.id ? 'Guardar cambios' : 'Guardar nota'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            <FichaArticuloDialog abierta={fichaArt} ficha={fichaArtVacia} fila={null} catalogos={catArt} listas={LISTAS_VACIAS}
                                 onCerrar={() => setFichaArt(false)} onCambio={() => {}} animado onGuardado={usarArticuloNuevo} />
            <FichaPersonaDialog abierta={fichaPer} ficha={fichaPerVacia} catalogos={catPer}
                                onCerrar={() => setFichaPer(false)} onCambio={() => {}} animado onGuardado={usarPersonaNueva} />

            <Confirmar abierto={confirmar === 'cerrar' || confirmar === 'nueva'} titulo={MSG_TERMINE} textoAccion="Descartar cambios" peligro
                       descripcion="La nota tiene cambios sin guardar. Vuelve y pulsa Guardar, o descártalos."
                       onCancelar={() => setConfirmar(null)}
                       onAceptar={() => { const q = confirmar; setConfirmar(null); if (q === 'nueva') nueva(); else setAbierta(false) }} />
            <ConfirmarEliminacion abierto={confirmar === 'nota'} textoAccion="Eliminar nota"
                       titulo={`¿Eliminar la ${T.nota.toLowerCase()} ${cab?.serie}-${cab?.numero}?`}
                       descripcion={`Se borran la nota, sus ${lineas.filter(l => l.id).length} línea(s) y sus movimientos de kardex${esSalida ? '' : ' y lotes'}.`}
                       detalle={lineas.filter(l => l.id).map(l => `${l.cantidad} × ${l.articulo}${l.lote ? ` · lote ${l.lote}` : ''}`)}
                       onCancelar={() => setConfirmar(null)} onAceptar={eliminar} />
            <ConfirmarEliminacion abierto={confirmar === 'filas'} textoAccion="Eliminar filas"
                       titulo={`¿Eliminar ${marcadas} fila${marcadas === 1 ? '' : 's'} marcada${marcadas === 1 ? '' : 's'}?`}
                       descripcion={lineas.some(l => l.marcada && l.id) ? 'Las filas guardadas se borran de la nota y se recalcula su kardex; las nuevas solo se quitan de la pantalla.' : 'Estas filas aún no están guardadas: solo se quitan de la pantalla.'}
                       detalle={lineas.filter(l => l.marcada).map(l => `${l.cantidad || 0} × ${l.articulo || '(sin artículo)'}${l.lote ? ` · lote ${l.lote}` : ''}${l.id ? '' : ' (nueva)'}`)}
                       onCancelar={() => setConfirmar(null)} onAceptar={eliminar} />
            <ConfirmarEliminacion abierto={!!confirmar?.startsWith('fila:')} textoAccion="Quitar fila"
                       titulo="¿Quitar esta fila?" descripcion="La fila aún no está guardada; se quita de la pantalla."
                       detalle={lineas.filter(l => `fila:${l.clave}` === confirmar).map(l => `${l.cantidad || 0} × ${l.articulo || '(sin artículo)'}`)}
                       onCancelar={() => setConfirmar(null)} onAceptar={eliminar} />

            <PdfVistaPreviaDialog abierto={!!pdfFilas} onCerrar={() => setPdfFilas(null)}
                                  titulo={`${T.nota} ${pdfFilas?.[0]?.Documento ?? ''}`}
                                  defecto={{ titulo: T.informe, nota: '', color: '#163161', tamanoLetra: 'normal' } as OpcionesPdfReporte}
                                  archivoDefecto={`${esSalida ? 'Nota-Salida' : 'Nota-Ingreso'}-${String(pdfFilas?.[0]?.Documento ?? '').replace(/[^\w-]+/g, '')}`}
                                  generar={(op) => generarPdfNotaAlmacen(pdfFilas ?? [], esSalida, op)} />
        </div>
    )
}
