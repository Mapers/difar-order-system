import { Card, CardContent } from "@/components/ui/card"

interface TotalesComprobantes {
    totalFacturas: number
    totalBoletas: number
    totalNotasCredito: number
}

export function ComprobantesStats({ totales }: { totales: TotalesComprobantes }) {
    return (
        <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-600 font-medium text-xs sm:text-sm">TOTAL FACTURAS</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700">S/{Number(totales.totalFacturas).toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-600 font-medium text-xs sm:text-sm">TOTAL BOLETAS</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700">S/{Number(totales.totalBoletas).toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-purple-600 font-medium text-xs sm:text-sm">TOTAL NOTAS CRÉDITO</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700">S/{Number(totales.totalNotasCredito).toFixed(2)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
