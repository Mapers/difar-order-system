'use client'

import { Fragment, useMemo } from 'react'
import { DocumentoPdfLink } from '@/components/reporte/DocumentoPdfLink'

const PARTIR = /([A-Z][A-Z0-9]{2,3}-\d{3,10})/
const ES_COMPROBANTE = /^[A-Z][A-Z0-9]{2,3}-\d{3,10}$/

export function TextoConComprobantes({ texto }: { texto: string }) {
    const partes = useMemo(() => texto.split(PARTIR), [texto])

    return (
        <>
            {partes.map((parte, i) =>
                ES_COMPROBANTE.test(parte) ? (
                    <DocumentoPdfLink
                        key={i}
                        numeroComprobante={parte}
                        className="align-baseline font-medium underline decoration-dotted underline-offset-2 dark:text-blue-300 dark:hover:text-blue-200"
                    />
                ) : (
                    <Fragment key={i}>{parte}</Fragment>
                )
            )}
        </>
    )
}
