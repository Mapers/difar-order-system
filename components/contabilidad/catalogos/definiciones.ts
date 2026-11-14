import { ClaveCatalogo, ClaveCombo, FilaCatalogo } from '@/app/types/datos-control-types'

/**
 * Definición declarativa de los catálogos de Datos Fijos › Datos de Control.
 * Cada catálogo dice qué campos tiene su ficha (los mismos del form Access), de qué combo salen,
 * cuáles son obligatorios y qué puede hacerse (alta / modificar / eliminar).
 * El backend vuelve a filtrar las claves y el SP valida todo: esto solo arma la pantalla.
 */

export type TipoCampo = 'texto' | 'entero' | 'decimal' | 'fecha' | 'combo' | 'sino' | 'opciones' | 'catalogo'

export interface CampoDef {
    clave: string
    etiqueta: string
    tipo: TipoCampo
    obligatorio?: boolean
    max?: number
    /** Combo de sp_ws_contabilidad_datos_control_combos. */
    combo?: ClaveCombo
    /** El combo guarda el id (número) en vez del código. */
    porId?: boolean
    /** Valor numérico al grabar (combos cuyo código es INT). */
    numerico?: boolean
    /** Opciones fijas (tipo 'opciones'). */
    opciones?: { valor: string; etiqueta: string }[]
    /** Combo con las filas de otro catálogo (tipo 'catalogo'). */
    catalogo?: ClaveCatalogo
    /** Es el código del registro: se bloquea si el registro ya está en uso. */
    esCodigo?: boolean
    /** Solo se muestra (no se graba). */
    soloVista?: boolean
    /** El valor viene de la fila y no de `datos` (p. ej. el nombre del chofer es la descripción). */
    desdeFila?: 'codigo' | 'descripcion' | 'abreviatura'
    /** Se muestra multiplicado (0.02 -> 2 %) y se graba dividido. */
    escala?: number
    ayuda?: string
    /** Valor de un registro nuevo. */
    defecto?: string
    mayusculas?: boolean
    ancho?: 'completo'
}

export interface ColumnaDef {
    etiqueta: string
    valor: (f: FilaCatalogo) => string
    /** Se oculta en celular. */
    secundaria?: boolean
    mono?: boolean
}

export interface CatalogoDef {
    clave: ClaveCatalogo
    titulo: string
    /** Form y tabla de Access que reemplaza. */
    access: string
    campos: CampoDef[]
    columnas: ColumnaDef[]
    soloLectura?: boolean
    sinAlta?: boolean
    sinEliminar?: boolean
    /** El uso se consulta por el código (las tablas hijas guardan el código, no el id). */
    usoPorCodigo?: boolean
    sinUso?: boolean
    /** Código sugerido para un registro nuevo (Access: NumeroMax…). */
    sugerido?: 'siguienteZona' | 'siguienteCentroCostos'
    nota?: string
}

const t = (v: unknown) => (v === null || v === undefined ? '' : String(v))
const d = (f: FilaCatalogo, k: string) => t(f.datos?.[k])
const enmascarar = (v: string) => (v.length > 4 ? `•••• ${v.slice(-4)}` : v)
const fecha = (v: string) => (v ? v.slice(0, 10).split('-').reverse().join('/') : '')
const porcentaje = (v: string) => (v === '' ? '' : `${Math.round(Number(v) * 10000) / 100} %`)

const COD = (max: number, etiqueta = 'Código'): CampoDef => ({ clave: 'codigo', etiqueta, tipo: 'texto', obligatorio: true, max, esCodigo: true, mayusculas: true })
const DESC = (max: number, etiqueta = 'Descripción'): CampoDef => ({ clave: 'descripcion', etiqueta, tipo: 'texto', obligatorio: true, max, ancho: 'completo' })
const ABREV = (max: number, etiqueta = 'Abreviatura', obligatorio = true): CampoDef => ({ clave: 'abreviatura', etiqueta, tipo: 'texto', obligatorio, max, mayusculas: true })
const colCodigo = (etiqueta = 'Código'): ColumnaDef => ({ etiqueta, valor: (f) => t(f.codigo), mono: true })
const colDesc = (etiqueta = 'Descripción'): ColumnaDef => ({ etiqueta, valor: (f) => t(f.descripcion) })
const colAbrev = (etiqueta = 'Abreviatura'): ColumnaDef => ({ etiqueta, valor: (f) => t(f.abreviatura), secundaria: true })

export const CATALOGOS: Record<ClaveCatalogo, CatalogoDef> = {
    empresa: {
        clave: 'empresa', titulo: 'Empresa', access: 'Form [Empresas de Control] · tabla empresas control',
        sinAlta: true, sinEliminar: true, sinUso: true,
        nota: 'Solo se modifican los datos de la empresa de trabajo. El alta de empresas ("crear datos") no se migra a la web.',
        campos: [
            { clave: 'ruc', etiqueta: 'RUC', tipo: 'texto', soloVista: true },
            { clave: 'razonSocial', etiqueta: 'Razón social', tipo: 'texto', obligatorio: true, max: 100, ancho: 'completo' },
            { clave: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'fecha' },
            { clave: 'regimen', etiqueta: 'Régimen de renta', tipo: 'combo', combo: 'regimenes', numerico: true },
            { clave: 'domicilio', etiqueta: 'Domicilio', tipo: 'texto', max: 255, ancho: 'completo' },
            { clave: 'telefonos', etiqueta: 'Teléfonos', tipo: 'texto', max: 255 },
            { clave: 'correos', etiqueta: 'Correos', tipo: 'texto', max: 255 },
            { clave: 'ubigeo', etiqueta: 'Ubigeo', tipo: 'texto', max: 6, ayuda: 'Código de distrito (6 dígitos).' },
        ],
        columnas: [colCodigo('RUC'), colDesc('Razón social'), { etiqueta: 'Inicio', valor: (f) => fecha(d(f, 'fechaInicio')), secundaria: true }],
    },
    caja: {
        clave: 'caja', titulo: 'Cajas de control', access: 'Form [Cajas de Control] · tabla cajas control',
        nota: 'Cambiar la cuenta contable afecta las centralizaciones que se hagan desde ahora.',
        campos: [
            DESC(50),
            { clave: 'moneda', etiqueta: 'Moneda', tipo: 'combo', combo: 'monedas', obligatorio: true },
            { clave: 'cuentaContable', etiqueta: 'Cuenta contable', tipo: 'combo', combo: 'cuentasCaja', porId: true, numerico: true, obligatorio: true, ancho: 'completo' },
        ],
        columnas: [colCodigo('Id'), colDesc(), { etiqueta: 'Moneda', valor: (f) => d(f, 'moneda') },
            { etiqueta: 'Cuenta', valor: (f) => `${d(f, 'cuenta')} ${d(f, 'cuentaDescripcion')}`.trim(), secundaria: true }],
    },
    'tipo-documento': {
        clave: 'tipo-documento', titulo: 'Tipos de documento', access: 'Form [Tipo de Documentos] · tabla mtipodocumento',
        nota: 'Códigos SUNAT: revisa la tabla 10 antes de crear o cambiar uno.',
        campos: [
            COD(3), ABREV(4), DESC(50),
            { clave: 'registros', etiqueta: 'Registros', tipo: 'combo', combo: 'docRegistros', numerico: true, obligatorio: true, defecto: '0' },
            { clave: 'printRecibos', etiqueta: 'Imprime recibos', tipo: 'combo', combo: 'docRegistros', numerico: true, obligatorio: true, defecto: '0' },
            { clave: 'orden', etiqueta: 'Origen del documento', tipo: 'combo', combo: 'origenes', numerico: true, obligatorio: true },
        ],
        columnas: [colCodigo(), colDesc(), colAbrev()],
    },
    'doc-registro': {
        clave: 'doc-registro', titulo: 'Documentos registros', access: 'Form hijo [Documentos Registros] · tabla doc_registros',
        campos: [{ ...COD(5), tipo: 'entero', mayusculas: false }, DESC(50)],
        columnas: [colCodigo(), colDesc()],
    },
    'origen-documento': {
        clave: 'origen-documento', titulo: 'Origen del documento', access: 'Form hijo [Orden Documento] · tabla orde documento',
        campos: [DESC(50, 'Nombre')],
        columnas: [colCodigo('Id'), colDesc('Nombre')],
    },
    'cuenta-banco': {
        clave: 'cuenta-banco', titulo: 'Cuentas corrientes de bancos', access: 'Form [Cuentas Corrientes Bancos] · tabla ctas de banco',
        nota: 'El número de cuenta es un dato sensible: en la lista solo se ven los últimos 4 dígitos.',
        campos: [
            COD(4, 'Código banco'), DESC(50),
            { clave: 'nroCuenta', etiqueta: 'N° de cuenta', tipo: 'texto', obligatorio: true, max: 50 },
            { clave: 'moneda', etiqueta: 'Moneda', tipo: 'combo', combo: 'monedas', obligatorio: true },
            { clave: 'entidad', etiqueta: 'Entidad financiera', tipo: 'combo', combo: 'entidades', obligatorio: true },
            { clave: 'cuentaContable', etiqueta: 'Cuenta contable', tipo: 'combo', combo: 'cuentasBanco', porId: true, numerico: true, ancho: 'completo' },
        ],
        columnas: [colCodigo(), colDesc(), { etiqueta: 'N° cuenta', valor: (f) => enmascarar(d(f, 'nroCuenta')), mono: true },
            { etiqueta: 'Moneda', valor: (f) => d(f, 'moneda'), secundaria: true },
            { etiqueta: 'Entidad', valor: (f) => d(f, 'entidadDescripcion'), secundaria: true }],
    },
    'entidad-financiera': {
        clave: 'entidad-financiera', titulo: 'Entidades financieras', access: 'Form hijo [Entidad Financiera] · tabla entidad financiera',
        campos: [COD(3), DESC(255)],
        columnas: [colCodigo(), colDesc()],
    },
    'tipo-operacion': {
        clave: 'tipo-operacion', titulo: 'Tipos de operación', access: 'Form [Tipo de Operaciones] · tabla mtipooperaciones',
        nota: 'Tabla 12 de SUNAT (tipo de operación del kardex).',
        campos: [
            COD(3), ABREV(7, 'Descripción corta'), DESC(40, 'Operación'),
            { clave: 'claveOp', etiqueta: 'Clave', tipo: 'combo', combo: 'clavesOp', numerico: true, obligatorio: true },
            { clave: 'motivo', etiqueta: 'Motivo', tipo: 'combo', combo: 'motivosOp', numerico: true, obligatorio: true },
        ],
        columnas: [colCodigo(), colDesc('Operación'), colAbrev('Corta'), { etiqueta: 'Clave', valor: (f) => d(f, 'claveDescripcion'), secundaria: true }],
    },
    'libro-contable': {
        clave: 'libro-contable', titulo: 'Libros contables', access: 'Form [Libros Contables] · tabla libro contable', soloLectura: true,
        nota: 'Solo consulta: los códigos de libro están fijos en los procesos contables de la web.',
        campos: [COD(4), ABREV(7, 'Abreviado'), DESC(255), { clave: 'codLibSunat', etiqueta: 'Libro SUNAT', tipo: 'texto', soloVista: true }],
        columnas: [colCodigo(), colDesc(), colAbrev('Abreviado')],
    },
    'tipo-voucher': {
        clave: 'tipo-voucher', titulo: 'Tipos de voucher', access: 'Form [Tipos de Voucher] · tabla mtipovoucher', soloLectura: true,
        nota: 'Solo consulta: casi nunca cambia.',
        campos: [COD(5), ABREV(10), DESC(50)],
        columnas: [colCodigo(), colDesc(), colAbrev()],
    },
    almacen: {
        clave: 'almacen', titulo: 'Almacenes', access: 'Form [Almacenes] · tabla malmacenes',
        nota: 'Un almacén nuevo necesita sus correlativos de venta web antes de usarse en pedidos.',
        campos: [
            { clave: 'codigo', etiqueta: 'Código', tipo: 'texto', obligatorio: true, max: 4, mayusculas: true }, DESC(40),
            { clave: 'direccion', etiqueta: 'Dirección', tipo: 'texto', max: 40, ancho: 'completo' },
            { clave: 'area', etiqueta: 'Área', tipo: 'texto', max: 10 },
        ],
        columnas: [colCodigo(), colDesc(), { etiqueta: 'Dirección', valor: (f) => d(f, 'direccion'), secundaria: true }, colAbrev('Área')],
    },
    moneda: {
        clave: 'moneda', titulo: 'Tipos de moneda', access: 'Form [Tipo de Moneda] · tabla mtipomoneda', soloLectura: true, sinEliminar: true,
        nota: 'Solo consulta: todo el sistema depende de NSO y USD.',
        campos: [COD(3, 'Abreviatura'), DESC(30), { clave: 'simbolo', etiqueta: 'Símbolo', tipo: 'texto', max: 4 },
            { clave: 'codigoSunat', etiqueta: 'Código SUNAT', tipo: 'texto', max: 3 }],
        columnas: [colCodigo('Abrev.'), colDesc(), colAbrev('Símbolo')],
    },
    'centro-costos': {
        clave: 'centro-costos', titulo: 'Centros de costos', access: 'Form [Centros de Costos] · tabla mcentrocostos',
        usoPorCodigo: true, sugerido: 'siguienteCentroCostos',
        campos: [
            { ...COD(3), obligatorio: false, ayuda: 'Si lo dejas vacío se usa el siguiente número.' }, ABREV(4, 'Abreviado'), DESC(50),
            { clave: 'unidadNegocio', etiqueta: 'Unidad de negocio', tipo: 'combo', combo: 'unidadesNegocio', numerico: true, obligatorio: true },
            { clave: 'lugar', etiqueta: 'Lugar', tipo: 'texto', max: 50 },
        ],
        columnas: [colCodigo(), colDesc(), colAbrev('Abreviado'), { etiqueta: 'Unidad', valor: (f) => d(f, 'unidadDescripcion'), secundaria: true }],
    },
    'unidad-negocio': {
        clave: 'unidad-negocio', titulo: 'Unidades de negocio', access: 'Form hijo [Unidad de Negocios] · tabla unidad de negocios',
        campos: [DESC(255)],
        columnas: [colCodigo('Id'), colDesc()],
    },
    'subunidad-negocio': {
        clave: 'subunidad-negocio', titulo: 'Sub unidades de negocio', access: 'Form hijo [Sub Unidad de Negocios] · tabla subunidadnegocios',
        campos: [DESC(255), { clave: 'unidadNegocio', etiqueta: 'Unidad de negocio', tipo: 'combo', combo: 'unidadesNegocio', numerico: true, obligatorio: true }],
        columnas: [colCodigo('Id'), colDesc(), { etiqueta: 'Unidad', valor: (f) => d(f, 'unidadDescripcion'), secundaria: true }],
    },
    'tipo-pago': {
        clave: 'tipo-pago', titulo: 'Tipos de pago', access: 'Form [Tipo de Amortizaciones] · tabla mtipoamortizacion',
        nota: '"Flujo de efectivo" decide si el pago entra al flujo de efectivo.',
        campos: [COD(4), ABREV(6), DESC(50),
            { clave: 'efectivo', etiqueta: 'Flujo de efectivo', tipo: 'combo', combo: 'efectivo', numerico: true, obligatorio: true }],
        columnas: [colCodigo(), colDesc(), colAbrev(), { etiqueta: 'Efectivo', valor: (f) => d(f, 'efectivoDescripcion'), secundaria: true }],
    },
    condicion: {
        clave: 'condicion', titulo: 'Condiciones (días de crédito)', access: 'Form [Condicion de Documentos] · tabla mcondisionesdocs',
        nota: 'La toma de pedidos usa estas condiciones en vivo.',
        campos: [COD(3), DESC(50),
            { clave: 'dias', etiqueta: 'Días de crédito', tipo: 'entero', obligatorio: true, defecto: '0' },
            { clave: 'credito', etiqueta: 'Tipo', tipo: 'opciones', obligatorio: true, opciones: [{ valor: '1', etiqueta: 'Crédito' }, { valor: '0', etiqueta: 'Contado' }] },
            { clave: 'incremento', etiqueta: 'Incremento de precio (%)', tipo: 'decimal', escala: 100, defecto: '0', ayuda: 'Entre 0 % y 99 %.' }],
        columnas: [colCodigo(), colDesc(), { etiqueta: 'Días', valor: (f) => d(f, 'dias') },
            { etiqueta: 'Tipo', valor: (f) => (d(f, 'credito') === '1' ? 'Crédito' : 'Contado'), secundaria: true }],
    },
    'modulo-trabajo': {
        clave: 'modulo-trabajo', titulo: 'Módulos de trabajo', access: 'Form [Modulo de Trabajo] · tabla modulo de trabajo', soloLectura: true,
        nota: 'Solo consulta: son códigos internos fijos.',
        campos: [COD(2), DESC(50), { clave: 'libContable', etiqueta: 'Libro', tipo: 'texto', max: 4 }],
        columnas: [colCodigo(), colDesc(), colAbrev('Libro')],
    },
    'situacion-mercaderia': {
        clave: 'situacion-mercaderia', titulo: 'Situación de mercadería', access: 'Form [Situacion de Mercaderia] · tabla situacion mercaderia', soloLectura: true,
        nota: 'Solo consulta: no se usa en DIFAR.',
        campos: [COD(3), ABREV(4), DESC(50)],
        columnas: [colCodigo(), colDesc(), colAbrev()],
    },
    zona: {
        clave: 'zona', titulo: 'Zonas', access: 'Form [Zonas] · tabla zona', usoPorCodigo: true, sugerido: 'siguienteZona',
        nota: 'Clientes, rutas y planillas usan el código de zona: si ya está en uso, el código no se cambia.',
        campos: [{ ...COD(3), obligatorio: false, ayuda: 'Si lo dejas vacío se usa el siguiente número.' }, DESC(255, 'Nombre de zona')],
        columnas: [colCodigo(), colDesc('Zona')],
    },
    serie: {
        clave: 'serie', titulo: 'Series', access: 'Form [Series] · tabla serie_docs', usoPorCodigo: true,
        nota: 'La facturación web usa sus propios correlativos (Configuraciones › Comprobantes).',
        campos: [
            { ...COD(4, 'Serie'), ayuda: '4 caracteres (p. ej. F001).' },
            { clave: 'tipoDocumento', etiqueta: 'Tipo de documento', tipo: 'catalogo', catalogo: 'tipo-documento' },
            { clave: 'docElectronico', etiqueta: 'Documento electrónico', tipo: 'sino', defecto: '0' },
            { clave: 'domicilioFiscal', etiqueta: 'Domicilio fiscal', tipo: 'combo', combo: 'domiciliosFiscales', porId: true, numerico: true, ancho: 'completo' },
        ],
        columnas: [colCodigo('Serie'), { etiqueta: 'Tipo doc.', valor: (f) => d(f, 'tipoDocumento') },
            { etiqueta: 'Electrónico', valor: (f) => (d(f, 'docElectronico') === '1' ? 'Sí' : 'No') },
            { etiqueta: 'Domicilio', valor: (f) => t(f.descripcion).replace(/^\S+ - /, ''), secundaria: true }],
    },
    'unidad-transporte': {
        clave: 'unidad-transporte', titulo: 'Unidades de transporte', access: 'Form [Unidad Transporte] · tabla undtransporte',
        campos: [
            { clave: 'marca', etiqueta: 'Marca', tipo: 'texto', obligatorio: true, max: 255 },
            { clave: 'placa', etiqueta: 'Placa', tipo: 'texto', obligatorio: true, max: 255, mayusculas: true },
            { clave: 'tuce', etiqueta: 'N° TUCE / MTC', tipo: 'texto', obligatorio: true, max: 20 },
        ],
        columnas: [colCodigo('Id'), colDesc('Marca'), { etiqueta: 'Placa', valor: (f) => t(f.abreviatura), mono: true },
            { etiqueta: 'TUCE', valor: (f) => d(f, 'tuce'), secundaria: true }],
    },
    chofer: {
        clave: 'chofer', titulo: 'Choferes', access: 'Form [Chofer] · tabla chofer',
        campos: [
            { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true, max: 100, desdeFila: 'descripcion', ancho: 'completo' },
            { clave: 'licencia', etiqueta: 'N° de licencia', tipo: 'texto', obligatorio: true, max: 255, mayusculas: true },
            { clave: 'tipoDocChofer', etiqueta: 'Tipo de documento', tipo: 'opciones',
                opciones: [{ valor: '1', etiqueta: 'DNI' }, { valor: '4', etiqueta: 'Carnet de extranjería' }, { valor: '7', etiqueta: 'Pasaporte' }] },
            { clave: 'nroDocChofer', etiqueta: 'N° de documento', tipo: 'texto', max: 20 },
        ],
        columnas: [colCodigo('Id'), colDesc('Nombre'), { etiqueta: 'Licencia', valor: (f) => t(f.abreviatura) }],
    },
    'comision-cobranza': {
        clave: 'comision-cobranza', titulo: 'Comisión de cobranza', access: 'Form [comisionCobranza] (botón de Vendedores) · tabla comisioncob',
        nota: 'Los periodos no pueden cruzarse. Un periodo que ya empezó no se elimina (afecta comisiones calculadas).',
        campos: [
            { clave: 'tasa', etiqueta: 'Tasa de comisión (%)', tipo: 'decimal', escala: 100, obligatorio: true },
            { clave: 'fecInicio', etiqueta: 'Desde', tipo: 'fecha', obligatorio: true },
            { clave: 'fecFinal', etiqueta: 'Hasta', tipo: 'fecha', ayuda: 'Vacío = sin fecha de fin.' },
            ...[1, 2, 3, 4, 5, 6].flatMap((n): CampoDef[] => [
                { clave: `dias${n}`, etiqueta: `Días tramo ${n}`, tipo: 'entero', defecto: '0' },
                { clave: `factor${n}`, etiqueta: `Factor tramo ${n}`, tipo: 'decimal', defecto: '0', ayuda: n === 1 ? '1.00 = 100 % de la tasa.' : undefined },
            ]),
        ],
        columnas: [{ etiqueta: 'Tasa', valor: (f) => porcentaje(d(f, 'tasa')) }, { etiqueta: 'Desde', valor: (f) => fecha(d(f, 'fecInicio')) },
            { etiqueta: 'Hasta', valor: (f) => fecha(d(f, 'fecFinal')) || 'sin fin' }],
    },
}

/** Botones del menú Access "Datos de Control", en el mismo orden y filas. */
export interface BotonAccess {
    boton: string
    catalogos: ClaveCatalogo[]
    /** Ya existe en otra pantalla de la web. */
    enlace?: { href: string; texto: string }
    /** No se migra. */
    noMigra?: string
}

export const FILAS_ACCESS: BotonAccess[][] = [
    [
        { boton: 'Empresas', catalogos: ['empresa'] },
        { boton: 'Documentos', catalogos: ['tipo-documento', 'doc-registro', 'origen-documento'] },
        { boton: 'Operaciones', catalogos: ['tipo-operacion'] },
        { boton: 'Almacenes', catalogos: ['almacen'] },
        { boton: 'LibrosContables', catalogos: ['libro-contable'] },
        { boton: 'Vouchers', catalogos: ['tipo-voucher'] },
        { boton: 'Moneda', catalogos: ['moneda'] },
        { boton: 'TiposPago', catalogos: ['tipo-pago'] },
        { boton: 'Zonas', catalogos: ['zona'] },
        { boton: 'Series', catalogos: ['serie'] },
    ],
    [
        { boton: 'CajasControl', catalogos: ['caja'] },
        { boton: 'CtasCorrientes', catalogos: ['cuenta-banco', 'entidad-financiera'] },
        { boton: 'CentroCostos', catalogos: ['centro-costos', 'unidad-negocio', 'subunidad-negocio'] },
        { boton: 'DiasCredito', catalogos: ['condicion'] },
        { boton: 'ModuloTrabajo', catalogos: ['modulo-trabajo'] },
        { boton: 'Transporte', catalogos: ['unidad-transporte'] },
        { boton: 'Chofer', catalogos: ['chofer'] },
        { boton: 'UnidadCostos', catalogos: [], noMigra: 'Galpones de granja (tabla mgalpon, sin registros): no aplica a DIFAR y no se migra.' },
    ],
    [
        { boton: 'SitMercaderia', catalogos: ['situacion-mercaderia'] },
        { boton: 'RepLaboratorios', catalogos: [], enlace: { href: '/dashboard/usuarios', texto: 'Los representantes de laboratorio se mantienen en Usuarios › Representantes.' } },
        { boton: 'Vendedores', catalogos: ['comision-cobranza'], enlace: { href: '/dashboard/usuarios', texto: 'Los vendedores se mantienen en Usuarios › Vendedores. Aquí queda la comisión de cobranza.' } },
    ],
]

/** Valores de la ficha (siempre texto en los inputs) a partir de una fila de la lista. */
export function valoresDe(def: CatalogoDef, fila: FilaCatalogo | null, sugerido?: string | null): Record<string, string> {
    const base: Record<string, unknown> = fila
        ? { codigo: fila.codigo, descripcion: fila.descripcion, abreviatura: fila.abreviatura, ...(fila.datos ?? {}) }
        : {}
    const v: Record<string, string> = {}
    for (const c of def.campos) {
        let x: unknown = fila ? (c.desdeFila ? fila[c.desdeFila] : base[c.clave]) : c.defecto
        if (!fila && c.clave === 'codigo' && sugerido) x = sugerido
        if (x === null || x === undefined || x === '') { v[c.clave] = ''; continue }
        if (c.escala && !Number.isNaN(Number(x))) x = Math.round(Number(x) * c.escala * 10000) / 10000
        if (c.tipo === 'fecha') x = String(x).slice(0, 10)
        v[c.clave] = String(x)
    }
    return v
}

/** Ficha -> JSON `datos` que se manda al backend (solo los campos que se graban). */
export function datosDe(def: CatalogoDef, v: Record<string, string>): Record<string, unknown> {
    const r: Record<string, unknown> = {}
    for (const c of def.campos) {
        if (c.soloVista) continue
        const s = (v[c.clave] ?? '').trim()
        if (s === '') { r[c.clave] = null; continue }
        if (c.tipo === 'entero' || c.tipo === 'sino' || c.numerico) r[c.clave] = Number(s)
        else if (c.tipo === 'decimal') r[c.clave] = c.escala ? Math.round((Number(s) / c.escala) * 10000) / 10000 : Number(s)
        else r[c.clave] = c.mayusculas ? s.toUpperCase() : s
    }
    return r
}

/** Faltantes / formatos antes de llamar al backend (el SP vuelve a validar). */
export function revisar(def: CatalogoDef, v: Record<string, string>): string | null {
    for (const c of def.campos) {
        if (c.soloVista) continue
        const s = (v[c.clave] ?? '').trim()
        if (c.obligatorio && !s) return `Falta: ${c.etiqueta}`
        if (s && c.max && s.length > c.max) return `${c.etiqueta}: máximo ${c.max} caracteres`
        if (s && (c.tipo === 'entero') && !/^-?\d+$/.test(s)) return `${c.etiqueta}: ingresa un número entero`
        if (s && c.tipo === 'decimal' && Number.isNaN(Number(s))) return `${c.etiqueta}: ingresa un número`
    }
    return null
}
