export interface RegistroVentaFila {
    idComprobanteCab:      number
    nroPedido:             number | null
    fecha_emision:         string
    tipo_cpe:              string
    serie:                 string
    numero:                string
    documento:             string
    cliente_numdoc:        string | null
    cliente_denominacion:  string | null
    moneda:                number | null
    codigo_hash:           string | null
    codigo_vendedor:       string | null
    vendedor:              string | null
    dias_credito:          number | string | null
    condicion_credito:     string | null
    condicion_descripcion: string | null
    anulado:               number
    empresa_razon_social:  string | null
    empresa_ruc:           string | null
    codigo_articulo:       string
    producto:              string
    unidad:                string
    cantidad:              number | string
    precio_unitario:       number | string
    no_afecto:             number | string
    afecto:                number | string
    igv:                   number | string
    total:                 number | string
}

export interface RegistroVentaLinea {
    codigo_articulo: string
    producto:        string
    unidad:          string
    cantidad:        number
    precio_unitario: number
    no_afecto:       number
    afecto:          number
    igv:             number
    total:           number
}

export interface RegistroVentaComprobante {
    idComprobanteCab:      number
    fecha_emision:         string
    tipo_cpe:              string
    serie:                 string
    numero:                string
    documento:             string
    cliente_numdoc:        string
    cliente_denominacion:  string
    codigo_hash:           string
    codigo_vendedor:       string
    vendedor:              string
    dias_credito:          number
    condicion_descripcion: string
    anulado:               boolean
    lineas:                RegistroVentaLinea[]
    no_afecto:             number
    afecto:                number
    igv:                   number
    total:                 number
}

export interface RegistroVentaAgrupado {
    empresa: { razonSocial: string; ruc: string }
    comprobantes: RegistroVentaComprobante[]
    totales: { no_afecto: number; afecto: number; igv: number; total: number }
}

const num = (valor: unknown): number => {
    const n = Number(valor)
    return isNaN(n) ? 0 : n
}

const texto = (valor: unknown): string => (valor == null ? '' : String(valor))

export function agruparRegistroVentas(filas: RegistroVentaFila[]): RegistroVentaAgrupado {
    const porComprobante = new Map<number, RegistroVentaComprobante>()
    let empresa = { razonSocial: '', ruc: '' }

    for (const fila of filas) {
        if (!empresa.razonSocial && fila.empresa_razon_social) {
            empresa = { razonSocial: fila.empresa_razon_social, ruc: texto(fila.empresa_ruc) }
        }

        let comprobante = porComprobante.get(fila.idComprobanteCab)
        if (!comprobante) {
            comprobante = {
                idComprobanteCab:      fila.idComprobanteCab,
                fecha_emision:         fila.fecha_emision,
                tipo_cpe:              texto(fila.tipo_cpe),
                serie:                 texto(fila.serie),
                numero:                texto(fila.numero),
                documento:             texto(fila.documento),
                cliente_numdoc:        texto(fila.cliente_numdoc),
                cliente_denominacion:  texto(fila.cliente_denominacion),
                codigo_hash:           texto(fila.codigo_hash),
                codigo_vendedor:       texto(fila.codigo_vendedor),
                vendedor:              texto(fila.vendedor),
                dias_credito:          num(fila.dias_credito),
                condicion_descripcion: texto(fila.condicion_descripcion),
                anulado:               num(fila.anulado) === 1,
                lineas:                [],
                no_afecto: 0, afecto: 0, igv: 0, total: 0,
            }
            porComprobante.set(fila.idComprobanteCab, comprobante)
        }

        const linea: RegistroVentaLinea = {
            codigo_articulo: texto(fila.codigo_articulo),
            producto:        texto(fila.producto),
            unidad:          texto(fila.unidad),
            cantidad:        num(fila.cantidad),
            precio_unitario: num(fila.precio_unitario),
            no_afecto:       num(fila.no_afecto),
            afecto:          num(fila.afecto),
            igv:             num(fila.igv),
            total:           num(fila.total),
        }

        comprobante.lineas.push(linea)
        comprobante.no_afecto += linea.no_afecto
        comprobante.afecto    += linea.afecto
        comprobante.igv       += linea.igv
        comprobante.total     += linea.total
    }

    const comprobantes = [...porComprobante.values()]
    const totales = comprobantes.reduce(
        (acumulado, c) => ({
            no_afecto: acumulado.no_afecto + c.no_afecto,
            afecto:    acumulado.afecto    + c.afecto,
            igv:       acumulado.igv       + c.igv,
            total:     acumulado.total     + c.total,
        }),
        { no_afecto: 0, afecto: 0, igv: 0, total: 0 }
    )

    return { empresa, comprobantes, totales }
}

export const fmtMonto = (valor: number): string =>
    Number(valor || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")

export const fmtPrecio = (valor: number): string => Number(valor || 0).toFixed(4)

export const fmtCantidad = (valor: number): string => {
    const n = Number(valor || 0)
    return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export const fmtFechaCorta = (fecha: string): string => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha ?? ''))
    if (!m) return String(fecha ?? '')
    return `${Number(m[3])}/${Number(m[2])}/${m[1]}`
}

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const tituloPeriodo = (desde: Date, hasta: Date): string => {
    const mismoMes = desde.getFullYear() === hasta.getFullYear()
        && desde.getMonth() === hasta.getMonth()

    if (mismoMes) return `${MESES[desde.getMonth() + 1]} del ${desde.getFullYear()}`

    const f = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    return `${f(desde)} al ${f(hasta)}`
}

export const etiquetaTipo = (tipo: string): string =>
    tipo === '01' ? 'Factura' : tipo === '03' ? 'Boleta' : tipo
