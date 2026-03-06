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

export const BulkBonusUploadModal = ({ onUploadSuccess, user }: { onUploadSuccess?: () => void, user: any }) => {
    const [open, setOpen] = useState(false);
    const [dataPreview, setDataPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const expectedColumns = ["COD ARTICULO", "COMPRA", "LLEVA", "DESCRIPCION"];

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

            const codArticulo = String(row["COD ARTICULO"]).trim();
            // Si viene COD BONIFICADO lo tomamos, sino es el mismo producto
            const codBonificado = row["COD BONIFICADO"] ? String(row["COD BONIFICADO"]).trim() : codArticulo;
            const sameProduct = codArticulo === codBonificado;

            try {
                await apiClient.post('/articulos/bonus/upsert', {
                    code: codArticulo,
                    description: String(row["DESCRIPCION"] || ""),
                    factor: Number(row["COMPRA"]) || 1,
                    qty: Number(row["LLEVA"]) || 1,
                    user: user?.nombreCompleto,
                    sameProduct: sameProduct,
                    codProdBonus: codBonificado,
                    descProdBonus: String(row["DESC BONIFICADO"] || "")
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
            setAlertInfo({ type: 'success', message: `¡Se subieron ${successCount} bonificaciones correctamente!` });
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
                <Button variant="outline" className="gap-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                    <FileSpreadsheet className="h-4 w-4" /> Importar Bonos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2 text-yellow-700">
                        <Upload className="h-5 w-5" /> Carga Masiva de Bonificaciones
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Formato Requerido</h4>
                        <p className="text-xs text-yellow-700 mb-3 leading-relaxed">
                            Sube un archivo .xlsx con las siguientes cabeceras:
                            <br/> <span className="font-mono font-bold bg-yellow-200 px-1 rounded">COD ARTICULO</span>,
                            <span className="font-mono font-bold bg-yellow-200 px-1 rounded ml-1">COMPRA</span>,
                            <span className="font-mono font-bold bg-yellow-200 px-1 rounded ml-1">LLEVA</span>,
                            <span className="font-mono font-bold bg-yellow-200 px-1 rounded ml-1">DESCRIPCION</span>.
                            <br/> <span className="mt-1 inline-block">*Opcionales: <span className="font-mono font-bold bg-yellow-200 px-1 rounded">COD BONIFICADO</span> y <span className="font-mono font-bold bg-yellow-200 px-1 rounded">DESC BONIFICADO</span> (si bonificas otro producto).</span>
                        </p>
                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} ref={fileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-white hover:file:bg-yellow-700" disabled={isUploading}/>
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
                                            <TableHead className="w-[40px]">#</TableHead>
                                            <TableHead>COD ARTICULO</TableHead>
                                            <TableHead>COMPRA</TableHead>
                                            <TableHead>LLEVA</TableHead>
                                            <TableHead>DESCRIPCIÓN</TableHead>
                                            <TableHead>COD BONIF</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataPreview.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-xs">{row["COD ARTICULO"]}</TableCell>
                                                <TableCell className="text-sm">{row["COMPRA"]}</TableCell>
                                                <TableCell className="text-sm">{row["LLEVA"]}</TableCell>
                                                <TableCell className="text-xs truncate max-w-[150px]" title={row["DESCRIPCION"]}>{row["DESCRIPCION"]}</TableCell>
                                                <TableCell className="font-mono text-xs text-gray-500">{row["COD BONIFICADO"] || "Mismo prod."}</TableCell>
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
                                    <div className="bg-yellow-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>Cancelar</Button>
                            <Button onClick={handleBulkUpload} disabled={isUploading || dataPreview.length === 0} className="bg-yellow-600 hover:bg-yellow-700 min-w-[140px]">
                                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar y Subir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};