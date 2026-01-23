import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"

interface PdfViewerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    pdfUrl: string
    fileName?: string
}

export function PdfViewerModal({ open, onOpenChange, pdfUrl, fileName = "documento.pdf" }: PdfViewerModalProps) {

    const handleDownload = () => {
        if (!pdfUrl) return;

        const link = document.createElement('a');
        link.href = pdfUrl;

        link.download = fileName;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Visualizador de Comprobante</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden bg-gray-100 rounded-md">
                    {pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            title="Visualizador de PDF"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                    <Button onClick={handleDownload} disabled={!pdfUrl}>
                        <Download className="mr-2 h-4 w-4" /> Descargar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}