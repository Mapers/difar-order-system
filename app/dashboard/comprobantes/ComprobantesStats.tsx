import { Card, CardContent } from "@/components/ui/card"
import {Comprobante} from "@/interface/order/order-interface";

export function ComprobantesStats({ comprobantes }: { comprobantes: Comprobante[] }) {
    const calculateTotals = () => {
        const facturas = comprobantes.filter(c => c.tipo_comprobante === 1 && !c.anulado)
        const boletas = comprobantes.filter(c => c.tipo_comprobante === 2 && !c.anulado)
        const notasCredito = comprobantes.filter(c => c.tipo_comprobante === 3 && !c.anulado)
        const notasDebito = comprobantes.filter(c => c.tipo_comprobante === 4 && !c.anulado)

        return {
            totalFacturas: facturas.reduce((sum, c) => sum + Number(c.total), 0),
            totalBoletas: boletas.reduce((sum, c) => sum + Number(c.total), 0),
            totalNotasCredito: notasCredito.reduce((sum, c) => sum + Number(c.total), 0),
            totalNotasDebito: notasDebito.reduce((sum, c) => sum + Number(c.total), 0),
        }
    }

    const totals = calculateTotals()

    return (
        <Card className="bg-white shadow-sm">
            <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-600 font-medium text-xs sm:text-sm">TOTAL FACTURAS</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-700">S/{totals.totalFacturas.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-600 font-medium text-xs sm:text-sm">TOTAL BOLETAS</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-700">S/{totals.totalBoletas.toFixed(2)}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-purple-600 font-medium text-xs sm:text-sm">TOTAL NOTAS CRÉDITO</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-700">S/{totals.totalNotasCredito.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-orange-600 font-medium text-xs sm:text-sm">TOTAL NOTAS DÉBITO</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-700">S/{totals.totalNotasDebito.toFixed(2)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}