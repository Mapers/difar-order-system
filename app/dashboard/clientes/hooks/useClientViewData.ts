import { useState, useEffect } from 'react';
import { mapClientEvaluationFromApi, mapEvaluacionCalificacionFromApi, mapEvaluationFromApi } from '@/mappers/clients';
import { IClientEvaluation } from '../types';
import { ClientService } from '@/app/services/client/ClientService';

export function useClienViewtData(codClient?: string) {
    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState<IClientEvaluation | null>(null);
    const [evaluation, setEvaluation] = useState<any>({});
    const [evaluationClient, setEvaluationClient] = useState<any[]>([]);
    const [docObligatorios, setDocObligatorios] = useState<any[]>([]);
    const [evaluacionCalificacion, setEvaluacionCalificacion] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!codClient) {
            // Si no hay codClient, limpia estados y no hace fetch
            setClient(null);
            setEvaluation({});
            setEvaluationClient([]);
            setDocObligatorios([]);
            setEvaluacionCalificacion({});
            setError(null);
            setLoading(false);
            return;
        }
        async function fetchData() {
            setLoading(true);
            setError(null);
            // Ejecutar todos los fetch en paralelo, manejando errores individualmente
            const promises = [
                ClientService.getClientBycod(codClient as string).catch(() => null),
                ClientService.getEvaluationByCodClient(codClient as string).catch(() => null),
                ClientService.getEvaluationDocsClient(codClient as string).catch(() => null),
                ClientService.getDocObligatorios().catch(() => null),
                ClientService.getEvaluationCalifByCodClient(codClient as string).catch(() => null),
            ];

            try {
                const [clientRes, evalRes, evaClientRes, docOblRes, evalCalifRes] = await Promise.all(promises);
                if (clientRes?.success) {
                    setClient(mapClientEvaluationFromApi(clientRes.data));
                } else {
                    setClient(null);
                }
                if (evalRes?.success) {
                    setEvaluation(mapEvaluationFromApi(evalRes.data));
                } else {
                    setEvaluation({});
                }
                if (evaClientRes?.success) {
                    setEvaluationClient(evaClientRes.data);
                } else {
                    setEvaluationClient([]);
                }
                if (docOblRes?.success) {
                    setDocObligatorios(docOblRes.data || []);
                } else {
                    setDocObligatorios([]);
                }
                if (evalCalifRes?.success) {
                    setEvaluacionCalificacion(mapEvaluacionCalificacionFromApi(evalCalifRes.data));
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

    return { client, evaluation, evaluationClient, docObligatorios, evaluacionCalificacion, loading, error };
}