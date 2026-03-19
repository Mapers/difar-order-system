import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Edit3, Save, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import apiClient from "@/app/api/client";
import {toast} from "@/app/hooks/use-toast";

interface RowData {
    codArticulo: string;
    nombre: string;
    presentacion: string;
    precioCredito: number | string;
    bonifCredito: number | string;
    isSaving?: boolean;
    isSuccess?: boolean;
    error?: boolean;
}

interface QuickPriceEditModalProps {
    filteredData?: Array<{
        codArticulo: string;
        nombre: string;
        presentacion: string;
        precioCredito: number;
        bonifCredito: number;
    }>;
}

export const QuickPriceEditModal = ({ filteredData = [] }: QuickPriceEditModalProps) => {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<RowData[]>([]);

    useEffect(() => {
        if (open) {
            setRows(filteredData.map(item => ({
                ...item,
                isSaving: false,
                isSuccess: false,
                error: false
            })));
        }
    }, [open, filteredData]);

    const handleInputChange = (index: number, field: 'precioCredito' | 'bonifCredito', value: string) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    const handleSaveRow = async (index: number) => {
        const row = rows[index];
        const newRows = [...rows];

        const pCredito = parseFloat(String(row.precioCredito)) || 0;
        const bCredito = parseFloat(String(row.bonifCredito)) || 0;

        const pContable = Number((pCredito * 0.97).toFixed(2));
        const bContable = Number((bCredito * 0.97).toFixed(2));

        newRows[index].isSaving = true;
        newRows[index].error = false;
        setRows(newRows);

        try {
            await apiClient.post('/price/list-prices/edit', {
                code: row.codArticulo,
                contado: pContable,
                credito: pCredito,
                contadoBonif: bContable,
                creditoBonif: bCredito
            });

            const successRows = [...rows];
            successRows[index].isSaving = false;
            successRows[index].isSuccess = true;
            successRows[index].error = false;
            setRows(successRows);

            setTimeout(() => {
                setRows(currentRows => {
                    const resetRows = [...currentRows];
                    if (resetRows[index]) resetRows[index].isSuccess = false;
                    return resetRows;
                });
            }, 2000);

            toast({title: 'Se actualizo los precios'})

        } catch (error) {
            console.error(`Error guardando artículo ${row.codArticulo}:`, error);
            const errorRows = [...rows];
            errorRows[index].isSaving = false;
            errorRows[index].error = true;
            setRows(errorRows);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                    <Edit3 className="h-4 w-4" /> Edición Rápida ({filteredData.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2 text-blue-800">
                        <Edit3 className="h-5 w-5" /> Edición Rápida de Precios
                    </DialogTitle>
                    <DialogDescription>
                        Edita los precios de los productos filtrados actualmente. Los precios contables se calcularán automáticamente (Crédito * 97%).
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto border rounded-md shadow-sm mt-4">
                    <Table className="relative">
                        <TableHeader className="sticky top-0 bg-slate-100 shadow-sm z-10">
                            <TableRow>
                                <TableHead className="w-[120px] font-bold text-slate-700">CÓDIGO</TableHead>
                                <TableHead className="min-w-[200px] font-bold text-slate-700">NOMBRE</TableHead>
                                <TableHead className="font-bold text-slate-700">PRESENTACIÓN</TableHead>
                                <TableHead className="w-[120px] font-bold text-slate-700 bg-slate-200/50">P. CONTABLE</TableHead>
                                <TableHead className="w-[120px] font-bold text-blue-700 bg-blue-50">P. CRÉDITO</TableHead>
                                <TableHead className="w-[120px] font-bold text-slate-700 bg-slate-200/50">BONIF. CONT.</TableHead>
                                <TableHead className="w-[120px] font-bold text-blue-700 bg-blue-50">BONIF. CRÉDITO</TableHead>
                                <TableHead className="w-[80px] text-center font-bold text-slate-700">ACCIÓN</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        No hay productos filtrados para editar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row, idx) => {
                                    const pCreditoVal = parseFloat(String(row.precioCredito)) || 0;
                                    const bCreditoVal = parseFloat(String(row.bonifCredito)) || 0;

                                    const pContable = (pCreditoVal * 0.97).toFixed(2);
                                    const bContable = (bCreditoVal * 0.97).toFixed(2);

                                    return (
                                        <TableRow key={row.codArticulo} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-mono text-xs font-medium text-slate-600">
                                                {row.codArticulo}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {row.nombre}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600">
                                                {row.presentacion}
                                            </TableCell>

                                            <TableCell className="bg-slate-50">
                                                <div className="text-sm font-medium text-slate-600 text-right pr-2">
                                                    S/ {pContable}
                                                </div>
                                            </TableCell>

                                            <TableCell className="bg-blue-50/30 p-1">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={row.precioCredito}
                                                    onChange={(e) => handleInputChange(idx, 'precioCredito', e.target.value)}
                                                    className="h-8 text-right font-semibold text-blue-800 border-blue-200 focus-visible:ring-blue-500 bg-white"
                                                />
                                            </TableCell>

                                            <TableCell className="bg-slate-50">
                                                <div className="text-sm font-medium text-slate-600 text-right pr-2">
                                                    S/ {bContable}
                                                </div>
                                            </TableCell>

                                            <TableCell className="bg-blue-50/30 p-1">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={row.bonifCredito}
                                                    onChange={(e) => handleInputChange(idx, 'bonifCredito', e.target.value)}
                                                    className="h-8 text-right font-semibold text-blue-800 border-blue-200 focus-visible:ring-blue-500 bg-white"
                                                />
                                            </TableCell>

                                            <TableCell className="text-center p-1">
                                                <Button
                                                    size="icon"
                                                    variant={row.isSuccess ? "default" : row.error ? "destructive" : "outline"}
                                                    className={`h-8 w-8 ${row.isSuccess ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                                                    onClick={() => handleSaveRow(idx)}
                                                    disabled={row.isSaving}
                                                    title="Guardar fila"
                                                >
                                                    {row.isSaving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                                    ) : row.isSuccess ? (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    ) : row.error ? (
                                                        <AlertCircle className="h-4 w-4" />
                                                    ) : (
                                                        <Save className="h-4 w-4 text-blue-600" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="pt-4 flex justify-end">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cerrar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};