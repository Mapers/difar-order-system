import { useState, useEffect } from 'react';
import { ClientService } from '@/app/services/client/ClientService';

export function useClientEditData(codClient?: string) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeDocuments, setTypeDocuments] = useState<any>([])
    const [provincesCities, setProvincesCities] = useState<any>([])
    const [districts, setDistricts] = useState<any>([])
    const [zones, setZones] = useState<any>([])
    const [sunatStatus, setSunatStatus] = useState<any>([])
    const [evaluationClient, setEvaluationClient] = useState<any>([])
    const [evaluacionCalificacion, setEvaluacionCalificacion] = useState<any>({});


    useEffect(() => {
        if (!codClient) {
            // Si no hay codClient, limpia estados y no hace fetch
            setTypeDocuments([]);
            setProvincesCities([]);
            setDistricts([]);
            setZones([]);
            setSunatStatus([]);
            setEvaluationClient([]);
            setEvaluacionCalificacion({})
            setError(null);
            setLoading(false);
            return;
        }
        async function fetchData() {
            setLoading(true);
            setError(null);
            // Ejecutar todos los fetch en paralelo, manejando errores individualmente
            const promises = [
                ClientService.getDocumentsTypes().catch(() => null),
                ClientService.getProvincesCities().catch(() => null),
                ClientService.getDistricts().catch(() => null),
                ClientService.getZones().catch(() => null),
                ClientService.getSunatStatus().catch(() => null),
                ClientService.getEvaluationDocsClient(codClient as string).catch(() => null),
                ClientService.getEvaluationCalifByCodClient(codClient as string).catch(() => null),
            ];

            try {
                const [documentRes, provinceRes, districtRes, zoneRes, sunaStatusRes, evaClientRes, evalCalifRes] = await Promise.all(promises);
                if (documentRes?.success) {
                    setTypeDocuments(documentRes.data);
                } else {
                    setTypeDocuments([]);
                }
                if (provinceRes?.success) {
                    setProvincesCities(provinceRes.data);
                } else {
                    setProvincesCities([]);
                }
                if (districtRes?.success) {
                    setDistricts(districtRes.data);
                } else {
                    setDistricts([]);
                }
                if (zoneRes?.success) {
                    const filterZones = (zoneRes.data).filter((zone: any) => zone.NombreZona !== null)
                    setZones(filterZones);
                } else {
                    setZones([]);
                }
                if (sunaStatusRes?.success) {
                    setSunatStatus(sunaStatusRes.data);
                } else {
                    setSunatStatus([]);
                }
                if (evaClientRes?.success) {
                    setEvaluationClient(evaClientRes.data);
                } else {
                    setEvaluationClient([]);
                }
                if (evalCalifRes?.success) {
                    setEvaluacionCalificacion(evalCalifRes.data);
                } else {
                    setEvaluacionCalificacion({});
                }
            } catch (e) {
                // No debería llegar aquí porque cada fetch maneja su error, pero por si acaso:
                setError('Error cargando datos del cliente');
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [codClient]);

    return { typeDocuments, provincesCities, districts, zones, sunatStatus, evaluationClient, evaluacionCalificacion, loading, error };
}