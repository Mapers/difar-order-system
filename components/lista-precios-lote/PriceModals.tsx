import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { PriceMethodsService } from "@/app/dashboard/lista-precios-lote/services/priceMethodsService";

const formatDateToDDMMYYYY = (dateString: string) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return `${d.getUTCDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) { return dateString; }
};

const IgvBadge = ({ tipo, afecto }: { tipo: string; afecto: number }) => {
    if (afecto === 1) return <Badge className="bg-green-100 text-green-800 border-green-300">GRAVADO</Badge>;
    if (tipo === '20')  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">EXONERADO</Badge>;
    if (tipo === '30')  return <Badge className="bg-blue-100 text-blue-800 border-blue-300">INAFECTO</Badge>;
    return <Badge variant="outline">—</Badge>;
};

export const PriceModals = ({ modals, user, isAdmin }: any) => {
    const { lots, prices, kardex, selectedProduct } = modals;

    return (
        <>
            <Dialog open={lots.open} onOpenChange={lots.setOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalles de Lotes - {selectedProduct?.prod_codigo}</DialogTitle>
                        <DialogDescription>{selectedProduct?.prod_descripcion}</DialogDescription>
                    </DialogHeader>
                    {lots.loading ? <Skeleton className="h-32 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Fecha Vencimiento</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lots.data.map((lot: any, idx: number) => {
                                    const status = PriceMethodsService.getExpirationStatus(lot.fechaVencimiento);
                                    return (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono">{lot.numeroLote}</TableCell>
                                            <TableCell>{Number(lot.stock).toLocaleString("es-ES", { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>{formatDateToDDMMYYYY(lot.fechaVencimiento)}</TableCell>
                                            <TableCell><Badge variant={status.variant}>{status.status}</Badge></TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={prices.open} onOpenChange={prices.setOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalles de Precios</DialogTitle>
                        <DialogDescription>
                            {prices.data?.prod_codigo} - {prices.data?.prod_descripcion}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Precio Contado</Label>
                                {prices.isEditing ? (
                                    <Input
                                        value={prices.editForms.contado}
                                        onChange={(e) => prices.setEditForms({ ...prices.editForms, contado: e.target.value })}
                                        className="font-mono" placeholder="0.00"
                                    />
                                ) : (
                                    <div className="text-lg font-mono font-semibold text-green-600">
                                        S/ {prices.data?.precio_contado}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Precio Crédito</Label>
                                {prices.isEditing ? (
                                    <Input
                                        value={prices.editForms.credito}
                                        onChange={(e) => prices.setEditForms({ ...prices.editForms, credito: e.target.value })}
                                        className="font-mono" placeholder="0.00"
                                    />
                                ) : (
                                    <div className="text-lg font-mono font-semibold text-blue-600">
                                        S/ {prices.data?.precio_credito}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                {(Number(prices.data?.precio_bonif_cont) > 0 || prices.isEditing) && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Bonificación Contado</Label>
                                        {prices.isEditing ? (
                                            <Input
                                                value={prices.editForms.bonifCont}
                                                onChange={(e) => prices.setEditForms({ ...prices.editForms, bonifCont: e.target.value })}
                                                className="font-mono text-sm" placeholder="0.00"
                                            />
                                        ) : (
                                            <div className="text-sm font-mono">
                                                {Number(prices.data?.precio_bonif_cont) > 0
                                                    ? `S/ ${prices.data?.precio_bonif_cont}`
                                                    : 'No asignado'}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {(Number(prices.data?.precio_bonif_cred) > 0 || prices.isEditing) && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">Bonificación Crédito</Label>
                                        {prices.isEditing ? (
                                            <Input
                                                value={prices.editForms.bonifCred}
                                                onChange={(e) => prices.setEditForms({ ...prices.editForms, bonifCred: e.target.value })}
                                                className="font-mono text-sm" placeholder="0.00"
                                            />
                                        ) : (
                                            <div className="text-sm font-mono">
                                                {Number(prices.data?.precio_bonif_cred) > 0
                                                    ? `S/ ${prices.data?.precio_bonif_cred}`
                                                    : 'No asignado'}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <h4 className="text-sm font-semibold text-gray-700">Afectación IGV</h4>

                            {prices.isEditing ? (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="text-sm font-medium">Afecto a IGV</Label>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {prices.editForms.afectoIgv
                                                    ? 'El producto paga IGV (18%)'
                                                    : 'El producto NO paga IGV'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={prices.editForms.afectoIgv}
                                            onCheckedChange={(val) => prices.setEditForms({
                                                ...prices.editForms,
                                                afectoIgv: val,
                                                tipoAfectacion: val ? '10' : (prices.editForms.tipoAfectacion === '10' ? '30' : prices.editForms.tipoAfectacion),
                                                igvEstado: val ? 'I' : 'A',
                                                motivoIgv: val ? '' : prices.editForms.motivoIgv,
                                            })}
                                        />
                                    </div>

                                    {!prices.editForms.afectoIgv && (
                                        <>
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium">Tipo de Afectación</Label>
                                                <Select
                                                    value={prices.editForms.tipoAfectacion}
                                                    onValueChange={(val) => prices.setEditForms({
                                                        ...prices.editForms,
                                                        tipoAfectacion: val
                                                    })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar tipo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="20">
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                                                                20 — Exonerado
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="30">
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                                                                30 — Inafecto
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium">
                                                    Motivo
                                                    <span className="text-gray-400 font-normal ml-1">(opcional)</span>
                                                </Label>
                                                <Input
                                                    value={prices.editForms.motivoIgv}
                                                    onChange={(e) => prices.setEditForms({
                                                        ...prices.editForms,
                                                        motivoIgv: e.target.value
                                                    })}
                                                    placeholder="Ej: Medicamento esencial DS 027-2023"
                                                    maxLength={200}
                                                />
                                                <p className="text-xs text-gray-400 text-right">
                                                    {prices.editForms.motivoIgv?.length ?? 0}/200
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* Vista de solo lectura */
                                <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Estado IGV:</span>
                                            <IgvBadge
                                                tipo={prices.data?.tipo_afectacion_igv ?? '10'}
                                                afecto={prices.data?.afecto_igv ?? 1}
                                            />
                                        </div>
                                        {prices.data?.igv_motivo && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                <span className="font-medium">Motivo:</span> {prices.data.igv_motivo}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {isAdmin() && (
                            <div className="flex justify-end">
                                {!prices.isEditing ? (
                                    <Button variant="outline" onClick={() => prices.setIsEditing(true)} className="gap-1">
                                        <Edit className="h-4 w-4" /> Editar Precios
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => prices.setIsEditing(false)} disabled={prices.saving}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={prices.handleSavePrices} disabled={prices.saving} className="gap-1">
                                            {prices.saving ? "Guardando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {prices.escalas?.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">Escalas de Precio</h4>
                                {prices.loading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {prices.escalas.map((escala: any) => (
                                            <div key={escala.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-sm">{escala.desde} - {escala.hasta} unidades</span>
                                                <span className="text-sm font-mono font-semibold">S/ {escala.precio.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {prices.bonificaciones?.length > 0 && (
                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-3">Productos Bonificados</h4>
                                {prices.loading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {prices.bonificaciones.map((bonificacion: any) => (
                                            <div key={bonificacion.id} className="p-3 bg-gray-50 rounded border">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-sm font-medium">
                                                        Compra {bonificacion.compra}, lleva {bonificacion.lleva}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1">{bonificacion.descripcion}</p>
                                                {!bonificacion.esMismoProducto && bonificacion.descripcionProducto && (
                                                    <p className="text-xs text-blue-600">Producto: {bonificacion.descripcionProducto}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={kardex.open} onOpenChange={kardex.setOpen}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Kardex de Inventario</DialogTitle>
                        <DialogDescription>Movimientos: {selectedProduct?.prod_codigo}</DialogDescription>
                    </DialogHeader>
                    {kardex.loading ? (
                        <div className="space-y-4 p-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Operación</TableHead>
                                    <TableHead>Doc</TableHead>
                                    <TableHead>Serie-Nro</TableHead>
                                    <TableHead className="text-right">Ingreso</TableHead>
                                    <TableHead className="text-right">Salida</TableHead>
                                    <TableHead className="text-right">Vta Total</TableHead>
                                    {isAdmin() && <TableHead>Cliente/Proveedor</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kardex.data.map((mov: any, idx: number) => (
                                    <TableRow key={idx}>
                                        <TableCell className="text-xs">{formatDateToDDMMYYYY(mov.fecha)}</TableCell>
                                        <TableCell><Badge variant="outline">{mov.nombre_operacion}</Badge></TableCell>
                                        <TableCell className="text-xs font-mono">{mov.tipo_documento}</TableCell>
                                        <TableCell className="text-xs font-mono">{mov.serie_doc}-{mov.nro_doc}</TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {mov.cantidad_ingresada > 0 ? `+${Number(mov.cantidad_ingresada).toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600 font-medium">
                                            {mov.cantidad_saliente > 0 ? `-${Number(mov.cantidad_saliente).toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">S/ {Number(mov.vta_total).toFixed(2)}</TableCell>
                                        {isAdmin() && (
                                            <TableCell className="text-xs max-w-[200px] truncate" title={mov.cliente}>
                                                {mov.cliente}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};