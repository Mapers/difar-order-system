'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    FileSpreadsheet,
    Upload,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import * as XLSX from "xlsx"

export const BulkScaleUploadModal = ({ onUploadSuccess, user }: { onUploadSuccess?: () => void, user: any }) => {
    const [open, setOpen] = useState(false);
    const [dataPreview, setDataPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const expectedColumns = ["COD ARTICULO", "DESDE", "HASTA", "PRECIO"];

    const resetState = () => {
        setDataPreview([]);
        setIsUploading(false);
        setProgress({ current: 0, total: 0 });
        setAlertInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAlertInfo(null);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setAlertInfo({ type: 'error', message: "El archivo está vacío." });
                    return;
                }

                const firstRow = data[0] as any;
                const missingColumns = expectedColumns.filter(col => !(col in firstRow));

                if (missingColumns.length > 0) {
                    setAlertInfo({
                        type: 'error',
                        message: `Faltan las siguientes columnas: ${missingColumns.join(", ")}`
                    });
                    return;
                }

                setDataPreview(data);
                setProgress({ current: 0, total: data.length });
            } catch (error) {
                console.error("Error leyendo el archivo", error);
                setAlertInfo({ type: 'error', message: "Error al leer el archivo. Asegúrate de que sea un Excel o CSV válido." });
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkUpload = async () => {
        if (dataPreview.length === 0) return;
        setIsUploading(true);
        setAlertInfo(null);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < dataPreview.length; i++) {
            const row = dataPreview[i];
            try {
                await apiClient.post('/articulos/scale/upsert', {
                    code: String(row["COD ARTICULO"]).trim(),
                    min: Number(row["DESDE"]) || 1,
                    max: Number(row["HASTA"]) || 1,
                    price: Number(row["PRECIO"]) || 0,
                    user: user?.nombreCompleto
                });
                successCount++;
            } catch (error) {
                console.error(`Error en la fila ${i + 1}:`, error);
                errorCount++;
            }
            setProgress(prev => ({ ...prev, current: i + 1 }));
        }

        setIsUploading(false);

        if (errorCount > 0) {
            setAlertInfo({ type: 'error', message: `Finalizado. Éxitos: ${successCount}, Errores: ${errorCount}.` });
        } else {
            setAlertInfo({ type: 'success', message: `¡Se subieron ${successCount} escalas correctamente!` });
            setTimeout(() => {
                setOpen(false);
                if (onUploadSuccess) onUploadSuccess();
            }, 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetState();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                    <FileSpreadsheet className="h-4 w-4" /> Importar Escalas
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2 text-purple-700">
                        <Upload className="h-5 w-5" /> Carga Masiva de Escalas
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                        <h4 className="text-sm font-semibold text-purple-800 mb-2">Formato Requerido</h4>
                        <p className="text-xs text-purple-700 mb-3">
                            Sube un archivo .xlsx con las siguientes cabeceras:
                            <br/> <span className="font-mono font-bold bg-purple-200 px-1 rounded">COD ARTICULO</span>,
                            <span className="font-mono font-bold bg-purple-200 px-1 rounded ml-1">DESDE</span>,
                            <span className="font-mono font-bold bg-purple-200 px-1 rounded ml-1">HASTA</span>,
                            <span className="font-mono font-bold bg-purple-200 px-1 rounded ml-1">PRECIO</span>
                        </p>
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} ref={fileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" disabled={isUploading}/>
                    </div>

                    {alertInfo && (
                        <div className={`p-3 rounded-md flex items-center gap-3 ${alertInfo.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} border`}>
                            {alertInfo.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                            <p className="text-sm font-medium">{alertInfo.message}</p>
                        </div>
                    )}

                    {dataPreview.length > 0 && (
                        <div className="border rounded-md">
                            <div className="max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white shadow-sm">
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead>COD ARTICULO</TableHead>
                                            <TableHead>DESDE</TableHead>
                                            <TableHead>HASTA</TableHead>
                                            <TableHead>PRECIO</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataPreview.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{row["COD ARTICULO"]}</TableCell>
                                                <TableCell className="text-sm">{row["DESDE"]}</TableCell>
                                                <TableCell className="text-sm">{row["HASTA"]}</TableCell>
                                                <TableCell className="text-sm">S/ {Number(row["PRECIO"] || 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4 pt-4 border-t mt-4">
                        {isUploading && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-gray-600">
                                    <span>Subiendo registros...</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>Cancelar</Button>
                            <Button onClick={handleBulkUpload} disabled={isUploading || dataPreview.length === 0} className="bg-purple-600 hover:bg-purple-700 min-w-[140px]">
                                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar y Subir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};