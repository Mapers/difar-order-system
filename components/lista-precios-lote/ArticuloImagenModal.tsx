'use client'

import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageOff, Loader2, Trash2, Upload } from "lucide-react";
import { publicApi } from "@/app/api/client";
import { PriceService } from "@/app/services/price/PriceService";
import { toast } from "@/app/hooks/useToast";

const PESO_MAXIMO = 2 * 1024 * 1024;
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface ProductoImagen {
    codigo: string;
    descripcion?: string;
    presentacion?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    producto: ProductoImagen | null;
    ruta: string | null;
    puedeGestionar: boolean;
    usuarioMod?: string;
    onImagenChange: (codigo: string, ruta: string | null) => void;
}

export function ArticuloImagenModal({
    open, onOpenChange, producto, ruta, puedeGestionar, usuarioMod, onImagenChange,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [subiendo, setSubiendo]   = useState(false);
    const [borrando, setBorrando]   = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [arrastrando, setArrastrando] = useState(false);

    const profundidadArrastre = useRef(0);

    useEffect(() => {
        if (!open) {
            setConfirmando(false);
            setArrastrando(false);
            profundidadArrastre.current = 0;
        }
    }, [open]);

    const urlImagen = ruta ? `${publicApi}${ruta}` : null;
    const ocupado = subiendo || borrando;

    const elegirArchivo = () => inputRef.current?.click();

    const subir = async (archivo: File) => {
        if (!producto) return;

        if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
            toast({ title: "", description: "Solo se permiten imágenes JPG, PNG o WEBP", variant: "error" });
            return;
        }
        if (archivo.size > PESO_MAXIMO) {
            toast({ title: "", description: "La imagen supera el tamaño máximo de 2 MB", variant: "error" });
            return;
        }

        setSubiendo(true);
        try {
            const res = await PriceService.guardarImagenArticulo(producto.codigo, archivo, usuarioMod);
            const nuevaRuta = res?.data?.ruta ?? null;
            if (!nuevaRuta) throw new Error("El servidor no devolvió la ruta de la imagen");

            onImagenChange(producto.codigo, nuevaRuta);
            toast({ title: "", description: "Imagen guardada correctamente", variant: "success" });
        } catch (error: any) {
            const mensaje = error?.response?.data?.message || "No se pudo guardar la imagen";
            toast({ title: "", description: mensaje, variant: "error" });
        } finally {
            setSubiendo(false);
        }
    };

    const eliminar = async () => {
        if (!producto) return;

        setBorrando(true);
        try {
            await PriceService.eliminarImagenArticulo(producto.codigo);
            onImagenChange(producto.codigo, null);
            setConfirmando(false);
            toast({ title: "", description: "Imagen eliminada correctamente", variant: "success" });
        } catch (error: any) {
            const mensaje = error?.response?.data?.message || "No se pudo eliminar la imagen";
            toast({ title: "", description: mensaje, variant: "error" });
        } finally {
            setBorrando(false);
        }
    };

    const puedeSoltar = puedeGestionar && !ocupado;

    const alEntrarArrastre = (evento: React.DragEvent) => {
        if (!puedeSoltar) return;
        evento.preventDefault();
        profundidadArrastre.current += 1;
        setArrastrando(true);
    };

    const alSalirArrastre = (evento: React.DragEvent) => {
        if (!puedeSoltar) return;
        evento.preventDefault();
        profundidadArrastre.current = Math.max(0, profundidadArrastre.current - 1);
        if (profundidadArrastre.current === 0) setArrastrando(false);
    };

    const alArrastrarEncima = (evento: React.DragEvent) => {
        if (!puedeSoltar) return;
        evento.preventDefault();
        evento.dataTransfer.dropEffect = 'copy';
    };

    const alSoltar = (evento: React.DragEvent) => {
        if (!puedeSoltar) return;
        evento.preventDefault();
        profundidadArrastre.current = 0;
        setArrastrando(false);

        const archivo = evento.dataTransfer.files?.[0];
        if (archivo) subir(archivo);
    };

    const alSeleccionar = (evento: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = evento.target.files?.[0];
        evento.target.value = '';
        if (archivo) subir(archivo);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!ocupado) onOpenChange(v); }}>
            <DialogContent className="max-h-[95vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        {producto?.descripcion || producto?.codigo || "Imagen del producto"}
                    </DialogTitle>
                    <DialogDescription>
                        {[producto?.codigo, producto?.presentacion].filter(Boolean).join(" · ") || "Imagen del producto"}
                    </DialogDescription>
                </DialogHeader>

                <div
                    onDragEnter={alEntrarArrastre}
                    onDragLeave={alSalirArrastre}
                    onDragOver={alArrastrarEncima}
                    onDrop={alSoltar}
                    onClick={() => { if (puedeSoltar && !urlImagen) elegirArchivo(); }}
                    className={`relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border p-2 transition
                        ${arrastrando
                            ? 'border-2 border-dashed border-blue-500 bg-blue-50'
                            : puedeGestionar && !urlImagen
                                ? 'cursor-pointer border-dashed bg-muted/40 hover:border-blue-400 hover:bg-muted'
                                : 'bg-muted/40'}`}
                >
                    {urlImagen ? (
                        <img
                            src={urlImagen}
                            alt={producto?.descripcion || producto?.codigo || "Producto"}
                            className="max-h-[320px] w-auto max-w-full rounded object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                            <ImageOff className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">Este producto no tiene imagen</p>
                            {puedeGestionar && (
                                <p className="text-xs text-muted-foreground">
                                    Arrastra una imagen aquí o haz clic para elegirla.
                                    <br />
                                    JPG, PNG o WEBP de hasta 2 MB.
                                </p>
                            )}
                        </div>
                    )}

                    {arrastrando && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-blue-50/90 text-center">
                            <Upload className="h-10 w-10 text-blue-600" />
                            <p className="text-sm font-medium text-blue-800">
                                {urlImagen ? "Suelta para reemplazar la imagen" : "Suelta la imagen aquí"}
                            </p>
                        </div>
                    )}

                    {subiendo && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium">Subiendo imagen...</p>
                        </div>
                    )}
                </div>

                {puedeGestionar && (
                    <>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={alSeleccionar}
                        />

                        {confirmando ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800">
                                    ¿Eliminar la imagen de este producto?
                                </p>
                                <p className="mt-1 text-xs text-red-700">
                                    El archivo se borra del servidor y no se puede recuperar.
                                </p>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={eliminar}
                                        disabled={borrando}
                                        className="flex items-center gap-1.5"
                                    >
                                        {borrando
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <Trash2 className="h-4 w-4" />}
                                        Sí, eliminar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConfirmando(false)}
                                        disabled={borrando}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    onClick={elegirArchivo}
                                    disabled={ocupado}
                                    className="flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 sm:flex-1"
                                >
                                    {subiendo
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Upload className="h-4 w-4" />}
                                    {subiendo ? "Subiendo..." : urlImagen ? "Reemplazar imagen" : "Subir imagen"}
                                </Button>

                                {urlImagen && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmando(true)}
                                        disabled={ocupado}
                                        className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
