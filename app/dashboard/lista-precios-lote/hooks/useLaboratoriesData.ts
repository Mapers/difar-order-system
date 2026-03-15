import {useState, useEffect, use} from 'react';
import { PriceService } from '@/app/services/price/PriceService';
import {useAuth} from "@/context/authContext";

export function useLaboratoriesData() {
    const [loadingLab, setLoadingLab] = useState(false);
    const [laboratories, setLaboratories] = useState<any[]>([]);
    const [laboratoriesRepres, setLaboratoriesRepres] = useState<any[]>([]);
    const [errorLab, setErrorLab] = useState<string | null>(null);
    const { user } = useAuth()

    useEffect(() => {
        async function fetchData() {
            setLoadingLab(true);
            setErrorLab(null);
            const promises = [
                PriceService.getLaboratories().catch(() => null),
                PriceService.getLaboratoriesRepres(user?.idRol === 7 ? user.codRepres : '').catch(() => null),
            ];
            try {
                const [labRes, labRepres] = await Promise.all(promises);

                if (labRes?.success) {
                    setLaboratories(labRes.data || []);
                } else {
                    setLaboratories([]);
                }

                if (labRepres?.success) {
                    setLaboratoriesRepres(labRepres.data || []);
                } else {
                    setLaboratoriesRepres([]);
                }
            } catch (e) {
                const message = 'No cargó correctamente, por favor intente nuevamente.'
                setErrorLab(message);
                throw new Error(message)
            } finally {
                setLoadingLab(false);
            }
        }

        fetchData();
    }, [user]);

    return { laboratories, loadingLab, errorLab, laboratoriesRepres };
}