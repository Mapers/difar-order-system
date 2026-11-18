/**
 * Pruebas de la lógica del borrador en el servidor (altas, ediciones, eliminaciones y conflictos).
 * Ejecutar: node --test lib/__tests__/borradorContable.test.mts   (Node 22.6+ ejecuta TypeScript sin compilar)
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularCambios, aplicarBorrador, aplicarCabecera, resumir } from '../borradorContable.ts'

type F = { id: number | null; key: number; eliminar: boolean; concepto: string; importe: string }
const fila = (id: number | null, key: number, concepto: string, importe = '10', eliminar = false): F => ({ id, key, eliminar, concepto, importe })
const cmp = (f: F) => ({ id: f.id, concepto: f.concepto, importe: Number(f.importe) || 0, eliminar: f.eliminar })
// Ida y vuelta por JSON, como pasa al guardarlo en MySQL y leerlo de nuevo
const porServidor = <T,>(x: T): T => JSON.parse(JSON.stringify(x))

const BASE = [fila(1, 1, 'A'), fila(2, 2, 'B'), fila(3, 3, 'C')]

test('sin cambios: no hay borrador', () => {
    assert.deepEqual(calcularCambios(BASE, BASE.map(f => ({ ...f })), cmp), [])
})

test('alta, edición, eliminación (E) y edición+eliminación se registran con su acción', () => {
    const actuales = [
        fila(1, 1, 'A editada'),          // editada
        fila(2, 2, 'B', '10', true),      // eliminada
        fila(3, 3, 'C cambiada', '5', true), // editada y además marcada E -> eliminada
        fila(null, -1, 'Nueva 1', '7'),   // nueva
        fila(null, -2, 'Nueva 2', '8'),   // nueva
    ]
    const c = calcularCambios(BASE, actuales, cmp)
    assert.deepEqual(c.map(x => [x.accion, x.id]), [['editada', 1], ['eliminada', 2], ['eliminada', 3], ['nueva', null], ['nueva', null]])
    assert.deepEqual(resumir(c), { nuevas: 2, editadas: 1, eliminadas: 2 })
    assert.equal(c[0].base?.concepto, 'A') // guarda cómo estaba en la base
    assert.deepEqual(c.map(x => x.orden), [1, 2, 3, 4, 5])
})

test('quitar una línea nueva antes de grabar: desaparece del borrador', () => {
    const conNueva = [...BASE, fila(null, -1, 'X')]
    assert.equal(calcularCambios(BASE, conNueva, cmp).length, 1)
    assert.equal(calcularCambios(BASE, BASE, cmp).length, 0)
})

test('desmarcar E vuelve a "sin cambios"', () => {
    const marcada = BASE.map(f => f.id === 2 ? { ...f, eliminar: true } : f)
    assert.equal(calcularCambios(BASE, marcada, cmp).length, 1)
    assert.equal(calcularCambios(BASE, marcada.map(f => ({ ...f, eliminar: false })), cmp).length, 0)
})

test('recuperar sobre la misma base: queda exactamente como estaba en pantalla', () => {
    const actuales = [fila(1, 1, 'A editada'), fila(2, 2, 'B', '10', true), fila(3, 3, 'C'), fila(null, -1, 'Nueva', '7')]
    const borrador = porServidor(calcularCambios(BASE, actuales, cmp))
    const r = aplicarBorrador(BASE, borrador, cmp, -1)
    assert.deepEqual(r.conflictos, [])
    assert.deepEqual(r.aplicado, { nuevas: 1, editadas: 1, eliminadas: 1 })
    assert.deepEqual(r.filas.map(cmp), actuales.map(cmp))
    assert.ok(r.filas[3].key < 0 && r.filas[3].id === null) // la nueva vuelve como nueva
    // y recalcular los cambios da el mismo borrador (no se pierde ni se duplica nada)
    assert.deepEqual(calcularCambios(BASE, r.filas, cmp).map(x => x.accion), ['editada', 'eliminada', 'nueva'])
})

test('conflicto: otra persona BORRÓ la línea que yo edité -> no se aplica y se avisa', () => {
    const borrador = porServidor(calcularCambios(BASE, [fila(1, 1, 'A mía'), BASE[1], BASE[2]], cmp))
    const hoy = [BASE[1], BASE[2]] // la 1 ya no existe
    const r = aplicarBorrador(hoy, borrador, cmp, -1)
    assert.equal(r.conflictos.length, 1)
    assert.equal(r.conflictos[0].tipo, 'ya-no-existe')
    assert.deepEqual(r.filas.map(cmp), hoy.map(cmp))
})

test('conflicto: otra persona CAMBIÓ la línea que yo edité -> se respeta lo de la base y se avisa', () => {
    const borrador = porServidor(calcularCambios(BASE, [fila(1, 1, 'A mía'), BASE[1], BASE[2]], cmp))
    const hoy = [fila(1, 1, 'A de otra persona'), BASE[1], BASE[2]]
    const r = aplicarBorrador(hoy, borrador, cmp, -1)
    assert.equal(r.conflictos[0].tipo, 'cambio-en-la-base')
    assert.equal(r.filas[0].concepto, 'A de otra persona')
})

test('conflicto: otra persona cambió la línea que yo marqué para eliminar -> no se elimina', () => {
    const borrador = porServidor(calcularCambios(BASE, [BASE[0], fila(2, 2, 'B', '10', true), BASE[2]], cmp))
    const hoy = [BASE[0], fila(2, 2, 'B', '99'), BASE[2]]
    const r = aplicarBorrador(hoy, borrador, cmp, -1)
    assert.equal(r.conflictos.length, 1)
    assert.equal(r.filas[1].eliminar, false)
})

test('otra persona cambió OTRA línea: mis cambios se aplican igual', () => {
    const borrador = porServidor(calcularCambios(BASE, [fila(1, 1, 'A mía'), BASE[1], BASE[2], fila(null, -1, 'N')], cmp))
    const hoy = [BASE[0], fila(2, 2, 'B de otra'), BASE[2]]
    const r = aplicarBorrador(hoy, borrador, cmp, -1)
    assert.deepEqual(r.conflictos, [])
    assert.deepEqual(r.filas.map(f => f.concepto), ['A mía', 'B de otra', 'C', 'N'])
})

test('"Guardar" grabó pero el borrador no se borró: no se duplica ni da conflicto', () => {
    const pantalla = [fila(1, 1, 'A editada'), BASE[1], BASE[2], fila(null, -1, 'Nueva', '7'), fila(null, -2, 'Nueva', '7')]
    const borrador = porServidor(calcularCambios(BASE, pantalla, cmp))
    // en la base ya está todo grabado: la edición y UNA de las dos nuevas iguales (la otra no llegó)
    const hoy = [fila(1, 1, 'A editada'), BASE[1], BASE[2], fila(4, 4, 'Nueva', '7')]
    const r = aplicarBorrador(hoy, borrador, cmp, -1)
    assert.deepEqual(r.conflictos, [])
    assert.equal(r.yaGrabadas, 2) // la edición y una nueva
    assert.equal(r.aplicado.nuevas, 1) // la segunda nueva igual sí se agrega
    assert.equal(r.filas.length, 5)
})

test('las keys de las líneas nuevas no chocan con las que ya hay en pantalla', () => {
    const borrador = porServidor(calcularCambios(BASE, [...BASE, fila(null, -1, 'N1'), fila(null, -2, 'N2')], cmp))
    const r = aplicarBorrador(BASE, borrador, cmp, -5)
    const keys = r.filas.map(f => f.key)
    assert.equal(new Set(keys).size, keys.length)
    assert.ok(r.proximaKey < Math.min(...keys))
})

test('MySQL reordena las claves del JSON: recuperar no depende del orden', () => {
    const revolver = (o: any): any => o && typeof o === 'object' && !Array.isArray(o)
        ? Object.fromEntries(Object.keys(o).sort((a, b) => a.length - b.length || a.localeCompare(b)).map(k => [k, revolver(o[k])]))
        : Array.isArray(o) ? o.map(revolver) : o
    const actuales = [fila(1, 1, 'A editada'), fila(2, 2, 'B', '10', true), BASE[2], fila(null, -1, 'Nueva', '7')]
    const borrador = revolver(porServidor(calcularCambios(BASE, actuales, cmp)))
    const r = aplicarBorrador(BASE, borrador, cmp, -1)
    assert.deepEqual(r.conflictos, [])
    assert.deepEqual(r.filas.map(cmp), actuales.map(cmp))
})

test('cabecera: aplica solo lo que cambié; si otra persona tocó el mismo campo, conflicto', () => {
    const base = { serie: 'F001', numero: '10', obs: '' }
    const mia = { serie: 'F001', numero: '11', obs: 'mía' }
    const hoyIgual = { ...base }
    assert.deepEqual(aplicarCabecera(hoyIgual, mia, base), { cabecera: mia, conflictos: [] })
    const hoyOtro = { serie: 'F002', numero: '12', obs: '' }
    const r = aplicarCabecera(hoyOtro, mia, base)
    assert.deepEqual(r.conflictos, ['numero'])            // los dos cambiaron el número
    assert.deepEqual(r.cabecera, { serie: 'F002', numero: '12', obs: 'mía' })
    // compra nueva (sin base): se toma todo lo del borrador
    assert.deepEqual(aplicarCabecera(base, mia, null).cabecera, mia)
})
