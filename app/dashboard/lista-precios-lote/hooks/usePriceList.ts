import { useState, useEffect, useCallback, useMemo } from "react";
import debounce from 'lodash.debounce';
import { PriceService } from "@/app/services/price/PriceService";
import { PrecioLote, PriceListParams } from "../types";

export function usePriceList(isAuthenticated: boolean) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLabs, setSelectedLabs] = useState<number[]>([]);
    const [excludeNoStock, setExcludeNoStock] = useState(false);
    const [selectedPrinciple, setSelectedPrinciple] = useState<string>("");

    const [listPricesLots, setListPricesLots] = useState<PrecioLote[]>([]);
    const [filteredPricesLot, setFilteredPricesLot] = useState<PrecioLote[]>([]);
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const fetchPricesLots = async (search: string, labs: number[]) => {
        setLoading(true);
        try {
            let payload: PriceListParams = {};
            if (search.length >= 4) {
                payload.descripcion = search;
            } else if (labs.length > 0) {
                payload.laboratorio = labs.join(",");
            }
            const response = await PriceService.getPricesLot(payload);
            setListPricesLots(response.data || []);
        } catch (error) {
            console.error("Error al listar los precios por lote:", error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetch = useCallback(
        debounce((search, labs) => fetchPricesLots(search, labs), 500),
        []
    );

    useEffect(() => {
        if (isAuthenticated) {
            debouncedFetch(searchTerm, selectedLabs);
        }
    }, [isAuthenticated, searchTerm, selectedLabs, debouncedFetch]);

    const uniquePrinciples = useMemo(() => {
        const principles = listPricesLots
            .map(item => item.prod_principio)
            .filter(Boolean);

        return Array.from(new Set(principles)).sort();
    }, [listPricesLots]);

    useEffect(() => {
        let filtered = listPricesLots;

        if (excludeNoStock) {
            filtered = filtered.filter(item => Number(item.kardex_saldoCant) > 0);
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(priceLot =>
                priceLot.prod_codigo?.toLowerCase().includes(lowerSearch) ||
                priceLot.prod_descripcion?.toLowerCase().includes(lowerSearch) ||
                priceLot.prod_principio?.toLowerCase().includes(lowerSearch)
            );
        }

        if (selectedPrinciple) {
            filtered = filtered.filter(item => item.prod_principio === selectedPrinciple);
        }

        setFilteredPricesLot(filtered);
        setCurrentPage(1);
    }, [searchTerm, listPricesLots, excludeNoStock, selectedPrinciple]);

    const totalPages = Math.ceil(filteredPricesLot.length / itemsPerPage) || 1;
    const paginatedData = filteredPricesLot.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const getExportPayload = () => {
        let payload = { descripcion: '', laboratorio: '' };
        if (searchTerm.length >= 4) payload.descripcion = searchTerm;
        else if (selectedLabs.length > 0) payload.laboratorio = selectedLabs.join(",");
        return payload;
    };

    return {
        searchTerm, setSearchTerm,
        selectedLabs, setSelectedLabs,
        excludeNoStock, setExcludeNoStock,
        selectedPrinciple, setSelectedPrinciple, uniquePrinciples,
        loading, filteredPricesLot, paginatedData,
        currentPage, setCurrentPage, totalPages,
        itemsPerPage, setItemsPerPage,
        exportPayload: getExportPayload()
    };
}