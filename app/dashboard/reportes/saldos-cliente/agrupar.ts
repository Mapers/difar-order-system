export interface GrupoCliente { cliente: any; documentos: any[]; soles: number; dolares: number }
export interface GrupoZona { nombre: string; clientes: GrupoCliente[]; soles: number; dolares: number }
export interface GrupoVendedor {
    clave: string; codigo: string; nombre: string; zonas: GrupoZona[];
    soles: number; dolares: number; nClientes: number; nDocumentos: number;
}

export const esSoles = (doc: any) => doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.'

/**
 * El reporte de saldo por cobrar viene por cliente (cliente -> vendedores ->
 * documentos). Se reagrupa por vendedor -> zona -> cliente, con los saldos
 * sumados en cada nivel. Lo usan la pantalla y el PDF.
 */
export function agruparPorVendedor(data: any): GrupoVendedor[] {
    if (!data?.Clientes) return []
    const porVendedor = new Map<string, GrupoVendedor>()
    for (const cli of data.Clientes) {
        for (const v of (cli.vendedores || [])) {
            const texto = String(v.Vendedor ?? '').trim()
            const codigo = String(v.CodigoVend || texto.split(' ')[0] || '').trim()
            // "C005 DIANA CHACON" -> nombre sin el código; si no empieza con el código, va tal cual.
            const nombre = codigo && texto.startsWith(`${codigo} `) ? texto.slice(codigo.length).trim() : texto
            const clave = codigo || texto || 'SIN VENDEDOR'
            if (!porVendedor.has(clave)) {
                porVendedor.set(clave, { clave, codigo, nombre: nombre || 'Sin vendedor', zonas: [], soles: 0, dolares: 0, nClientes: 0, nDocumentos: 0 })
            }
            const gv = porVendedor.get(clave)!
            const nombreZona = String(v.NombreZona || 'Sin zona').trim()
            let gz = gv.zonas.find(z => z.nombre === nombreZona)
            if (!gz) {
                gz = { nombre: nombreZona, clientes: [], soles: 0, dolares: 0 }
                gv.zonas.push(gz)
            }
            const documentos = v.documentos || []
            let soles = 0, dolares = 0
            for (const doc of documentos) {
                if (esSoles(doc)) soles += Number(doc.Saldo) || 0
                else dolares += Number(doc.Saldo) || 0
            }
            gz.clientes.push({ cliente: cli, documentos, soles, dolares })
            gz.soles += soles; gz.dolares += dolares
            gv.soles += soles; gv.dolares += dolares
            gv.nClientes += 1; gv.nDocumentos += documentos.length
        }
    }
    const lista = [...porVendedor.values()]
    lista.forEach(v => v.zonas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}
