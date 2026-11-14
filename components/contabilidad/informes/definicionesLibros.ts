import { ClaveReporte, ColumnaInforme, DefinicionReporte, FilaInforme, FilaPie, GrupoInforme, ValoresFila } from '@/app/types/informes-contables-types'
import { fmtMonto } from './formato'

/**
 * Definiciones de los informes contables migrados de Access (Informes Contables):
 * Diario, Mayor, InventBalances (estados financieros), CtasContables y los libros electrónicos 5.1 / 5.3 / 6.1.
 * Columnas, cortes y pies como los reportes de Access. Los SP ya devuelven todo calculado;
 * aquí solo se arman los totales del pie (igual que el pie del reporte Access).
 */

type ClaveLibro = Extract<ClaveReporte,
    | 'diario-general' | 'diario-mes' | 'diario-revision-asientos' | 'diario-simplificado'
    | 'mayor-anio' | 'mayor-mes' | 'mayor-resumen-anio' | 'mayor-resumen-principales' | 'mayor-revisa'
    | 'eeff-balance-general' | 'eeff-resultado-mes' | 'eeff-resultado-anual' | 'eeff-resultado-acumulado'
    | 'eeff-comprobacion' | 'eeff-comprobacion-sunat' | 'eeff-comprobacion-mes' | 'eeff-flujo-efectivo' | 'eeff-cambio-patrimonio'
    | 'cuentas-saldos' | 'cuentas-sumas-mayor'
    | 'ple-diario-051' | 'ple-plan-053' | 'ple-mayor-061'>

// ---- utilidades
const c = (campo: string, titulo: string, tipo: ColumnaInforme['tipo'] = 'texto', extra: Partial<ColumnaInforme> = {}): ColumnaInforme =>
    ({ campo, titulo, tipo, ...extra })
/** Importe en soles con total (sin símbolo en cada celda, como Access; la leyenda dice "Expresado en soles"). */
const imp = (campo: string, titulo: string, extra: Partial<ColumnaInforme> = {}) => c(campo, titulo, 'monto', { total: true, moneda: '', ...extra })
/** Importe sin total (saldos corridos, estados financieros). */
const valor = (campo: string, titulo: string, extra: Partial<ColumnaInforme> = {}) => c(campo, titulo, 'monto', { moneda: '', ...extra })
const n = (v: unknown) => Number(v) || 0
/** Redondeo a centavos sin "-0.00". */
const r2 = (x: number) => Math.round(x * 100) / 100 || 0
const suma = (filas: FilaInforme[], campo: string) => r2(filas.reduce((a, f) => a + n(f[campo]), 0))
const soles = (v: number) => `S/ ${fmtMonto(v)}`
const SOLES = 'Expresado en soles (S/)'
const LIBRO = c('LibroContab', 'Libro', 'mono')

/** Cargo, Abono y su diferencia (control de cuadre). */
const kpisCuadre = (cargo = 'Cargo', abono = 'Abono', tCargo = 'Cargo', tAbono = 'Abono') => (filas: FilaInforme[]) => {
    const a = suma(filas, cargo), b = suma(filas, abono)
    return [{ t: tCargo, v: soles(a) }, { t: tAbono, v: soles(b) }, { t: 'Diferencia', v: soles(r2(a - b)) }]
}

// ---------------------------------------------------------------- Libro Diario
const COLS_DIARIO = [LIBRO, c('CtaContable', 'Cuenta', 'mono', { movil: 'titulo' }),
    c('CuentaDescripcion', 'Descripción', 'texto', { movil: 'subtitulo' }), imp('Cargo', 'Cargo', { movil: 'importe' }), imp('Abono', 'Abono')]

/** Corte por glosa ("Glosa:" en Access): Concepto + Libro dentro del mes. */
const GRUPO_GLOSA: GrupoInforme = {
    clave: f => `${f.Mes}|${f.AsientoInicial}|${f.Glosa}|${f.LibroContab}`,
    titulo: f => `Glosa: ${f.Glosa ?? ''}`,
    subtotal: fs => ({ texto: 'Total glosa', valores: { Cargo: suma(fs, 'Cargo'), Abono: suma(fs, 'Abono') } }),
}
const GRUPO_MES: GrupoInforme = { clave: f => String(f.Mes), titulo: f => `${f.MesNombre} ${f.Anio}`, subtotal: true }

/** Diario Simplificado: el SP da una fila por celda (glosa × cuenta); aquí se arma la tabla de Access. */
function pivotearSimplificado(filas: FilaInforme[]) {
    const cuentas = [...new Set(filas.map(f => String(f.Columna)))].sort()
    const fueraDeFormato = new Set(filas.filter(f => Number(f.EnFormatoAccess) === 0).map(f => String(f.Columna)))
    const porGlosa = new Map<string, FilaInforme>()
    for (const f of filas) {
        const k = `${f.Orden}|${f.Glosa}`
        const fila = porGlosa.get(k) ?? { Orden: f.Orden, Glosa: f.Glosa }
        const campo = `c_${f.Columna}`
        fila[campo] = r2(n(fila[campo]) + n(f.Importe))
        porGlosa.set(k, fila)
    }
    const columnas: ColumnaInforme[] = [
        c('Glosa', 'Glosa', 'texto', { movil: 'subtitulo' }),
        ...cuentas.map(k => imp(`c_${k}`, fueraDeFormato.has(k) ? `${k} *` : k)),
    ]
    return { filas: [...porGlosa.values()], columnas }
}

// ---------------------------------------------------------------- Libro Mayor
const COLS_MAYOR = [c('Fecha', 'Fecha', 'fecha', { movil: 'titulo' }), c('Glosa', 'Glosa', 'texto', { movil: 'subtitulo' }),
    imp('Cargo', 'Cargo', { movil: 'importe' }), imp('Abono', 'Abono'), valor('SaldoAcumulado', 'Saldo'), LIBRO]
const COLS_RESUMEN = [c('MesAnio', 'Fecha', 'mono', { movil: 'titulo' }), c('Concepto', 'Concepto', 'texto', { movil: 'subtitulo' }),
    imp('Cargo', 'Cargo', { movil: 'importe' }), imp('Abono', 'Abono'), valor('SaldoAcumulado', 'Saldo'), LIBRO]

/** Corte por cuenta con su total y el saldo final (último saldo corrido). */
const grupoCuenta = (cuenta: string, descripcion: string): GrupoInforme => ({
    clave: f => String(f[cuenta]),
    titulo: f => `${f[cuenta]} ${f[descripcion] ?? '(no existe en el plan)'}`,
    subtotal: fs => ({
        texto: `Total cuenta ${fs[0][cuenta]}`,
        valores: { Cargo: suma(fs, 'Cargo'), Abono: suma(fs, 'Abono'), SaldoAcumulado: n(fs[fs.length - 1].SaldoAcumulado) },
    }),
})

const AYUDA_CUENTA = 'Sin cuenta trae todas (el año completo son ~37 mil líneas): escribe una cuenta o su inicio (10, 101, 1010101) para ver menos.'

// ---------------------------------------------------------------- Estados financieros
const gyp = (clave: ClaveLibro, titulo: string, filtro: 'mes' | 'anio', access: string, descripcion: string): DefinicionReporte => ({
    clave, titulo, filtro, access, descripcion, sinTotal: true, leyenda: SOLES,
    vacio: 'Sin ingresos ni gastos (cuentas con concepto EEFF 6 a 9) en este periodo.',
    columnas: [c('CtaPrincipal', 'Cuenta', 'mono', { movil: 'titulo' }), c('Descripcion', 'Detalle', 'texto', { movil: 'subtitulo' }),
        valor('Importe', 'Importe S/', { movil: 'importe' })],
    // al cerrar cada concepto: la suma corrida con su etiqueta (TOTAL INGRESOS NETOS, UTILIDAD BRUTA...)
    grupos: [{
        clave: f => String(f.ConceptoEEFF), titulo: f => String(f.ConceptoDescripcion ?? ''),
        subtotal: fs => ({ texto: String(fs[0].EtiquetaSubtotal ?? 'Total'), valores: { Importe: n(fs[fs.length - 1].SubtotalAcumulado) } }),
    }],
    kpis: filas => [{ t: 'Resultado', v: soles(n(filas[filas.length - 1].SubtotalAcumulado)) }],
})

const comprobacion = (clave: ClaveLibro, titulo: string, access: string, descripcion: string): DefinicionReporte => ({
    clave, titulo, filtro: 'mes', access, descripcion, leyenda: SOLES, limite: 2000,
    columnas: [c('Cuenta', 'Cuenta', 'mono', { movil: 'titulo' }), c('Descripcion', 'Descripción', 'texto', { movil: 'subtitulo' }),
        imp('DebeSaldoInicial', 'S. Inicial Debe'), imp('HaberSaldoInicial', 'S. Inicial Haber'),
        imp('DebeMvto', 'Movim. Debe'), imp('HaberMvto', 'Movim. Haber'),
        imp('Activo', 'Activo'), imp('Pasivo', 'Pasivo'), imp('Perdida', 'Pérdida'), imp('Ganancia', 'Ganancia')],
    // pie de Access: la diferencia (resultado del ejercicio) en cada pareja y las sumas iguales
    pie: (filas): FilaPie[] => {
        const A = suma(filas, 'Activo'), P = suma(filas, 'Pasivo'), Pe = suma(filas, 'Perdida'), G = suma(filas, 'Ganancia')
        const dA = r2(Math.max(0, P - A)), dP = r2(Math.max(0, A - P)), dPe = r2(Math.max(0, G - Pe)), dG = r2(Math.max(0, Pe - G))
        return [
            { texto: 'Resultado del ejercicio', valores: { Activo: dA, Pasivo: dP, Perdida: dPe, Ganancia: dG } },
            { texto: 'Sumas iguales', valores: { Activo: r2(A + dA), Pasivo: r2(P + dP), Perdida: r2(Pe + dPe), Ganancia: r2(G + dG) }, destacada: true },
        ]
    },
    kpis: kpisCuadre('SumaDebe', 'SumaHaber', 'Suma Debe', 'Suma Haber'),
})

const COLS_PATRIMONIO: [string, string][] = [['Capital50', 'Capital'], ['AccionesInversion51', 'Acciones de Inversión'],
    ['CapitalAdicional52', 'Capital Adicional'], ['ResultadosNoRealizados56', 'Resultados no Realizados'],
    ['ExcedenteRevaluacion57', 'Excedente de Revaluación'], ['Reservas58', 'Reservas'], ['ResultadosAcumulados59', 'Resultados Acumulados']]

const MESES_SUMAS: [string, string][] = [['Ene', 'Ene'], ['Feb', 'Feb'], ['Mar', 'Mar'], ['Abr', 'Abr'], ['May', 'May'], ['Jun', 'Jun'],
    ['Jul', 'Jul'], ['Ago', 'Ago'], ['Sep', 'Set'], ['Oct', 'Oct'], ['Nov', 'Nov'], ['Dic', 'Dic']]

/** Grupo del Saldo de Cuentas: encabezado con las sumas del grupo, como Access. */
const grupoSaldos = (campo: string, descripcion: string): GrupoInforme => ({
    clave: f => String(f[campo] ?? ''),
    titulo: f => `${f[campo] ?? ''} ${f[descripcion] ?? '(no existe en el plan)'}`,
    sumasEnEncabezado: true,
})

// ---------------------------------------------------------------- PLE 5.1 / 5.3 / 6.1 (vista previa de la línea)
/** Campo i (desde 0) de la línea PLE separada por "|". */
const campoLinea = (i: number, titulo: string, tipo: ColumnaInforme['tipo'] = 'mono', extra: Partial<ColumnaInforme> = {}) =>
    c(`_l${i}`, titulo, tipo, { valor: (f: FilaInforme) => String(f.Linea ?? '').split('|')[i] || null, ...extra })
const VISTA_DIARIO_MAYOR = [campoLinea(1, 'CUO', 'mono', { movil: 'titulo' }), c('CtaContable', 'Cuenta', 'mono'), campoLinea(12, 'F. Operación'),
    campoLinea(15, 'Glosa', 'texto', { movil: 'subtitulo' }), imp('Debe', 'Debe', { movil: 'importe' }), imp('Haber', 'Haber')]

export const DEFINICIONES_LIBROS: Record<ClaveLibro, DefinicionReporte> = {
    // ---------------- Libro Diario
    'diario-general': {
        clave: 'diario-general', titulo: 'Diario General', filtro: 'anio', access: 'Diario › DiarioGeneral', leyenda: SOLES, limite: 5000,
        descripcion: 'Libro Diario General del año: una línea por mes, glosa, libro y cuenta, con el total de cada glosa y de cada mes.',
        columnas: COLS_DIARIO, grupos: [GRUPO_MES, GRUPO_GLOSA], kpis: kpisCuadre(),
    },
    'diario-mes': {
        clave: 'diario-mes', titulo: 'Diario Mes', filtro: 'mes', access: 'Diario › DiarioMes', leyenda: SOLES, limite: 5000,
        descripcion: 'Libro Diario del mes con el total de cada glosa, lo que viene del mes anterior y el total acumulado.',
        columnas: COLS_DIARIO, grupos: [GRUPO_GLOSA], kpis: kpisCuadre(),
        pie: (filas, ctx) => {
            if (ctx.mes === '01') return []   // enero: no viene nada (Access deja el pie vacío)
            const vc = n(filas[0].VieneCargo), va = n(filas[0].VieneAbono)
            return [
                { texto: 'Vienen Mes Anterior', valores: { Cargo: vc, Abono: va } },
                { texto: ctx.mes === '12' ? '-- Total Acumulado --' : 'Total Acumulado',
                    valores: { Cargo: r2(vc + suma(filas, 'Cargo')), Abono: r2(va + suma(filas, 'Abono')) }, destacada: true },
            ]
        },
    },
    'diario-revision-asientos': {
        clave: 'diario-revision-asientos', titulo: 'Revisión Asientos', filtro: 'anio', access: 'Diario › RevisionAsientos', leyenda: SOLES,
        descripcion: 'Asientos que NO cuadran (cargo distinto de abono) en el año. Asiento = mes + glosa + libro.',
        vacio: 'Todos los asientos del año cuadran (cargo = abono).',
        columnas: [LIBRO, c('Glosa', 'Glosa', 'texto', { movil: 'subtitulo' }), imp('Cargo', 'Cargo'), imp('Abono', 'Abono'),
            imp('Saldo', 'Diferencia', { movil: 'importe' })],
        grupos: [GRUPO_MES],
    },
    'diario-simplificado': {
        clave: 'diario-simplificado', titulo: 'Diario Simplificado', filtro: 'mes', access: 'Diario › DiarioSimplificado', leyenda: SOLES,
        descripcion: 'Libro Diario de formato simplificado: una fila por glosa y una columna por cuenta (solo las cuentas con movimiento). '
            + 'Clases 1, 2, 3, 6 y 9 = cargo − abono; 4, 5, 7 y 8 = abono − cargo. Una cuenta con * no existe en el formato de Access.',
        columnas: [c('Glosa', 'Glosa', 'texto', { movil: 'subtitulo' })],
        transformar: pivotearSimplificado,
        kpis: filas => [{ t: 'Glosas', v: filas.length.toLocaleString('en-US') }],
    },

    // ---------------- Libro Mayor
    'mayor-anio': {
        clave: 'mayor-anio', titulo: 'Por Año', filtro: 'anio', extras: ['cuenta'], access: 'Mayor › PorAño', leyenda: SOLES, limite: 5000,
        descripcion: `Mayor auxiliar del año por cuenta, con saldo corrido. ${AYUDA_CUENTA}`,
        columnas: COLS_MAYOR, grupos: [grupoCuenta('CtaContable', 'CuentaDescripcion')], kpis: kpisCuadre(),
    },
    'mayor-mes': {
        clave: 'mayor-mes', titulo: 'Por Mes', filtro: 'mes', extras: ['cuenta'], access: 'Mayor › PorMes', leyenda: SOLES, limite: 5000,
        descripcion: `Mayor del mes por cuenta. La primera línea de cada cuenta es "Vienen Mes Anterior" (desde febrero). ${AYUDA_CUENTA}`,
        columnas: COLS_MAYOR, grupos: [grupoCuenta('CtaContable', 'CuentaDescripcion')], kpis: kpisCuadre(),
    },
    'mayor-resumen-anio': {
        clave: 'mayor-resumen-anio', titulo: 'Resumen Año', filtro: 'anio', access: 'Mayor › ResumenAño', leyenda: SOLES, limite: 3000,
        descripcion: 'Mayor resumido del año por sub cuenta, mes y concepto, con saldo corrido.',
        columnas: COLS_RESUMEN, grupos: [grupoCuenta('Cuenta', 'CuentaDescripcion')], kpis: kpisCuadre(),
    },
    'mayor-resumen-principales': {
        clave: 'mayor-resumen-principales', titulo: 'Resumen Año Ctas. Principales', filtro: 'anio', access: 'Mayor › ResumenAñoCtasPrincipales',
        leyenda: SOLES, limite: 3000,
        descripcion: 'Mayor resumido del año por cuenta principal (2 dígitos), mes y concepto, con saldo corrido.',
        columnas: COLS_RESUMEN, grupos: [grupoCuenta('Cuenta', 'CuentaDescripcion')], kpis: kpisCuadre(),
    },
    'mayor-revisa': {
        clave: 'mayor-revisa', titulo: 'Revisa', filtro: 'anio', access: 'Mayor › Revisa', leyenda: SOLES, limite: 3000,
        descripcion: 'Documentos del mayor cuyo cargo no es igual al abono en el año (mes + libro + cliente/proveedor + documento).',
        vacio: 'Todos los documentos del año cuadran.',
        columnas: [c('Anio', 'Año', 'mono'), c('Mes', 'Mes', 'mono'), LIBRO, c('Nombre', 'Nombre', 'texto', { movil: 'subtitulo' }),
            c('Fecha', 'Fecha', 'fecha', { movil: 'titulo' }), c('TipoDoc', 'T. Doc', 'mono'), c('SerieDoc', 'Serie', 'mono'), c('NroDoc', 'Número', 'mono'),
            imp('Saldo', 'Saldo', { movil: 'importe' })],
    },

    // ---------------- Estados Financieros (InventBalances)
    'eeff-balance-general': {
        clave: 'eeff-balance-general', titulo: 'B. General', filtro: 'mes', access: 'InventBalances › BGeneral', leyenda: SOLES, sinTotal: true,
        descripcion: 'Formato 3.1 Balance General al mes elegido (saldo acumulado del año). El resultado del ejercicio se calcula al vuelo y va en Patrimonio.',
        columnas: [c('CtaPrincipal', 'Cuenta', 'mono', { movil: 'titulo' }), c('Descripcion', 'Descripción', 'texto', { movil: 'subtitulo' }),
            valor('Importe', 'Importe', { movil: 'importe' })],
        grupos: [
            { clave: f => String(f.OrdenBalance), titulo: f => String(f.OrdenBalance),
                subtotal: fs => ({ texto: `TOTAL ${fs[0].OrdenBalance}`, valores: { Importe: suma(fs, 'Importe') } }) },
            { clave: f => String(f.ConceptoEEFF), titulo: f => String(f.ConceptoDescripcion ?? ''),
                subtotal: fs => ({ texto: `Total ${fs[0].ConceptoDescripcion ?? ''}`, valores: { Importe: suma(fs, 'Importe') } }) },
        ],
        pie: filas => {
            const de = (o: string) => suma(filas.filter(f => f.OrdenBalance === o), 'Importe')
            const A = de('ACTIVO'), PyP = r2(de('PASIVO') + de('PATRIMONIO'))
            const filasPie: FilaPie[] = [{ texto: 'TOTAL ACTIVO', valores: { Importe: A } },
                { texto: 'TOTAL PASIVO Y PATRIMONIO', valores: { Importe: PyP }, destacada: true }]
            if (r2(A - PyP) !== 0) filasPie.push({ texto: 'Diferencia (el balance no cuadra)', valores: { Importe: r2(A - PyP) } })
            return filasPie
        },
        kpis: filas => ['ACTIVO', 'PASIVO', 'PATRIMONIO'].map(o => ({ t: o.charAt(0) + o.slice(1).toLowerCase(), v: soles(suma(filas.filter(f => f.OrdenBalance === o), 'Importe')) })),
    },
    'eeff-resultado-mes': gyp('eeff-resultado-mes', 'Resultado Mes', 'mes', 'InventBalances › ResultadoMes',
        'Formato 3.20 Estado de Ganancias y Pérdidas por función, solo del mes elegido.'),
    'eeff-resultado-anual': gyp('eeff-resultado-anual', 'Resultado Anual', 'anio', 'InventBalances › ResultadoAnual',
        'Formato 3.20 Estado de Ganancias y Pérdidas por función del ejercicio económico (todo el año).'),
    'eeff-resultado-acumulado': gyp('eeff-resultado-acumulado', 'Resultado Acumulado', 'mes', 'nuevo, no está en Access',
        'Ganancias y Pérdidas por función de enero al mes elegido: es el resultado que cuadra con el Balance General del mismo mes.'),
    'eeff-comprobacion': comprobacion('eeff-comprobacion', 'B. Comprobación', 'InventBalances › BComprobacion',
        'Balance de Comprobación por cuenta principal (2 dígitos), acumulado de enero al mes elegido.'),
    'eeff-comprobacion-sunat': comprobacion('eeff-comprobacion-sunat', 'B. Comprobación SUNAT', 'InventBalances › BComprobacionSUNAT',
        'Balance de Comprobación por cuenta de registro (sub cuenta), formato SUNAT, acumulado de enero al mes elegido.'),
    'eeff-comprobacion-mes': comprobacion('eeff-comprobacion-mes', 'B. Comprobación Mes', 'InventBalances › BComprobacionMes',
        'Anexo 1: Balance de Comprobación Mensual por cuenta de registro. Igual que en Access, es acumulado de enero al mes (sale igual que SUNAT).'),
    'eeff-flujo-efectivo': {
        clave: 'eeff-flujo-efectivo', titulo: 'Flujo Efectivo', filtro: 'anio', access: 'InventBalances › FlujoEfectivo', leyenda: SOLES,
        descripcion: 'Formato 3.18 Estado de Flujo de Efectivo (desde las líneas de caja). Cada pago se cuenta una vez (Access lo repetía por cada ítem del documento).',
        advertencia: 'EN REVISIÓN — no usar para decisiones ni para SUNAT. La fuente (centralización de caja) incluye traslados entre cajas y no los cobros por bancos: en 2025 da un neto de −2.1 millones cuando la caja del mayor varió −37 mil. Se rehará desde el Libro Mayor.',
        columnas: [c('Cod_Contab', 'Cuenta', 'mono', { movil: 'titulo' }), c('Descripcion', 'Descripción', 'texto', { movil: 'subtitulo' }),
            imp('Cobros', 'Cobranza S/.'), imp('Pagos', 'Pagos S/.'), imp('Neto', 'Neto', { movil: 'importe' })],
        grupos: [{
            clave: f => String(f.EF), titulo: f => String(f.Actividades ?? ''),
            subtotal: fs => ({ texto: 'Aumento (Disminución) del Efectivo', valores: { Cobros: suma(fs, 'Cobros'), Pagos: suma(fs, 'Pagos'), Neto: suma(fs, 'Neto') } }),
        }],
        pie: filas => {
            const neto = suma(filas, 'Neto'), si = n(filas[0].SaldoInicialAccess)
            return [
                { texto: 'Aumento (Disminución) neto del efectivo', valores: { Neto: neto } },
                { texto: 'Saldo inicial del efectivo (cálculo de Access)', valores: { Neto: si } },
                { texto: 'Saldo final del efectivo', valores: { Neto: r2(neto + si) }, destacada: true },
                { texto: 'Referencia: saldo de apertura de la clase 10 en el mayor', valores: { Neto: n(filas[0].SaldoInicialMayor) } },
            ]
        },
    },
    'eeff-cambio-patrimonio': {
        clave: 'eeff-cambio-patrimonio', titulo: 'Cambio Patrimonio', filtro: 'anio', access: 'InventBalances › CambioPatrimonio', leyenda: SOLES, sinTotal: true,
        descripcion: 'Formato 3.19 Estado de Cambios en el Patrimonio Neto: saldo inicial, movimientos de la clase 5 y resultado del ejercicio.',
        columnas: [c('Fecha', 'Fecha', 'fecha'), c('Descripcion', 'Descripción', 'texto', { movil: 'subtitulo' }),
            ...COLS_PATRIMONIO.map(([k, t]) => valor(k, t)), valor('Total', 'Total', { movil: 'importe' })],
        pie: (filas, ctx) => {
            const v: ValoresFila = {}
            for (const [k] of [...COLS_PATRIMONIO, ['Total', '']]) v[k] = suma(filas, k)
            return [
                { texto: `Saldo Final al 31.12.${ctx.anio}`, valores: v },
                { texto: 'SALDO TOTAL PATRIMONIO', valores: { Total: v.Total }, destacada: true },
            ]
        },
    },

    // ---------------- Cuentas Contables
    'cuentas-saldos': {
        clave: 'cuentas-saldos', titulo: 'Saldos Cuentas', filtro: 'fecha', access: 'CtasContables › SaldosCuentas', leyenda: SOLES, limite: 2000,
        descripcion: 'Saldo de cada sub cuenta del 1 de enero a la fecha de corte, agrupado por cuenta principal, sub cuenta y sub cuenta 2.',
        columnas: [c('CtaContable', 'Cuenta', 'mono', { movil: 'titulo' }),
            c('_descripcion', 'Descripción', 'texto', { movil: 'subtitulo',
                valor: f => Number(f.SinCuentaPadre) === 1 ? `${f.CtaContableDescripcion ?? ''} (falta la cuenta padre en el plan)` : (f.CtaContableDescripcion ?? null) }),
            imp('Cargo', 'Cargos'), imp('Abono', 'Abonos'), imp('SaldoDeudor', 'Deudor', { movil: 'importe' }), imp('SaldoAcreedor', 'Acreedor')],
        grupos: [grupoSaldos('CtaPrincipal', 'CtaPrincipalDescripcion'), grupoSaldos('SubCta', 'SubCtaDescripcion'), grupoSaldos('SubCta1', 'SubCta1Descripcion')],
        kpis: filas => [{ t: 'Deudor', v: soles(suma(filas, 'SaldoDeudor')) }, { t: 'Acreedor', v: soles(suma(filas, 'SaldoAcreedor')) }],
    },
    'cuentas-sumas-mayor': {
        clave: 'cuentas-sumas-mayor', titulo: 'Sumas Mayor', filtro: 'anio', access: 'CtasContables › SumasMayor', leyenda: SOLES,
        descripcion: 'Sumas del mayor por sub cuenta: Debe (cargo) y Haber (abono) de cada mes del año. Sin saldos.',
        columnas: [c('Cod_Contab', 'Cuenta', 'mono', { movil: 'titulo' }), c('Descripcion', 'Descripción', 'texto', { movil: 'subtitulo' }),
            ...MESES_SUMAS.flatMap(([k, t]) => [imp(`${k}Cargo`, `${t} Debe`), imp(`${k}Abono`, `${t} Haber`)])],
        kpis: kpisCuadre('TotalCargo', 'TotalAbono', 'Total Debe', 'Total Haber'),
    },

    // ---------------- PLE: Libro Diario 5.1, Plan de cuentas 5.3 y Libro Mayor 6.1 (vista previa)
    'ple-diario-051': {
        clave: 'ple-diario-051', titulo: '5.1 Libro Diario', filtro: 'mes', access: 'Diario › LibroElectronico (5.1)', leyenda: SOLES, limite: 1000,
        descripcion: 'Libro Diario electrónico: una línea por movimiento del mayor del mes (21 campos).',
        columnas: VISTA_DIARIO_MAYOR,
    },
    'ple-plan-053': {
        clave: 'ple-plan-053', titulo: '5.3 Plan de cuentas', filtro: 'mes', access: 'Diario › LibroElectronico (5.3)', limite: 1000,
        descripcion: 'Detalle del plan contable utilizado: en enero todo el plan; en otro mes, solo las cuentas dadas de alta ese mes.',
        vacio: 'En este mes no hay cuentas nuevas en el plan: el 5.3 sale vacío (indicador 0).',
        columnas: [c('CtaContable', 'Cuenta', 'mono', { movil: 'titulo' }), campoLinea(2, 'Descripción', 'texto', { movil: 'subtitulo' }),
            campoLinea(3, 'Plan', 'mono'), campoLinea(7, 'Estado', 'mono')],
    },
    'ple-mayor-061': {
        clave: 'ple-mayor-061', titulo: '6.1 Libro Mayor', filtro: 'mes', access: 'Mayor › LibroElectronico (6.1)', leyenda: SOLES, limite: 1000,
        descripcion: 'Libro Mayor electrónico: una línea por movimiento del mayor del mes (21 campos).',
        columnas: VISTA_DIARIO_MAYOR,
    },
}

/** Pestañas de cada página (en el orden de los botones de Access). */
export const PESTANAS_DIARIO: ClaveReporte[] = ['diario-general', 'diario-mes', 'diario-revision-asientos', 'diario-simplificado']
export const PESTANAS_MAYOR: ClaveReporte[] = ['mayor-anio', 'mayor-mes', 'mayor-resumen-anio', 'mayor-resumen-principales', 'mayor-revisa']
export const PESTANAS_EEFF: ClaveReporte[] = ['eeff-balance-general', 'eeff-resultado-mes', 'eeff-resultado-anual', 'eeff-comprobacion',
    'eeff-comprobacion-sunat', 'eeff-comprobacion-mes', 'eeff-flujo-efectivo', 'eeff-cambio-patrimonio', 'eeff-resultado-acumulado']
export const PESTANAS_CUENTAS: ClaveReporte[] = ['cuentas-saldos', 'cuentas-sumas-mayor']
