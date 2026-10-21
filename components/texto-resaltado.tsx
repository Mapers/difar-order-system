import { Fragment } from "react"

/** Mayúsculas y sin tildes, para comparar búsquedas: "Bazán" -> "BAZAN". */
export function normalizarBusqueda(texto: string | null | undefined): string {
  return (texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase()
}

/**
 * Normaliza carácter por carácter y guarda a qué posición del texto original
 * corresponde cada carácter normalizado, para poder resaltar sobre el texto
 * original aunque la búsqueda ignore tildes.
 */
function normalizarConMapa(texto: string) {
  let normalizado = ""
  const origen: number[] = []
  for (let i = 0; i < texto.length; i++) {
    const n = normalizarBusqueda(texto[i])
    normalizado += n
    for (let j = 0; j < n.length; j++) origen.push(i)
  }
  return { normalizado, origen }
}

/**
 * Muestra `texto` con las coincidencias de `busqueda` resaltadas en amarillo.
 * Ignora mayúsculas y tildes, igual que el filtro de la búsqueda.
 */
export function TextoResaltado({ texto, busqueda }: { texto: string | null | undefined; busqueda: string }) {
  const original = texto ?? ""
  const q = normalizarBusqueda(busqueda.trim())
  if (!q || !original) return <>{original}</>

  const { normalizado, origen } = normalizarConMapa(original)
  const partes: { texto: string; marca: boolean }[] = []
  let cursor = 0
  let desde = normalizado.indexOf(q)

  while (desde !== -1) {
    const ini = origen[desde]
    const fin = origen[desde + q.length - 1] + 1
    if (ini > cursor) partes.push({ texto: original.slice(cursor, ini), marca: false })
    partes.push({ texto: original.slice(ini, fin), marca: true })
    cursor = fin
    desde = normalizado.indexOf(q, desde + q.length)
  }
  if (cursor < original.length) partes.push({ texto: original.slice(cursor), marca: false })

  return (
      <>
        {partes.map((p, i) => p.marca
            ? <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-700/60">{p.texto}</mark>
            : <Fragment key={i}>{p.texto}</Fragment>)}
      </>
  )
}
