import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import * as XLSX from "xlsx";
import apiClient from "@/app/api/client";
import {Badge} from "@/components/ui/badge";

interface BulkPriceUploadModalProps {
    onUploadSuccess?: () => void;
    filteredData?: Array<{
        codArticulo: string;
        precio1: number;
        precio2: number;
        precio3: number;
        precio4: number;
    }>;
}

export const BulkPriceUploadModal = ({ onUploadSuccess, filteredData = [] }: BulkPriceUploadModalProps) => {
    const [open, setOpen] = useState(false);
    const [dataPreview, setDataPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false); // Estado para el Drag & Drop
    const [fileName, setFileName] = useState<string | null>(null); // Guardar el nombre del archivo
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const expectedColumns = ["COD ARTICULO", "PRECIO 1", "PRECIO 2", "PRECIO 3", "PRECIO 4"];

    const resetState = () => {
        setDataPreview([]);
        setIsUploading(false);
        setIsDragging(false);
        setFileName(null);
        setProgress({ current: 0, total: 0 });
        setAlertInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Nueva función centralizada para procesar el archivo
    const processFile = (file: File) => {
        setAlertInfo(null);
        setFileName(file.name);
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
                    setFileName(null);
                    return;
                }

                const firstRow = data[0] as any;
                const missingColumns = expectedColumns.filter(col => !(col in firstRow));

                if (missingColumns.length > 0) {
                    setAlertInfo({
                        type: 'error',
                        message: `Faltan las siguientes columnas: ${missingColumns.join(", ")}`
                    });
                    setFileName(null);
                    return;
                }

                setDataPreview(data);
                setProgress({ current: 0, total: data.length });
            } catch (error) {
                console.error("Error leyendo el archivo", error);
                setAlertInfo({ type: 'error', message: "Error al leer el archivo. Asegúrate de que sea un Excel o CSV válido." });
                setFileName(null);
            }
        };

        reader.readAsBinaryString(file);
    };

    // Handlers para el Drag & Drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isUploading && dataPreview.length === 0) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (isUploading || dataPreview.length > 0) return;

        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    // Handler para el input nativo oculto
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleExportFiltered = () => {
        if (filteredData.length === 0) {
            setAlertInfo({ type: 'error', message: "No hay datos filtrados para exportar." });
            return;
        }

        try {
            const exportData = filteredData.map(item => ({
                "COD ARTICULO": item.codArticulo,
                "PRECIO 1": item.precio1,
                "PRECIO 2": item.precio2,
                "PRECIO 3": item.precio3,
                "PRECIO 4": item.precio4
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            const colWidths = [
                { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Precios Filtrados");

            const date = new Date();
            const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;

            XLSX.writeFile(wb, `precios_filtrados_${dateStr}.xlsx`);

            setAlertInfo({
                type: 'success',
                message: `Se exportaron ${filteredData.length} registros correctamente.`
            });
            setTimeout(() => setAlertInfo(null), 3000);

        } catch (error) {
            console.error("Error exportando datos:", error);
            setAlertInfo({ type: 'error', message: "Error al exportar los datos." });
        }
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
                        <Upload className="h-5 w-5" /> Gestión de Precios Masivos
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Instrucciones de formato</h4>
                        <p className="text-xs text-blue-800 mb-3">
                            Asegúrate de que tu archivo (.xlsx o .csv) tenga las siguientes cabeceras en la primera fila:
                            <br/> <span className="font-mono font-bold bg-blue-100 px-1 rounded border border-blue-200">COD ARTICULO</span>,
                            <span className="font-mono font-bold bg-blue-100 px-1 rounded ml-1 border border-blue-200">PRECIO 1</span>,
                            <span className="font-mono font-bold bg-blue-100 px-1 rounded ml-1 border border-blue-200">PRECIO 2</span>,
                            <span className="font-mono font-bold bg-blue-100 px-1 rounded ml-1 border border-blue-200">PRECIO 3</span>,
                            <span className="font-mono font-bold bg-blue-100 px-1 rounded ml-1 border border-blue-200">PRECIO 4</span>
                        </p>

                        {/* ZONA DE DROP PERSONALIZADA */}
                        {dataPreview.length === 0 ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-4 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                    isDragging
                                        ? "border-blue-500 bg-blue-100"
                                        : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"
                                }`}
                            >
                                <UploadCloud className={`h-10 w-10 mb-3 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
                                <p className="text-sm font-medium text-gray-700">
                                    {isDragging ? "Suelta el archivo aquí..." : "Haz clic o arrastra tu archivo aquí"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Soporta Excel (.xlsx, .xls) y CSV</p>

                                {/* Input nativo oculto */}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileInput}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="mt-4 flex items-center justify-between bg-white border border-green-200 p-3 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-md">
                                        <FileSpreadsheet className="h-5 w-5 text-green-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                                        <p className="text-xs text-gray-500">Archivo cargado y listo para procesar</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetState}
                                    disabled={isUploading}
                                    className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4 mr-1" /> Remover
                                </Button>
                            </div>
                        )}
                    </div>

                    {alertInfo && (
                        <div className={`p-3 rounded-md flex items-center gap-3 shadow-sm ${
                            alertInfo.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                            {alertInfo.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                            <p className="text-sm font-medium">{alertInfo.message}</p>
                        </div>
                    )}

                    {dataPreview.length > 0 && (
                        <div className="border rounded-md shadow-sm">
                            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b">
                                <span className="text-sm font-semibold text-gray-700">
                                    Previsualización <Badge variant="secondary" className="ml-2">{dataPreview.length} registros</Badge>
                                </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px] bg-white">#</TableHead>
                                            <TableHead className="bg-white">COD ARTICULO</TableHead>
                                            <TableHead className="bg-white">PRECIO 1</TableHead>
                                            <TableHead className="bg-white">PRECIO 2</TableHead>
                                            <TableHead className="bg-white">PRECIO 3</TableHead>
                                            <TableHead className="bg-white">PRECIO 4</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataPreview.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-sm font-medium">{row["COD ARTICULO"]}</TableCell>
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
                                <div className="text-center text-xs text-gray-500 py-3 bg-gray-50 border-t">
                                    Mostrando solo los primeros 50 registros...
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 pt-4 border-t mt-4">
                        {isUploading && (
                            <div className="space-y-2 bg-gray-50 p-4 rounded-md border border-gray-100">
                                <div className="flex justify-between text-sm font-medium text-gray-700">
                                    <span>Subiendo registros...</span>
                                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 text-right">{progress.current} de {progress.total} procesados</p>
                            </div>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
                            <Button
                                onClick={handleExportFiltered}
                                disabled={filteredData.length === 0 || isUploading}
                                variant="outline"
                                className="gap-2 text-gray-700"
                            >
                                <Download className="h-4 w-4" />
                                Exportar Plantilla ({filteredData.length})
                            </Button>
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setOpen(false)} disabled={isUploading}>Cancelar</Button>
                                <Button onClick={handleBulkUpload} disabled={isUploading || dataPreview.length === 0} className="min-w-[140px] bg-blue-600 hover:bg-blue-700">
                                    {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar y Subir"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};