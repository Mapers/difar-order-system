export class PriceMethodsService {

    static getUniqueLaboratories(listPricesLots: any[]) {
        return [...new Set(listPricesLots.map(item => item.laboratorio_Descripcion))];
    }

    static getUniqueLineas(listPricesLots: any[]) {
        return [...new Set(listPricesLots.map(item => item.linea_lote_Descripcion))];
    }

    static filterData(
        listPricesLots: any[],
        searchTerm: string,
        selectedLabs: string[],
        selectedLinea: string,
        minStock: string,
        maxStock: string,
        expirationFilter: string
    ) {
        return listPricesLots.filter(item => {
            const matchesSearch =
                item.prod_descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.prod_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.prod_principio?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLab = selectedLabs.length === 0 || selectedLabs.includes(item.laboratorio_Descripcion);
            const matchesLinea = selectedLinea === "all" || item.linea_lote_Descripcion === selectedLinea;

            const matchesStock =
                (minStock === "" || Number(item.kardex_saldoCant) >= Number(minStock)) &&
                (maxStock === "" || Number(item.kardex_saldoCant) <= Number(maxStock));

            let matchesExpiration = true;
            if (expirationFilter !== "all") {
                const today = new Date();
                const expirationDate = new Date(item.kardex_VctoItem.split("/").reverse().join("-"));
                const diffTime = expirationDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                switch (expirationFilter) {
                    case "expired":
                        matchesExpiration = diffDays < 0;
                        break;
                    case "30days":
                        matchesExpiration = diffDays >= 0 && diffDays <= 30;
                        break;
                    case "90days":
                        matchesExpiration = diffDays >= 0 && diffDays <= 90;
                        break;
                    case "valid":
                        matchesExpiration = diffDays > 90;
                        break;
                }
            }

            return matchesSearch && matchesLab && matchesLinea && matchesStock && matchesExpiration;
        });
    }

    static getExpirationStatus(expirationDate: string) {
        const today = new Date();
        const expDate = new Date(expirationDate.split("/").reverse().join("-"));
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: "Vencido", variant: "destructive" as const };
        if (diffDays <= 30) return { status: "Por vencer", variant: "destructive" as const };
        if (diffDays <= 90) return { status: "Próximo", variant: "secondary" as const };
        return { status: "Vigente", variant: "default" as const };
    }

}