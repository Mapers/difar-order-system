'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Images, Loader2, Trash2, Upload } from 'lucide-react'
import { publicApi } from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import { REFERENCIA_MAX } from '@/app/types/cliente-referencia-types'
import { useClienteReferenciasImagenes } from '@/app/hooks/useClienteReferenciasImagenes'

interface Props {
    codigoCliente: string | null
    abierto: boolean
    puedeGestionar: boolean
    compacta?: boolean
    onCambio?: () => void
}

export function ReferenciasClienteGaleria({
    codigoCliente, abierto, puedeGestionar, compacta = false, onCambio,
}: Props) {
    const { user } = useAuth()
    const { imagenes, cargando, subiendo, borrando, subir, eliminar } =
        useClienteReferenciasImagenes(codigoCliente, abierto)

    const inputRef = useRef<HTMLInputElement>(null)
    const [arrastrando, setArrastrando] = useState(false)
    const [confirmar, setConfirmar] = useState<number | null>(null)

    const lleno = imagenes.length >= REFERENCIA_MAX
    const puedeSubir = puedeGestionar && !lleno && !subiendo

    const alSubir = async (archivo?: File) => {
        if (!archivo || !user?.idUsuarioWeb) return
        const ok = await subir(archivo, user.idUsuarioWeb)
        if (ok) onCambio?.()
    }

    const gridClase = compacta
        ? 'grid grid-cols-1 gap-2'
        : 'grid grid-cols-2 gap-2 sm:grid-cols-3'

    return (
        <div className="rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                <div className="flex items-center gap-2">
                    <Images className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Referencias</span>
                    <span className="text-xs text-muted-foreground">
                        {imagenes.length} de {REFERENCIA_MAX}
                    </span>
                </div>

                {puedeGestionar && !lleno && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        disabled={subiendo}
                        onClick={() => inputRef.current?.click()}
                    >
                        {subiendo
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Upload className="h-4 w-4" />}
                        Adjuntar
                    </Button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                    const archivo = e.target.files?.[0]
                    e.target.value = ''
                    alSubir(archivo)
                }}
            />

            <div
                onDragEnter={(e) => { if (puedeSubir) { e.preventDefault(); setArrastrando(true) } }}
                onDragLeave={(e) => { e.preventDefault(); setArrastrando(false) }}
                onDragOver={(e) => { if (puedeSubir) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }}
                onDrop={(e) => {
                    if (!puedeSubir) return
                    e.preventDefault()
                    setArrastrando(false)
                    alSubir(e.dataTransfer.files?.[0])
                }}
                className={`p-3 transition ${arrastrando ? 'bg-blue-50' : ''}`}
            >
                {cargando && <Skeleton className="h-24 w-full" />}

                {!cargando && imagenes.length === 0 && (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                        {puedeGestionar
                            ? 'Arrastra una imagen aquí o usa Adjuntar. JPG, PNG o WEBP de hasta 2 MB.'
                            : 'Este cliente no tiene imágenes de referencia.'}
                    </p>
                )}

                {!cargando && imagenes.length > 0 && (
                    <div className={gridClase}>
                        {imagenes.map(img => (
                            <div key={img.id_imagen} className="group relative overflow-hidden rounded-md border">
                                <a
                                    href={`${publicApi}${img.ruta}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={img.nombre_archivo}
                                    className="flex h-24 items-center justify-center bg-muted/40"
                                >
                                    <img
                                        src={`${publicApi}${img.ruta}`}
                                        alt={img.nombre_archivo}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                </a>

                                <p className="truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                                    {img.nombre_archivo}
                                </p>

                                {puedeGestionar && (
                                    confirmar === img.id_imagen ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/95 p-2">
                                            <p className="text-center text-[11px] font-medium">¿Eliminar?</p>
                                            <div className="flex gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-6 px-2 text-[11px]"
                                                    disabled={borrando === img.id_imagen}
                                                    onClick={async () => {
                                                        if (!user?.idUsuarioWeb) return
                                                        const ok = await eliminar(img.id_imagen, user.idUsuarioWeb)
                                                        if (ok) { setConfirmar(null); onCambio?.() }
                                                    }}
                                                >
                                                    {borrando === img.id_imagen
                                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                                        : 'Sí'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 px-2 text-[11px]"
                                                    onClick={() => setConfirmar(null)}
                                                >
                                                    No
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            title="Eliminar imagen"
                                            onClick={() => setConfirmar(img.id_imagen)}
                                            className="absolute right-1 top-1 rounded bg-background/90 p-1 text-red-600 opacity-0 transition group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
