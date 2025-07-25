import { useState, useEffect } from 'react';
import { PriceService } from '@/app/services/price/PriceService';

export function useLaboratoriesData() {
    const [loadingLab, setLoadingLab] = useState(false);
    const [laboratories, setLaboratories] = useState<any[]>([]);
    const [errorLab, setErrorLab] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoadingLab(true);
            setErrorLab(null);
            const promises = [
                PriceService.getLaboratories().catch(() => null),
            ];
            try {
                const [labRes] = await Promise.all(promises);
                if (labRes?.success) {
                    setLaboratories(labRes.data || []);
                } else {
                    setLaboratories([]);
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
    }, []);

    return { laboratories, loadingLab, errorLab };
}