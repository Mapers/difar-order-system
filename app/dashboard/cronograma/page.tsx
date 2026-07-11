'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { format } from "date-fns"
import apiClient from "@/app/api/client"
import { useAuth } from "@/context/authContext"
import { toast } from "@/app/hooks/useToast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ComprobantePdfModal } from "@/app/dashboard/comprobantes/modals/ComprobantePdfModal"
import { CronogramaSummary } from "./CronogramaSummary"
import { CronogramaCalendar } from "./CronogramaCalendar"
import { CronogramaClientView } from "./CronogramaClientView"
import { ComprobanteDetailModal } from "./ComprobanteDetailModal"
import {
  CronogramaComprobante, EstadoVencimiento,
  MESES, estadoDe, estadoLabel, fmtSoles, montoDe, parseFechaLocal, tipoDoc,
  ESTADO_BADGE, truncarDia,
} from "./lib/cronograma-utils"

export default function CronogramaPage() {
  const auth = useAuth()
  const hoy = useMemo(() => truncarDia(new Date()), [])

  const [current, setCurrent] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [raw, setRaw] = useState<CronogramaComprobante[]>([])
  const [loading, setLoading] = useState(false)

  const [activeView, setActiveView] = useState<'calendar' | 'client'>('calendar')
  const [filterVendedor, setFilterVendedor] = useState('todos')
  const [filterTipo, setFilterTipo] = useState<'todos' | 'factura' | 'boleta'>('todos')

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ cliente: string; day: number } | null>(null)
  const [detail, setDetail] = useState<CronogramaComprobante | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfNumero, setPdfNumero] = useState('')

  const [clientSearch, setClientSearch] = useState('')
  const [clientSort, setClientSort] = useState<'urgencia' | 'monto' | 'nombre'>('urgencia')

  const year = current.getFullYear()
  const month = current.getMonth()

  // Cargar por rango de VENCIMIENTO = mes visible (el SP filtra por vencimiento
  // usando raw_request -> FEC_VENCIMIENTO; internamente acota la emisión).
  const fetchData = useCallback(async () => {
    const desde = new Date(year, month, 1)
    const hasta = new Date(year, month + 1, 0)
    const params = new URLSearchParams()
    params.append('fechaDesde', format(desde, 'yyyy-MM-dd'))
    params.append('fechaHasta', format(hasta, 'yyyy-MM-dd'))
    if (auth.isVendedor()) params.append('vendedor', auth.user?.codigo || '')
    if (auth.isRepresentante()) params.append('representante', auth.user?.codRepres || '')

    try {
      setLoading(true)
      const res = await apiClient.get(`/pedidos/cronograma?${params.toString()}`)
      const data = (res.data?.data?.data ?? []) as CronogramaComprobante[]
      setRaw(Array.isArray(data) ? data.filter(c => !c.anulado) : [])
    } catch (error) {
      console.error("Error fetching cronograma:", error)
      toast({ title: "Error", description: "No se pudieron cargar los comprobantes", variant: "destructive" })
      setRaw([])
    } finally {
      setLoading(false)
    }
  }, [year, month, auth.user?.codigo, auth.user?.codRepres, auth.user?.rolDescripcion])

  useEffect(() => { fetchData() }, [fetchData])

  // Reiniciar selección al cambiar de mes
  useEffect(() => {
    setSelectedDay(null)
    setSelectedCell(null)
  }, [year, month, filterVendedor, filterTipo])

  // Comprobantes cuyo VENCIMIENTO cae dentro del mes visible + filtros de vendedor/tipo
  const visibles = useMemo(() => {
    return raw.filter(c => {
      const v = parseFechaLocal(c.fecha_vencimiento)
      if (!v || v.getFullYear() !== year || v.getMonth() !== month) return false
      if (filterVendedor !== 'todos' && (c.Vendedor ?? '') !== filterVendedor) return false
      if (filterTipo !== 'todos' && tipoDoc(c) !== filterTipo) return false
      return true
    })
  }, [raw, year, month, filterVendedor, filterTipo])

  const vendedores = useMemo(() => {
    const set = new Set<string>()
    raw.forEach(c => { if (c.Vendedor) set.add(c.Vendedor) })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [raw])

  const abrirComprobante = (c: CronogramaComprobante) => {
    setDetail(c)
    setDetailOpen(true)
  }

  const verPdf = () => {
    if (!detail) return
    const numero = `${detail.serie}-${detail.numero}`
    // Cerramos el modal de detalle y abrimos el visor DESPUÉS de que termine de
    // cerrar. Abrir un segundo Dialog (Radix) mientras el primero aún se cierra
    // deja el body con pointer-events:none y el visor queda "congelado".
    setDetailOpen(false)
    setTimeout(() => {
      setPdfNumero(numero)
      setPdfOpen(true)
    }, 200)
  }

  const delDiaSeleccionado = selectedDay
    ? visibles
        .filter(c => parseFechaLocal(c.fecha_vencimiento)?.getDate() === selectedDay)
        .sort((a, b) => montoDe(a) - montoDe(b))
    : []

  const delCeldaSeleccionada = selectedCell
    ? visibles.filter(c =>
        (c.cliente_denominacion ?? 'Sin cliente') === selectedCell.cliente &&
        parseFechaLocal(c.fecha_vencimiento)?.getDate() === selectedCell.day)
    : []

  const detalleLista = activeView === 'calendar' ? delDiaSeleccionado : delCeldaSeleccionada
  const detalleTitulo = activeView === 'calendar'
    ? (selectedDay ? new Date(year, month, selectedDay).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '')
    : (selectedCell ? `${selectedCell.cliente} · ${new Date(year, month, selectedCell.day).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' })}` : '')

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-blue-600 dark:text-blue-400">DIFAR · Cuentas por Cobrar</p>
          <h1 className="text-2xl font-bold tracking-tight">Calendario de Vencimientos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeView === 'calendar'
              ? 'Facturas y boletas organizadas por fecha de vencimiento'
              : 'Cronograma de vencimientos por cliente a lo largo del mes'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterVendedor} onValueChange={setFilterVendedor}>
            <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Vendedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Vendedor: Todos</SelectItem>
              {vendedores.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterTipo} onValueChange={(v) => setFilterTipo(v as typeof filterTipo)}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Tipo: Todos</SelectItem>
              <SelectItem value="factura">Facturas</SelectItem>
              <SelectItem value="boleta">Boletas</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'calendar' | 'client')}>
            <TabsList>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="client">Cronograma por cliente</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrent(new Date(year, month - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-semibold capitalize">{MESES[month]} {year}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrent(new Date(year, month + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CronogramaSummary comprobantes={visibles} hoy={hoy} />

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Vencida</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Por vencer (≤ 7 días)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Vigente</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando comprobantes…
        </div>
      )}

      {!loading && activeView === 'calendar' && (
        <>
          <CronogramaCalendar
            year={year} month={month} comprobantes={visibles} hoy={hoy}
            selectedDay={selectedDay}
            onSelectDay={(d) => setSelectedDay(d)}
            onSelectComprobante={abrirComprobante}
          />
          <DetalleDia titulo={detalleTitulo} lista={detalleLista} hoy={hoy} onOpen={abrirComprobante} vacio="Selecciona un día o una factura del calendario para ver el detalle." />
        </>
      )}

      {!loading && activeView === 'client' && (
        <>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Buscar cliente…" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="max-w-xs" />
            <Select value={clientSort} onValueChange={(v) => setClientSort(v as typeof clientSort)}>
              <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="urgencia">Ordenar: vencimiento más próximo</SelectItem>
                <SelectItem value="monto">Ordenar: mayor deuda</SelectItem>
                <SelectItem value="nombre">Ordenar: nombre A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CronogramaClientView
            year={year} month={month} comprobantes={visibles} hoy={hoy}
            search={clientSearch} sort={clientSort}
            selectedCell={selectedCell}
            onSelectCell={(cliente, day) => setSelectedCell({ cliente, day })}
          />
          <DetalleDia titulo={detalleTitulo} lista={detalleLista} hoy={hoy} onOpen={abrirComprobante} vacio="Haz clic en una celda del cronograma para ver el detalle." />
        </>
      )}

      <ComprobanteDetailModal
        comprobante={detail} open={detailOpen} onOpenChange={setDetailOpen} hoy={hoy} onVerPdf={verPdf}
      />
      <ComprobantePdfModal open={pdfOpen} onOpenChange={setPdfOpen} numeroComprobante={pdfNumero} fileName={`${pdfNumero}.pdf`} />
    </div>
  )
}

// --- Tabla de detalle (día o celda seleccionada) ---
function DetalleDia({
  titulo, lista, hoy, onOpen, vacio,
}: {
  titulo: string
  lista: CronogramaComprobante[]
  hoy: Date
  onOpen: (c: CronogramaComprobante) => void
  vacio: string
}) {
  if (!lista.length) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
        {vacio}
      </div>
    )
  }
  const total = lista.reduce((a, c) => a + montoDe(c), 0)
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="text-base font-bold capitalize">{titulo}</div>
        <div className="font-mono text-xs text-muted-foreground">{lista.length} doc. · {fmtSoles(total)}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-1.5 pr-3 font-medium">N° Comprobante</th>
              <th className="py-1.5 pr-3 font-medium">Cliente</th>
              <th className="py-1.5 pr-3 font-medium">Vendedor</th>
              <th className="py-1.5 pr-3 font-medium">Estado</th>
              <th className="py-1.5 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(c => {
              const estado: EstadoVencimiento = estadoDe(parseFechaLocal(c.fecha_vencimiento), hoy)
              return (
                <tr key={`${c.serie}-${c.numero}`} className="cursor-pointer border-t hover:bg-accent/50" onClick={() => onOpen(c)}>
                  <td className="py-2 pr-3 font-mono text-xs">{c.serie}-{c.numero}</td>
                  <td className="py-2 pr-3">{c.cliente_denominacion ?? '—'}</td>
                  <td className="py-2 pr-3">{c.Vendedor ?? '—'}</td>
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${ESTADO_BADGE[estado]}`}>{estadoLabel(estado)}</span>
                  </td>
                  <td className="py-2 text-right font-mono text-xs">{fmtSoles(montoDe(c))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
