/** Tipos del módulo Cobranza de Ventas por Mes (espejo de la API). */

export type Montos = { PEN: number; USD: number }
export type Totales = { cantidad: number; montos: Montos }

export type VistaMes = 'faltante' | 'cobrado'

export interface ComprobanteMes {
    id: number
    comprobante: string
    serie: string
    numero: string
    tipo: string
    pedido: number | null
    emision: string
    vencimiento: string | null
    cliente: string
    nombreComercial: string | null
    ruc: string
    zona: string | null
    direccion: string | null
    codigoVendedor: string
    vendedor: string
    condicion: string
    diasCredito: number
    moneda: 'PEN' | 'USD'
    total: number
    abonado: number
    saldo: number
    diferenciaKardex: number
    estado: 'pagado' | 'deuda'
    parcial: boolean
    diasVencido: number
    diasParaVencer: number | null
    ultimoPago: string | null
    tardo: number | null
    atrasoPago: boolean
    contado: boolean
    formaCobro: string | null
    productos: number
}

export interface ResumenMes {
    ventas: Totales
    cobrado: Totales & { pagados: number; parciales: number }
    faltante: Totales & { vencido: Totales; porVencer: Totales }
    diferenciaKardex: { cantidad: number; monto: number }
    porVendedor: { vendedor: string; codigo: string; cantidad: number; saldo: number }[]
    filtros: Record<VistaMes, Record<string, number>>
}

export interface PagoMes {
    fecha: string | null
    importe: number
    forma: string
    banco: string | null
    planilla: string | null
    operacion: string | null
}

export interface DetalleComprobanteMes {
    comprobante: ComprobanteMes & { pagos: PagoMes[] }
    cliente: {
        razonSocial: string; nombreComercial: string | null; ruc: string; direccion: string | null
        distrito: string | null; zona: string | null; telefono: string | null; correo: string | null
        estado: string | null; vendedorAsignado: string | null
    }
    sucursal: {
        direccionEntrega: string | null; referencia: string | null; contacto: string | null
        telefono: string | null; pedido: number | null; fechaPedido: string | null; almacen: string | null
    }
    credito: { linea: number; usado: number; disponible: number; documentosPendientes: number; estado: string | null } | null
    productos: {
        codigo: string; producto: string; unidad: string; cantidad: number; precio: number; total: number
        lote?: string | null; vencimientoLote?: string | null; laboratorio?: string | null
    }[]
    pagos: PagoMes[]
    guias: string[]
    cuotas: { numero: string; fecha: string; monto: number }[]
    sunat: string | null
}

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/** Filtros rápidos de cada vista (las claves coinciden con el servidor). */
export const FILTROS_VISTA: Record<VistaMes, { valor: string; etiqueta: string }[]> = {
    faltante: [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: 'vencido30', etiqueta: 'Vencido +30 d' },
        { valor: 'vencido', etiqueta: 'Vencido 1-30 d' },
        { valor: 'porVencer', etiqueta: 'Por vencer' },
        { valor: 'parcial', etiqueta: 'Con abono parcial' },
    ],
    cobrado: [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: 'contado', etiqueta: 'Contado' },
        { valor: 'aTiempo', etiqueta: 'Crédito a tiempo' },
        { valor: 'atraso', etiqueta: 'Pagó con atraso' },
    ],
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const soles = (n: number, moneda: 'PEN' | 'USD' = 'PEN') => `${moneda === 'USD' ? 'US$' : 'S/'} ${fmt(n)}`

/** "S/ 1,234.56" y, si hay dólares, " · US$ 10.00". */
export function montos(m: Montos | undefined) {
    if (!m) return '—'
    return m.USD ? `${soles(m.PEN)} · ${soles(m.USD, 'USD')}` : soles(m.PEN)
}

/** Porcentaje de una parte sobre el total (en soles). */
export const porcentaje = (parte: number, total: number) => (total > 0 ? `${((parte / total) * 100).toFixed(1)}%` : '0%')

/** 2026-09-03 → 03/09/2026 */
export const fecha = (f: string | null | undefined) => (f ? f.slice(0, 10).split('-').reverse().join('/') : '—')

export interface GrupoMes {
    nombre: string
    ventas: number
    cobrado: number
    faltante: number
    vencido: number
    comprobantes: number
    avance: number
}

export interface GraficosMes {
    periodo: { anio: number; mes: number; corte: string }
    totales: { ventas: number; cobrado: number; faltante: number; avance: number }
    antiguedad: { clave: string; etiqueta: string; monto: number; cantidad: number }[]
    porVendedor: GrupoMes[]
    porZona: GrupoMes[]
    topClientes: GrupoMes[]
    curva: { fecha: string; ventas: number; cobrado: number; ventasAcum: number; cobradoAcum: number }[]
    conclusiones: { tono: 'bien' | 'atencion' | 'alerta' | 'info'; texto: string }[]
}
