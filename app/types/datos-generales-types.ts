/**
 * Datos Fijos › Datos Generales (mantenimientos migrados de Access):
 * Personas y Empresas, Tipo de Cambio, Bienes y Servicios (+ OSCE), IGV, Año y Meses.
 * Las filas llegan con los nombres de columna de los SP sp_ws_contabilidad_*.
 */

export type Valor = string | number | boolean | null | undefined

/** Opción de un combo. */
export interface Opcion { id: string | number; nombre: string; codigo?: string | null }

/** Dónde se usa un registro (alerta de eliminar). */
export interface Uso { tabla: string; descripcion: string; cantidad: number }
export interface ResultadoEliminar { eliminado: boolean; usos: Uso[] }

// ------------------------------------------------------------------ Personas y Empresas
export const RELACIONES = [
    { id: '01', nombre: 'Cliente' },
    { id: '02', nombre: 'Proveedor' },
    { id: '03', nombre: 'Trabajador' },
    { id: '04', nombre: 'Control Interno' },
] as const

export interface FilaPersona {
    Codigo: string; Nombre: string | null; NombreComercial: string | null; TipoDocIdent: string | null; TipoDocumento: string | null
    RUC: string | null; Direccion: string | null; referenciaDireccion: string | null; Telefono: string | null; correoElectronico: string | null
    otros: string | null; idDistrito: number | null; Ciudad: string | null; FECHA_INICIO: string | null; Relacion: string | null
    TipoRelacion: string | null; CtaContab: number | null; CodCtaContab: string | null; Codigo_Ved: string | null; Vendedor: string | null
    IdZona: string | null; LineaCredito: string | number | null; TipoCliente: string | null
}

export interface CatalogosPersonas {
    relaciones: (Opcion & { idCuenta: number | null; codigoCuenta: string | null })[]
    documentos: Opcion[]
    cuentas: Opcion[]
    vendedores: Opcion[]
    zonas: Opcion[]
    distritos: Opcion[]
}

/** Ficha de la persona: los campos del form Access [Perosnas y Empresas]. */
export interface FichaPersona {
    nuevo: boolean
    codigo: string; nombre: string; nombreComercial: string; tipoDoc: string; ruc: string
    direccion: string; idDistrito: string; referencia: string; correo: string; otros: string; telefono: string
    fechaInicio: string; relacion: string; ctaContable: string
    codigoVendedor: string; idZona: string; lineaCredito: string; tipoCliente: string
}

// ------------------------------------------------------------------ Tipo de cambio
export interface FilaTipoCambio {
    Fecha: string; Compra: number; Venta: number; FechaRegistros: string | null
    aviso_compra_mayor_venta: boolean; compras_usd: number; ventas_usd: number
}
export interface FechaFaltante { Fecha: string; compras_usd: number; ventas_usd: number }

// ------------------------------------------------------------------ Bienes y Servicios
export interface FilaArticulo {
    IdArticulo: number; Codigo_Art: string | null; NombreItem: string | null
    SubLinea: number | null; Cod_Lote: string | null; SubGrupo: string | null; Grupo: string | null
    Unidad: string | null; UnidadDescripcion: string | null; TipoExistencia: string | null; TipoExistenciaDescripcion: string | null
    Equivalencia: number | null; Id_Fiscalizado: number | null; Fiscalizado: string | null
    Item_Relacionado: number | null; AbreviadoRelacionado: string | null
    CtaCargoCosto: number | null; CodCtaCargoCosto: string | null; CtaAbonoCosto: number | null; CodCtaAbonoCosto: string | null
    CtaCargoCostoVtas: number | null; CodCtaCostoVentas: string | null; CtaExistencias: number | null; CodCtaExistencias: string | null
    CtaProduccion: number | null; CodCtaProduccion: string | null; ctaVentas: number | null; CodCtaVentas: string | null
    osce: number | null; CodigoOsce: string | null; DescripcionOsce: string | null
    CodigoAsisa: string | null; idMarca: number | null; Medida: string | null; Presentacion: string | null; PrincipioAdictivo: string | null
    otros1: string | null; otros2: string | null
    precio1: string | number | null; precio2: string | number | null; precio3: string | number | null; precio4: string | number | null
    icbper: number | null
}

export type GrupoCuenta = 'cargoCosto' | 'abonoCosto' | 'costoVentas' | 'existencias' | 'produccion' | 'ventas'

export interface CatalogosArticulos {
    subGrupos: (Opcion & { grupo: string | null })[]
    unidades: (Opcion & { abreviatura: string | null })[]
    tiposExistencia: Opcion[]
    fiscalizados: Opcion[]
    cuentas: Record<GrupoCuenta, Opcion[]>
}

/** Ficha del artículo: los campos del form Access [Bienes y Servicios 2]. */
export interface FichaArticulo {
    id: number | null
    subGrupo: string; codigo: string; nombre: string; unidad: string; tipoExistencia: string
    medida: string; tipo: string; modelo: string; marca: string; otros1: string; otros2: string
    precio1: string; precio2: string; precio3: string; precio4: string; icbper: boolean
    equivalencia: string; fiscalizado: string; abreviado: string; osce: string; osceTexto: string; control: string
    itemRelacionado: string
    ctaCargoCosto: string; ctaAbonoCosto: string; ctaCostoVentas: string; ctaExistencias: string; ctaProduccion: string; ctaVentas: string
}

export interface CodigoOsce { id: number; codigo: string; descripcion: string }

export interface FilaArticuloOsce {
    IdArticulo: number; Codigo_Art: string | null; NombreItem: string | null
    osce: number | null; CodigoOsce: string | null; DescripcionOsce: string | null
    Unidad: string | null; AbrevUnidMed: string | null; TipoExistencia: string | null; TipoExistenciaDescripcion: string | null
}

// ------------------------------------------------------------------ IGV
export interface FilaIgv {
    idIGV: number; Tasa: number; Concepto: string | null; FechaInicio: string | null; FechaFinal: string | null
    CtaContab: number | null; CodCtaDebito: string | null; CtaContabCredito: number | null; CodCtaCredito: string | null
    aviso_fechas_invertidas: boolean; compras: number; ventas_contables: number; guias: number; comprobantes_web: number
}

/** Ficha del IGV: tasa en porcentaje (18 = 18 %), como la muestra Access. */
export interface FichaIgv {
    id: number | null; tasa: string; concepto: string; fechaInicio: string; fechaFinal: string; ctaDebito: string; ctaCredito: string
}

// ------------------------------------------------------------------ Año y Meses
export interface FilaAnio { Anio: string; mayor_auxiliar: number; diario: number; compras: number; ventas: number }
export interface FilaMes { Numero: string; Mes: string; Dias: number; mayor_auxiliar: number; compras: number }
