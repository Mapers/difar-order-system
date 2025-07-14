import { DOCUMENTO, ESTADO_APROBACION } from "@/constants/clients";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export class ClientMethodsService {

    /**
     * 
     * @param cliente 
     * @returns 
     */
    static getEstadoAprobacion = (estado: any) => {
        switch (estado) {
            case ESTADO_APROBACION.APROBADO:
                return { estado: "APROBADO", color: "bg-green-100 text-green-800", icon: CheckCircle };
            case ESTADO_APROBACION.RECHAZADO:
                return { estado: "RECHAZADO", color: "bg-red-100 text-red-800", icon: XCircle };
            case ESTADO_APROBACION.PENDIENTE:
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


    static getColorDocument = (doc: any): string => {
        switch (doc.nombre) {
            case DOCUMENTO.AUTORIZACION_SANITARIA:
                return "bg-blue-50 border-blue-200"
            case DOCUMENTO.SITUACION_FUNCIONAMIENTO:
                return "bg-green-50 border-green-200"
            case DOCUMENTO.NUMERO_REGISTRO:
                return "bg-yellow-50 border-yellow-200"
            case DOCUMENTO.CERTIFICACIONES:
                return "bg-purple-50 border-purple-200"
            default:
                return "bg-gray-50 border-gray-200"
        }
    }

}