import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import apiClient from "@/app/api/client";

export const BulkPriceUploadModal = ({ onUploadSuccess }: { onUploadSuccess?: () => void }) => {
    const [open, setOpen] = useState(false);
    const [dataPreview, setDataPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const expectedColumns = ["COD ARTICULO", "PRECIO 1", "PRECIO 2", "PRECIO 3", "PRECIO 4"];

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
                await apiClient.post('/price/list-prices/edit', {
                    code: String(row["COD ARTICULO"]).trim(),
                    contado: Number(row["PRECIO 1"]) || 0,
                    credito: Number(row["PRECIO 2"]) || 0,
                    contadoBonif: Number(row["PRECIO 3"]) || 0,
                    creditoBonif: Number(row["PRECIO 4"]) || 0
                });
                successCount++;
            } catch (error) {
                console.error(`Error en la fila ${i + 1} (Cod: ${row["COD ARTICULO"]}):`, error);
                errorCount++;
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
        }

        setIsUploading(false);

        if (errorCount > 0) {
            setAlertInfo({
                type: 'error',
                message: `Carga finalizada con advertencias. Éxitos: ${successCount}, Errores: ${errorCount}. Revisa la consola.`
            });
        } else {
            setAlertInfo({ type: 'success', message: `¡Se actualizaron ${successCount} precios correctamente!` });
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
                <Button variant="outline" className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                    <FileSpreadsheet className="h-4 w-4" /> Importar Precios
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Upload className="h-5 w-5" /> Carga Masiva de Precios
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Formato Requerido</h4>
                        <p className="text-xs text-blue-700 mb-3">
                            Sube un archivo .xlsx o .csv que contenga exactamente estas cabeceras en la primera fila:
                            <br/> <span className="font-mono font-bold bg-blue-200 px-1 rounded">COD ARTICULO</span>,
                            <span className="font-mono font-bold bg-blue-200 px-1 rounded ml-1">PRECIO 1</span>,
                            <span className="font-mono font-bold bg-blue-200 px-1 rounded ml-1">PRECIO 2</span>,
                            <span className="font-mono font-bold bg-blue-200 px-1 rounded ml-1">PRECIO 3</span>,
                            <span className="font-mono font-bold bg-blue-200 px-1 rounded ml-1">PRECIO 4</span>
                        </p>

                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                disabled={isUploading}
                            />
                            {dataPreview.length > 0 && (
                                <Button variant="ghost" size="sm" onClick={resetState} disabled={isUploading}>
                                    Limpiar
                                </Button>
                            )}
                        </div>
                    </div>

                    {alertInfo && (
                        <div className={`p-3 rounded-md flex items-center gap-3 ${
                            alertInfo.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                            {alertInfo.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                            <p className="text-sm font-medium">{alertInfo.message}</p>
                        </div>
                    )}

                    {dataPreview.length > 0 && (
                        <div className="border rounded-md">
                            <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b">
                                <span className="text-sm font-medium">Previsualización (Total: {dataPreview.length} registros)</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white shadow-sm">
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead>COD ARTICULO</TableHead>
                                            <TableHead>PRECIO 1</TableHead>
                                            <TableHead>PRECIO 2</TableHead>
                                            <TableHead>PRECIO 3</TableHead>
                                            <TableHead>PRECIO 4</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataPreview.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-sm">{row["COD ARTICULO"]}</TableCell>
                                                <TableCell className="text-sm">{Number(row["PRECIO 1"] || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-sm">{Number(row["PRECIO 2"] || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-sm">{Number(row["PRECIO 3"] || 0).toFixed(2)}</TableCell>
                                                <TableCell className="text-sm">{Number(row["PRECIO 4"] || 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {dataPreview.length > 50 && (
                                <div className="text-center text-xs text-gray-500 py-2 border-t">
                                    Mostrando solo los primeros 50 registros...
                                </div>
                            )}
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
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>Cancelar</Button>
                            <Button onClick={handleBulkUpload} disabled={isUploading || dataPreview.length === 0} className="min-w-[140px]">
                                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar y Subir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};