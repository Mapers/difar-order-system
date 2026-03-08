'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    FileSpreadsheet,
    Upload,
    AlertCircle,
    CheckCircle2,
    Loader2,
    UploadCloud,
    X
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/app/api/client"
import * as XLSX from "xlsx"

export const BulkBonusUploadModal = ({ onUploadSuccess, user }: { onUploadSuccess?: () => void, user: any }) => {
    const [open, setOpen] = useState(false);
    const [dataPreview, setDataPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [alertInfo, setAlertInfo] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const expectedColumns = ["COD ARTICULO", "COMPRA", "LLEVA", "DESCRIPCION"];

    const resetState = () => {
        setDataPreview([]);
        setIsUploading(false);
        setIsDragging(false);
        setFileName(null);
        setProgress({ current: 0, total: 0 });
        setAlertInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

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

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
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
                    <div className="bg-yellow-50/50 p-4 rounded-md border border-yellow-100">
                        <h4 className="text-sm font-semibold text-yellow-900 mb-2">Formato Requerido</h4>
                        <p className="text-xs text-yellow-800 mb-3 leading-relaxed">
                            Asegúrate de que tu archivo (.xlsx o .csv) tenga las siguientes cabeceras en la primera fila:
                            <br/> <span className="font-mono font-bold bg-yellow-100 px-1 rounded border border-yellow-200">COD ARTICULO</span>,
                            <span className="font-mono font-bold bg-yellow-100 px-1 rounded ml-1 border border-yellow-200">COMPRA</span>,
                            <span className="font-mono font-bold bg-yellow-100 px-1 rounded ml-1 border border-yellow-200">LLEVA</span>,
                            <span className="font-mono font-bold bg-yellow-100 px-1 rounded ml-1 border border-yellow-200">DESCRIPCION</span>.
                            <br/> <span className="mt-1 inline-block text-yellow-700/80">*Opcionales: <span className="font-mono font-bold bg-yellow-100 px-1 rounded border border-yellow-200 text-yellow-900">COD BONIFICADO</span> y <span className="font-mono font-bold bg-yellow-100 px-1 rounded border border-yellow-200 text-yellow-900">DESC BONIFICADO</span> (si bonificas otro producto).</span>
                        </p>

                        {dataPreview.length === 0 ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-4 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                                    isDragging
                                        ? "border-yellow-500 bg-yellow-100"
                                        : "border-gray-300 bg-white hover:border-yellow-400 hover:bg-gray-50"
                                }`}
                            >
                                <UploadCloud className={`h-10 w-10 mb-3 ${isDragging ? "text-yellow-500" : "text-gray-400"}`} />
                                <p className="text-sm font-medium text-gray-700">
                                    {isDragging ? "Suelta el archivo aquí..." : "Haz clic o arrastra tu archivo aquí"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Soporta Excel (.xlsx, .xls) y CSV</p>

                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileInput}
                                    ref={fileInputRef}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="mt-4 flex items-center justify-between bg-white border border-yellow-200 p-3 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="bg-yellow-100 p-2 rounded-md">
                                        <FileSpreadsheet className="h-5 w-5 text-yellow-700" />
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
                                            <TableHead className="w-[40px] bg-white">#</TableHead>
                                            <TableHead className="bg-white">COD ARTICULO</TableHead>
                                            <TableHead className="bg-white">COMPRA</TableHead>
                                            <TableHead className="bg-white">LLEVA</TableHead>
                                            <TableHead className="bg-white">DESCRIPCIÓN</TableHead>
                                            <TableHead className="bg-white">COD BONIF</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataPreview.slice(0, 50).map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="text-xs text-gray-400">{idx + 1}</TableCell>
                                                <TableCell className="font-mono text-xs font-medium">{row["COD ARTICULO"]}</TableCell>
                                                <TableCell className="text-sm">{row["COMPRA"]}</TableCell>
                                                <TableCell className="text-sm">{row["LLEVA"]}</TableCell>
                                                <TableCell className="text-xs truncate max-w-[150px]" title={row["DESCRIPCION"]}>{row["DESCRIPCION"]}</TableCell>
                                                <TableCell className="font-mono text-xs text-gray-500">{row["COD BONIFICADO"] || "Mismo prod."}</TableCell>
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
                                    <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 text-right">{progress.current} de {progress.total} procesados</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isUploading}>Cancelar</Button>
                            <Button onClick={handleBulkUpload} disabled={isUploading || dataPreview.length === 0} className="bg-yellow-600 hover:bg-yellow-700 min-w-[140px] text-white">
                                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Confirmar y Subir"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};