import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, PackagePlus, AlertCircle, CheckCircle2 } from "lucide-react";
import apiClient from "@/app/api/client";

export const CreateProductModal = ({ laboratories, user, onProductCreated }: any) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);

    const [product, setProduct] = useState({
        Codigo_Art: "", NombreItem: "", SubLinea: "", Presentacion: "", Medida: "", PrincipioAdictivo: ""
    });
    const [prices, setPrices] = useState({
        PUContado: "", PUCredito: "", PUPorMayor: "", PUPorMenor: ""
    });
    const [escalas, setEscalas] = useState<any[]>([]);
    const [bonos, setBonos] = useState<any[]>([]);

    const resetForm = () => {
        setProduct({ Codigo_Art: "", NombreItem: "", SubLinea: "", Presentacion: "", Medida: "", PrincipioAdictivo: "" });
        setPrices({ PUContado: "", PUCredito: "", PUPorMayor: "", PUPorMenor: "" });
        setEscalas([]);
        setBonos([]);
        setAlertInfo(null);
    };

    const handleSave = async () => {
        setAlertInfo(null);

        if (!product.Codigo_Art || !product.NombreItem) {
            setAlertInfo({ type: 'error', message: "El código y el nombre del artículo son obligatorios." });
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/price/create', { ...product, ...prices });

            if (escalas.length > 0) {
                const scalePromises = escalas.map(escala =>
                    apiClient.post('/articulos/scale/upsert', {
                        code: product.Codigo_Art, min: escala.desde, max: escala.hasta, price: escala.precio, user: user?.nombreCompleto
                    })
                );
                await Promise.all(scalePromises);
            }

            if (bonos.length > 0) {
                const bonusPromises = bonos.map(bonus =>
                    apiClient.post('/articulos/bonus/upsert', {
                        code: product.Codigo_Art, description: bonus.descripcion, factor: bonus.compra, qty: bonus.lleva,
                        user: user?.nombreCompleto, sameProduct: bonus.esMismoProducto,
                        codProdBonus: bonus.esMismoProducto ? product.Codigo_Art : bonus.productoBonificado,
                        descProdBonus: bonus.esMismoProducto ? product.NombreItem : bonus.descripcionProducto
                    })
                );
                await Promise.all(bonusPromises);
            }

            setAlertInfo({ type: 'success', message: "¡Producto y configuraciones guardados con éxito!" });

            setTimeout(() => {
                setOpen(false);
                resetForm();
                if(onProductCreated) onProductCreated();
            }, 1500);

        } catch (error) {
            console.error(error);
            setAlertInfo({ type: 'error', message: "Hubo un problema al intentar crear el producto. Revisa la consola." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PackagePlus className="h-4 w-4" /> Crear Producto
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Crear Producto</DialogTitle>
                </DialogHeader>

                <div className="space-y-8 py-4">
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">1. Datos Generales</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1"><Label>Código Art. *</Label><Input value={product.Codigo_Art} onChange={e=>setProduct({...product, Codigo_Art: e.target.value})} maxLength={9}/></div>
                            <div className="space-y-1 md:col-span-2"><Label>Nombre del Ítem *</Label><Input value={product.NombreItem} onChange={e=>setProduct({...product, NombreItem: e.target.value})}/></div>
                            <div className="space-y-1">
                                <Label>Laboratorio</Label>
                                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={product.SubLinea} onChange={e=>setProduct({...product, SubLinea: e.target.value})}>
                                    <option value="">Seleccionar...</option>
                                    {laboratories?.map((l:any) => <option key={l.IdLineaGe} value={l.IdLineaGe}>{l.Descripcion}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1"><Label>Presentación</Label><Input value={product.Presentacion} onChange={e=>setProduct({...product, Presentacion: e.target.value})}/></div>
                            <div className="space-y-1"><Label>Medida</Label><Input value={product.Medida} onChange={e=>setProduct({...product, Medida: e.target.value})}/></div>
                            <div className="space-y-1 md:col-span-3"><Label>Principio Activo</Label><Input value={product.PrincipioAdictivo} onChange={e=>setProduct({...product, PrincipioAdictivo: e.target.value})}/></div>
                        </div>
                    </section>

                    <section className="border-t pt-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3">2. Precios Base</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1"><Label>PU Contado</Label><Input type="number" placeholder="0.00" value={prices.PUContado} onChange={e=>setPrices({...prices, PUContado: e.target.value})}/></div>
                            <div className="space-y-1"><Label>PU Crédito</Label><Input type="number" placeholder="0.00" value={prices.PUCredito} onChange={e=>setPrices({...prices, PUCredito: e.target.value})}/></div>
                            <div className="space-y-1"><Label>PU Por Mayor</Label><Input type="number" placeholder="0.00" value={prices.PUPorMayor} onChange={e=>setPrices({...prices, PUPorMayor: e.target.value})}/></div>
                            <div className="space-y-1"><Label>PU Por Menor</Label><Input type="number" placeholder="0.00" value={prices.PUPorMenor} onChange={e=>setPrices({...prices, PUPorMenor: e.target.value})}/></div>
                        </div>
                    </section>

                    <section className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase">3. Escalas de Precio</h3>
                            <Button size="sm" variant="outline" onClick={() => setEscalas([...escalas, { desde: "", hasta: "", precio: "" }])}>
                                <Plus className="h-4 w-4 mr-1" /> Añadir Escala
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {escalas.map((esc, i) => (
                                <div key={i} className="flex gap-2 items-end">
                                    <div className="flex-1"><Label className="text-xs">Mínimo</Label><Input type="number" value={esc.desde} onChange={e => { const v = [...escalas]; v[i].desde = e.target.value; setEscalas(v); }}/></div>
                                    <div className="flex-1"><Label className="text-xs">Máximo</Label><Input type="number" value={esc.hasta} onChange={e => { const v = [...escalas]; v[i].hasta = e.target.value; setEscalas(v); }}/></div>
                                    <div className="flex-1"><Label className="text-xs">Precio Unit.</Label><Input type="number" value={esc.precio} onChange={e => { const v = [...escalas]; v[i].precio = e.target.value; setEscalas(v); }}/></div>
                                    <Button variant="destructive" size="icon" onClick={() => setEscalas(escalas.filter((_, idx) => idx !== i))}><Trash className="h-4 w-4"/></Button>
                                </div>
                            ))}
                            {escalas.length === 0 && <p className="text-xs text-gray-400">No hay escalas definidas.</p>}
                        </div>
                    </section>

                    <section className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-gray-500 uppercase">4. Bonificaciones</h3>
                            <Button size="sm" variant="outline" onClick={() => setBonos([...bonos, { compra: "", lleva: "", descripcion: "", esMismoProducto: true, productoBonificado: "", descripcionProducto: "" }])}>
                                <Plus className="h-4 w-4 mr-1" /> Añadir Bonificación
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {bonos.map((bono, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-md border space-y-3 relative">
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500" onClick={() => setBonos(bonos.filter((_, idx) => idx !== i))}><Trash className="h-4 w-4"/></Button>

                                    <div className="grid grid-cols-2 gap-4 pr-8">
                                        <div className="space-y-1"><Label className="text-xs">Compra (Factor)</Label><Input type="number" value={bono.compra} onChange={e => { const v = [...bonos]; v[i].compra = e.target.value; setBonos(v); }}/></div>
                                        <div className="space-y-1"><Label className="text-xs">Lleva (Cantidad)</Label><Input type="number" value={bono.lleva} onChange={e => { const v = [...bonos]; v[i].lleva = e.target.value; setBonos(v); }}/></div>
                                    </div>

                                    <div className="space-y-1"><Label className="text-xs">Descripción de Promo</Label><Input placeholder="Ej. Por 10 Cajas lleva 2 gratis" value={bono.descripcion} onChange={e => { const v = [...bonos]; v[i].descripcion = e.target.value; setBonos(v); }}/></div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <input type="checkbox" checked={bono.esMismoProducto} onChange={(e) => { const v = [...bonos]; v[i].esMismoProducto = e.target.checked; setBonos(v); }} className="h-4 w-4 rounded border-gray-300" />
                                        <Label className="text-sm">Bonifica el mismo producto</Label>
                                    </div>

                                    {!bono.esMismoProducto && (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="space-y-1"><Label className="text-xs">Código Prod. Regalo</Label><Input value={bono.productoBonificado} onChange={e => { const v = [...bonos]; v[i].productoBonificado = e.target.value; setBonos(v); }}/></div>
                                            <div className="space-y-1"><Label className="text-xs">Nombre Prod. Regalo</Label><Input value={bono.descripcionProducto} onChange={e => { const v = [...bonos]; v[i].descripcionProducto = e.target.value; setBonos(v); }}/></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {bonos.length === 0 && <p className="text-xs text-gray-400">No hay bonificaciones definidas.</p>}
                        </div>
                    </section>
                </div>

                {alertInfo && (
                    <div className={`p-4 rounded-md flex items-center gap-3 ${
                        alertInfo.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                        {alertInfo.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                        <p className="text-sm font-medium">{alertInfo.message}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar Producto"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};