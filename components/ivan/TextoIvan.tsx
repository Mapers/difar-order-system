'use client'

import { Fragment, ReactNode, useMemo } from 'react'
import { DocumentoPdfLink } from '@/components/reporte/DocumentoPdfLink'

const COMPROBANTE = /([A-Z][A-Z0-9]{2,3}-\d{3,10})/
const ES_COMPROBANTE = /^[A-Z][A-Z0-9]{2,3}-\d{3,10}$/
const NEGRITA = /(\*\*[^*]+\*\*)/

/** Texto en línea: **negritas** y comprobantes como enlace a su PDF. */
function enLinea(texto: string, clave: string): ReactNode[] {
    return texto.split(NEGRITA).flatMap((trozo, i) => {
        const esNegrita = trozo.startsWith('**') && trozo.endsWith('**') && trozo.length > 4
        const contenido = esNegrita ? trozo.slice(2, -2) : trozo
        const partes = contenido.split(COMPROBANTE).map((p, j) =>
            ES_COMPROBANTE.test(p)
                ? <DocumentoPdfLink key={`${clave}-${i}-${j}`} numeroComprobante={p}
                                    className="align-baseline font-medium underline decoration-dotted underline-offset-2 dark:text-blue-300" />
                : <Fragment key={`${clave}-${i}-${j}`}>{p}</Fragment>)
        return esNegrita
            ? [<strong key={`${clave}-b${i}`} className="font-semibold text-foreground">{partes}</strong>]
            : partes
    })
}

/**
 * Respuesta de IVAN con formato ligero: párrafos, viñetas ("- "), negritas y
 * enlaces a comprobantes. `escribiendo` muestra el cursor parpadeante.
 */
export function TextoIvan({ texto, escribiendo = false }: { texto: string; escribiendo?: boolean }) {
    const bloques = useMemo(() => {
        const salida: { tipo: 'p' | 'ul'; lineas: string[] }[] = []
        for (const linea of texto.split('\n')) {
            const vineta = /^\s*[-•]\s+/.test(linea)
            if (!linea.trim()) { salida.push({ tipo: 'p', lineas: [] }); continue }
            const ultimo = salida[salida.length - 1]
            const tipo = vineta ? 'ul' : 'p'
            const limpia = vineta ? linea.replace(/^\s*[-•]\s+/, '') : linea
            if (ultimo && ultimo.tipo === tipo && (tipo === 'ul' || ultimo.lineas.length)) ultimo.lineas.push(limpia)
            else salida.push({ tipo, lineas: [limpia] })
        }
        return salida.filter(b => b.lineas.length)
    }, [texto])

    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {bloques.map((b, i) => b.tipo === 'ul' ? (
                <ul key={i} className={`space-y-1 ${escribiendo && i === bloques.length - 1 ? 'ivan-cursor' : ''}`}>
                    {b.lineas.map((l, j) => (
                        <li key={j} className="flex gap-2">
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                            <span className="min-w-0">{enLinea(l, `${i}-${j}`)}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p key={i} className={escribiendo && i === bloques.length - 1 ? 'ivan-cursor' : ''}>
                    {b.lineas.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{enLinea(l, `${i}-${j}`)}</Fragment>)}
                </p>
            ))}
        </div>
    )
}
