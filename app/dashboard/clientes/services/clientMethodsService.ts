import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export class ClientMethodsService {

    /**
     * 
     * @param cliente 
     * @returns 
     */

    static getEstadoAprobacion = (cliente: any) => {
        switch (cliente.estado) {
            case "APROBADO":
                return { estado: "APROBADO", color: "bg-green-100 text-green-800", icon: CheckCircle };
            case "RECHAZADO":
                return { estado: "RECHAZADO", color: "bg-red-100 text-red-800", icon: XCircle };
            case "PENDIENTE":
                return { estado: "PENDIENTE", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle };
            default:
                return { estado: "DESCONOCIDO", color: "bg-gray-100 text-gray-800", icon: AlertCircle };
        }
    }

    /**
     * 
     * @param categoria 
     * @returns 
     */
    static getCategoriaLabel = (categoria: string) => {
        const categorias: Record<string, string> = {
            A: "Categoría A",
            B: "Categoría B",
            C: "Categoría C",
        }
        return categorias[categoria] ?? categoria
    }

}