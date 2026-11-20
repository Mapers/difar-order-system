'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Upload, RefreshCw, Smartphone, AlertTriangle, FileUp } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { AppMovilService, mensajeDeError } from "@/app/services/app-movil/AppMovilService"
import { AccionVersionApp, APK_PESO_MAXIMO, DispositivoApp, EstadoVersionApp, VersionApp } from "@/app/types/app-movil-types"

interface AppMovilSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

const ESTILO_ESTADO: Record<EstadoVersionApp, string> = {
    PUBLICADA: "bg-green-100 text-green-800 border-green-200",
    BORRADOR: "bg-slate-100 text-slate-700 border-slate-200",
    RETIRADA: "bg-amber-100 text-amber-800 border-amber-200",
    ANULADA: "bg-red-50 text-red-700 border-red-200",
}

const TEXTO_ACCION: Record<AccionVersionApp, { titulo: string; detalle: string; boton: string }> = {
    PUBLICAR: {
        titulo: "Publicar versión",
        detalle: "Los celulares la verán al abrir la app. Si hay otra versión publicada, pasa a “Retirada”.",
        boton: "Publicar",
    },
    RETIRAR: {
        titulo: "Retirar versión",
        detalle: "La app dejará de ofrecerla. Los celulares que ya la instalaron no cambian.",
        boton: "Retirar",
    },
    ANULAR: {
        titulo: "Anular borrador",
        detalle: "Se borra el archivo del servidor. El borrador queda en el historial como “Anulada”.",
        boton: "Anular",
    },
}

/** Las fechas llegan ya en hora de Perú: se muestran tal cual (sin volver a convertir). */
function fechaPeru(valor: string | null): string {
    if (!valor) return "—"
    const d = new Date(valor)
    if (isNaN(d.getTime())) return String(valor)
    return d.toLocaleString("es-PE", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" })
}

function pesoMb(bytes: number): string {
    return `${(Number(bytes || 0) / (1024 * 1024)).toFixed(1)} MB`
}

export default function AppMovilSection({ onOpenModalChange }: AppMovilSectionProps) {
    const [versiones, setVersiones] = useState<VersionApp[]>([])
    const [dispositivos, setDispositivos] = useState<DispositivoApp[]>([])
    const [loading, setLoading] = useState(true)
    const [filtroEstado, setFiltroEstado] = useState<EstadoVersionApp | 'TODOS'>('TODOS')
    const [verCelulares, setVerCelulares] = useState(false)

    const [modalSubir, setModalSubir] = useState(false)
    const [archivo, setArchivo] = useState<File | null>(null)
    const [notas, setNotas] = useState("")
    const [obligatoria, setObligatoria] = useState(false)
    const [subiendo, setSubiendo] = useState(false)
    const [avance, setAvance] = useState(0)
    const [errorArchivo, setErrorArchivo] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const [confirmar, setConfirmar] = useState<{ version: VersionApp; accion: AccionVersionApp } | null>(null)
    const [procesando, setProcesando] = useState(false)
    const [descargando, setDescargando] = useState<number | null>(null)

    const cargar = useCallback(async () => {
        setLoading(true)
        try {
            const [v, d] = await Promise.all([
                AppMovilService.listarVersiones(),
                AppMovilService.listarDispositivos(),
            ])
            setVersiones(v)
            setDispositivos(d)
        } catch (error: any) {
            setVersiones([])
            setDispositivos([])
            toast({ title: "Error", description: await mensajeDeError(error, "No se pudieron cargar las versiones de la app."), variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    const abrirSubir = useCallback(() => {
        setArchivo(null)
        setNotas("")
        setObligatoria(false)
        setAvance(0)
        setErrorArchivo("")
        setModalSubir(true)
    }, [])

    useEffect(() => { onOpenModalChange(abrirSubir) }, [onOpenModalChange, abrirSubir])

    const publicada = useMemo(() => versiones.find(v => v.estado === 'PUBLICADA') || null, [versiones])
    const visibles = useMemo(
        () => versiones.filter(v => filtroEstado === 'TODOS' ? v.estado !== 'ANULADA' : v.estado === filtroEstado),
        [versiones, filtroEstado],
    )
    const desactualizados = useMemo(
        () => publicada ? dispositivos.filter(d => d.version_codigo < publicada.version_codigo) : [],
        [dispositivos, publicada],
    )

    const elegirArchivo = (f: File | null) => {
        setErrorArchivo("")
        if (!f) { setArchivo(null); return }
        if (!f.name.toLowerCase().endsWith(".apk")) { setArchivo(null); setErrorArchivo("Solo se aceptan archivos .apk"); return }
        if (f.size > APK_PESO_MAXIMO) { setArchivo(null); setErrorArchivo("El APK supera el máximo de 150 MB"); return }
        setArchivo(f)
    }

    const guardar = async (publicar: boolean) => {
        if (!archivo) { setErrorArchivo("Elige el archivo .apk"); return }
        setSubiendo(true)
        setAvance(0)
        try {
            const r = await AppMovilService.subir(archivo, { notas, obligatoria, publicar }, setAvance)
            toast({ title: `Versión ${r.version_nombre} (código ${r.version_codigo})`, description: r.mensaje })
            setModalSubir(false)
            await cargar()
        } catch (error: any) {
            toast({ title: "No se pudo subir", description: await mensajeDeError(error, "Error al subir el APK."), variant: "destructive" })
        } finally {
            setSubiendo(false)
        }
    }

    const ejecutarAccion = async () => {
        if (!confirmar) return
        setProcesando(true)
        try {
            const mensaje = await AppMovilService.cambiarEstado(confirmar.version.id_version, confirmar.accion)
            toast({ title: `Versión ${confirmar.version.version_nombre}`, description: mensaje })
            setConfirmar(null)
            await cargar()
        } catch (error: any) {
            toast({ title: "No se pudo completar", description: await mensajeDeError(error, "Error al cambiar el estado."), variant: "destructive" })
        } finally {
            setProcesando(false)
        }
    }

    const descargar = async (v: VersionApp) => {
        setDescargando(v.id_version)
        try {
            await AppMovilService.descargar(v)
        } catch (error: any) {
            toast({ title: "No se pudo descargar", description: await mensajeDeError(error, "Error al descargar el APK."), variant: "destructive" })
        } finally {
            setDescargando(null)
        }
    }

    const accionesDe = (v: VersionApp): AccionVersionApp[] =>
        v.estado === 'BORRADOR' ? ['PUBLICAR', 'ANULAR']
            : v.estado === 'PUBLICADA' ? ['RETIRAR']
                : v.estado === 'RETIRADA' ? ['PUBLICAR']
                    : []

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
        )
    }

    return (
        <div className="space-y-5">
            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">Versión publicada</div>
                    <div className="text-2xl font-bold">
                        {publicada ? publicada.version_nombre : "Ninguna"}
                        {publicada && <span className="ml-2 text-xs font-medium text-muted-foreground">(código {publicada.version_codigo})</span>}
                    </div>
                </div>
                <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">Celulares actualizados</div>
                    <div className="text-2xl font-bold">
                        {publicada ? `${dispositivos.length - desactualizados.length} de ${dispositivos.length}` : `${dispositivos.length} celulares`}
                    </div>
                </div>
                <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">Con versión vieja</div>
                    <div className={`text-2xl font-bold ${desactualizados.length ? 'text-amber-700' : ''}`}>
                        {desactualizados.length}
                        {dispositivos.length > 0 && (
                            <button type="button" onClick={() => setVerCelulares(v => !v)} className="ml-2 text-xs font-medium text-cyan-700 hover:underline">
                                {verCelulares ? "ocultar" : "ver celulares"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {verCelulares && (
                <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-2 font-semibold">Usuario</th>
                                <th className="p-2 font-semibold">Versión</th>
                                <th className="p-2 font-semibold">Celular</th>
                                <th className="p-2 font-semibold">Última vez que abrió la app</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dispositivos.map(d => {
                                const vieja = !!publicada && d.version_codigo < publicada.version_codigo
                                return (
                                    <tr key={d.id_dispositivo} className="border-t">
                                        <td className="p-2">{d.usuario || "—"}</td>
                                        <td className={`p-2 ${vieja ? 'text-amber-700 font-semibold' : ''}`}>
                                            {d.version_nombre || d.version_codigo} <span className="text-xs text-muted-foreground">({d.version_codigo})</span>
                                        </td>
                                        <td className="p-2 text-muted-foreground">{[d.modelo, d.so_version].filter(Boolean).join(" · ") || "—"}</td>
                                        <td className="p-2 text-muted-foreground">{fechaPeru(d.ultima_conexion)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">Plataforma: <b className="text-foreground">Android</b></span>
                <div className="flex items-center gap-2">
                    <Label htmlFor="am-estado" className="text-sm">Estado</Label>
                    <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as EstadoVersionApp | 'TODOS')}>
                        <SelectTrigger id="am-estado" className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODOS">Todos</SelectItem>
                            <SelectItem value="PUBLICADA">Publicada</SelectItem>
                            <SelectItem value="BORRADOR">Borrador</SelectItem>
                            <SelectItem value="RETIRADA">Retirada</SelectItem>
                            <SelectItem value="ANULADA">Anulada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" size="sm" onClick={cargar} className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </Button>
            </div>

            {/* Versiones */}
            {visibles.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    <Smartphone className="mx-auto mb-2 h-8 w-8" />
                    {versiones.length === 0
                        ? <>Todavía no se subió ninguna versión. Usa <b>Subir nueva versión</b>.</>
                        : "No hay versiones con ese estado."}
                </div>
            ) : (
                <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-sm min-w-[860px]">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="p-3 font-semibold">Versión</th>
                                <th className="p-3 font-semibold">Archivo</th>
                                <th className="p-3 font-semibold">Novedades</th>
                                <th className="p-3 font-semibold">Estado</th>
                                <th className="p-3 font-semibold">Subido por / fecha</th>
                                <th className="p-3 font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(v => (
                                <tr key={v.id_version} className="border-t align-top">
                                    <td className="p-3">
                                        <div className="font-semibold">{v.version_nombre}</div>
                                        <div className="text-xs text-muted-foreground">código {v.version_codigo}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="break-all">{v.archivo_nombre}</div>
                                        <div className="text-xs text-muted-foreground">{pesoMb(v.peso_bytes)}</div>
                                    </td>
                                    <td className="p-3 max-w-[260px] whitespace-pre-line text-muted-foreground">{v.notas || "—"}</td>
                                    <td className="p-3">
                                        <Badge variant="outline" className={ESTILO_ESTADO[v.estado]}>{v.estado.charAt(0) + v.estado.slice(1).toLowerCase()}</Badge>
                                        {Number(v.obligatoria) === 1 && <div className="mt-1 text-xs font-semibold text-red-700">Obligatoria</div>}
                                        {v.estado === 'PUBLICADA' && v.fecha_publicacion && (
                                            <div className="mt-1 text-xs text-muted-foreground">desde {fechaPeru(v.fecha_publicacion)}</div>
                                        )}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        <div>{v.usuario_registro || "—"}</div>
                                        <div className="text-xs">{fechaPeru(v.fecha_registro)}</div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {v.estado !== 'ANULADA' && (
                                                <Button variant="outline" size="icon" aria-label={`Descargar APK ${v.version_nombre}`}
                                                    disabled={descargando === v.id_version} onClick={() => descargar(v)}>
                                                    {descargando === v.id_version ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                </Button>
                                            )}
                                            {accionesDe(v).map(a => (
                                                <Button key={a} variant={a === 'PUBLICAR' ? 'default' : 'outline'} size="sm"
                                                    className={a === 'ANULAR' ? 'text-red-700' : ''}
                                                    onClick={() => setConfirmar({ version: v, accion: a })}>
                                                    {a === 'PUBLICAR' && v.estado === 'RETIRADA' ? 'Volver a publicar' : TEXTO_ACCION[a].boton}
                                                </Button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                Solo hay una versión publicada a la vez. La app la ofrece a los celulares que tengan un código menor.
                Volver a publicar una versión vieja no baja la versión a quienes ya tienen una más nueva.
            </p>

            {/* Subir */}
            <Dialog open={modalSubir} onOpenChange={(o) => { if (!subiendo) setModalSubir(o) }}>
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Subir nueva versión</DialogTitle>
                        <DialogDescription>
                            La versión y el código se leen solos del APK. Puedes guardarla como borrador o publicarla de una vez.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <label htmlFor="am-apk"
                            className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed bg-muted/30 p-6 text-center hover:bg-muted/50"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); if (!subiendo) elegirArchivo(e.dataTransfer.files?.[0] || null) }}>
                            <FileUp className="h-7 w-7 text-cyan-600" />
                            {archivo ? (
                                <>
                                    <span className="text-sm font-semibold break-all">{archivo.name}</span>
                                    <span className="text-xs text-muted-foreground">{pesoMb(archivo.size)} · clic para cambiar</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm font-semibold">Elige o arrastra el archivo .apk</span>
                                    <span className="text-xs text-muted-foreground">Máximo 150 MB</span>
                                </>
                            )}
                            <input id="am-apk" ref={inputRef} type="file" accept=".apk,application/vnd.android.package-archive" className="hidden"
                                disabled={subiendo} onChange={(e) => elegirArchivo(e.target.files?.[0] || null)} />
                        </label>
                        {errorArchivo && <p className="text-sm text-red-600">{errorArchivo}</p>}
                        {subiendo && (
                            <div className="space-y-1">
                                <Progress value={avance} />
                                <p className="text-xs text-muted-foreground">
                                    {avance < 100 ? `Subiendo… ${avance} %` : "Revisando el APK en el servidor…"}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="am-notas">Novedades (las verá el vendedor)</Label>
                            <Textarea id="am-notas" rows={4} value={notas} disabled={subiendo} maxLength={4000}
                                placeholder={"• Qué se corrigió\n• Qué hay de nuevo"} onChange={(e) => setNotas(e.target.value)} />
                        </div>

                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <Checkbox id="am-obl" checked={obligatoria} disabled={subiendo} onCheckedChange={(c) => setObligatoria(c === true)} />
                            <Label htmlFor="am-obl" className="text-sm font-normal leading-snug">
                                <b>Actualización obligatoria.</b> El vendedor no podrá seguir usando la app hasta instalar esta versión.
                            </Label>
                        </div>

                        <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>Se valida antes de guardar: que sea un APK real, que su código no exista ya y que sea mayor que el de la versión publicada.</span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="ghost" disabled={subiendo} onClick={() => setModalSubir(false)}>Cancelar</Button>
                        <Button variant="outline" disabled={subiendo || !archivo} onClick={() => guardar(false)}>Guardar borrador</Button>
                        <Button disabled={subiendo || !archivo} onClick={() => guardar(true)} className="gap-2">
                            <Upload className="h-4 w-4" /> Guardar y publicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmar publicar / retirar / anular */}
            <Dialog open={!!confirmar} onOpenChange={(o) => { if (!o && !procesando) setConfirmar(null) }}>
                <DialogContent className="sm:max-w-[440px]">
                    {confirmar && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{TEXTO_ACCION[confirmar.accion].titulo} {confirmar.version.version_nombre}</DialogTitle>
                                <DialogDescription>{TEXTO_ACCION[confirmar.accion].detalle}</DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button variant="ghost" disabled={procesando} onClick={() => setConfirmar(null)}>Cancelar</Button>
                                <Button variant={confirmar.accion === 'ANULAR' ? 'destructive' : 'default'} disabled={procesando} onClick={ejecutarAccion}>
                                    {procesando ? "Procesando…" : TEXTO_ACCION[confirmar.accion].boton}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
