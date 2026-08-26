'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, Loader2, Paperclip, Trash2, Upload } from 'lucide-react'
import { publicApi } from '@/app/api/client'
import { useAuth } from '@/context/authContext'
import {
    ReciboVoucher, VOUCHER_MAX, useReciboVouchers,
} from '@/app/hooks/useReciboVouchers'

interface Props {
    idRecibo: number | null
    anulado: boolean
    idEmisor: number | null
    abierto: boolean
}

const esPdf = (v: ReciboVoucher) => /\.pdf$/i.test(v.ruta)

export function VouchersRecibo({ idRecibo, anulado, idEmisor, abierto }: Props) {
    const { user, isAdmin } = useAuth()
    const { vouchers, cargando, subiendo, borrando, subir, eliminar } =
        useReciboVouchers(idRecibo, abierto)

    const inputRef = useRef<HTMLInputElement>(null)
    const [arrastrando, setArrastrando] = useState(false)
    const [confirmar, setConfirmar] = useState<number | null>(null)

    const puedeGestionar =
        !anulado &&
        user?.idUsuarioWeb != null &&
        (isAdmin() || user.idUsuarioWeb === idEmisor)

    const lleno = vouchers.length >= VOUCHER_MAX

    const alSubir = async (archivo?: File) => {
        if (!archivo || !user?.idUsuarioWeb) return
        await subir(archivo, user.idUsuarioWeb)
    }

    return (
        <div className="rounded-lg border">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
                <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">Vouchers</span>
                    <span className="text-xs text-muted-foreground">
                        {vouchers.length} de {VOUCHER_MAX}
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
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const archivo = e.target.files?.[0]
                    e.target.value = ''
                    alSubir(archivo)
                }}
            />

            <div
                onDragEnter={(e) => { if (puedeGestionar && !lleno) { e.preventDefault(); setArrastrando(true) } }}
                onDragLeave={(e) => { e.preventDefault(); setArrastrando(false) }}
                onDragOver={(e) => { if (puedeGestionar && !lleno) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' } }}
                onDrop={(e) => {
                    if (!puedeGestionar || lleno) return
                    e.preventDefault()
                    setArrastrando(false)
                    alSubir(e.dataTransfer.files?.[0])
                }}
                className={`p-3 transition ${arrastrando ? 'bg-blue-50' : ''}`}
            >
                {cargando && <Skeleton className="h-20 w-full" />}

                {!cargando && vouchers.length === 0 && (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                        {anulado
                            ? 'El recibo está anulado y no tiene vouchers adjuntos.'
                            : puedeGestionar
                                ? 'Arrastra un voucher aquí o usa Adjuntar. JPG, PNG, WEBP o PDF de hasta 5 MB.'
                                : 'Sin vouchers adjuntos.'}
                    </p>
                )}

                {!cargando && vouchers.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {vouchers.map(v => (
                            <div key={v.id_voucher} className="group relative overflow-hidden rounded-md border">
                                <a
                                    href={`${publicApi}${v.ruta}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={v.nombre_archivo}
                                    className="flex h-24 items-center justify-center bg-muted/40"
                                >
                                    {esPdf(v)
                                        ? <FileText className="h-8 w-8 text-red-600" />
                                        : <img
                                            src={`${publicApi}${v.ruta}`}
                                            alt={v.nombre_archivo}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />}
                                </a>

                                <p className="truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                                    {v.nombre_archivo}
                                </p>

                                {puedeGestionar && (
                                    confirmar === v.id_voucher ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/95 p-2">
                                            <p className="text-center text-[11px] font-medium">¿Eliminar?</p>
                                            <div className="flex gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-6 px-2 text-[11px]"
                                                    disabled={borrando === v.id_voucher}
                                                    onClick={async () => {
                                                        if (!user?.idUsuarioWeb) return
                                                        const ok = await eliminar(v.id_voucher, user.idUsuarioWeb)
                                                        if (ok) setConfirmar(null)
                                                    }}
                                                >
                                                    {borrando === v.id_voucher
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
                                            title="Eliminar voucher"
                                            onClick={() => setConfirmar(v.id_voucher)}
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
