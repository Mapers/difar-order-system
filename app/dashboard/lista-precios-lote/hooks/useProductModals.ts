import { useState } from "react";
import { PriceService } from "@/app/services/price/PriceService";
import apiClient from "@/app/api/client";
import { PrecioLote, LoteInfo, Escala, Bonificacion } from "../types";

export function useProductModals() {
    const [selectedProduct, setSelectedProduct] = useState<PrecioLote | null>(null);

    // Estados para Lotes
    const [lotsModalOpen, setLotsModalOpen] = useState(false);
    const [lotDetails, setLotDetails] = useState<LoteInfo[]>([]);
    const [loadingLots, setLoadingLots] = useState(false);

    // Estados para Kardex
    const [kardexModalOpen, setKardexModalOpen] = useState(false);
    const [kardexData, setKardexData] = useState<any[]>([]);
    const [loadingKardex, setLoadingKardex] = useState(false);

    // Estados para Precios
    const [pricesModalOpen, setPricesModalOpen] = useState(false);
    const [priceDetails, setPriceDetails] = useState<PrecioLote | null>(null);
    const [escalas, setEscalas] = useState<Escala[]>([]);
    const [bonificaciones, setBonificaciones] = useState<Bonificacion[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Edición de Precios
    const [isEditing, setIsEditing] = useState(false);
    const [editForms, setEditForms] = useState({ contado: "", credito: "", bonifCont: "", bonifCred: "" });
    const [saving, setSaving] = useState(false);

    const openLots = async (product: PrecioLote) => {
        setSelectedProduct(product);
        setLotsModalOpen(true);
        setLoadingLots(true);
        try {
            const response = await PriceService.getProductLots(product.prod_codigo);
            setLotDetails(response.data || []);
        } catch (error) {
            setLotDetails([]);
        } finally {
            setLoadingLots(false);
        }
    };

    const openKardex = async (product: PrecioLote) => {
        setSelectedProduct(product);
        setKardexModalOpen(true);
        setLoadingKardex(true);
        try {
            const response = await apiClient.get(`/price/kardex/${product.prod_codigo}`);
            setKardexData(response.data?.data || []);
        } catch (error) {
            setKardexData([]);
        } finally {
            setLoadingKardex(false);
        }
    };

    const openPrices = async (product: PrecioLote) => {
        setPriceDetails(product);
        setPricesModalOpen(true);
        setIsEditing(false);
        setEditForms({
            contado: product.precio_contado || "",
            credito: product.precio_credito || "",
            bonifCont: product.precio_bonif_cont || "",
            bonifCred: product.precio_bonif_cred || ""
        });

        setLoadingDetails(true);
        try {
            const response = await apiClient.get(`/articulos/bonusScale/getByProd?code=${product.prod_codigo}`);
            const data = response.data?.data || {};
            setEscalas((data.scale || []).map((item: any, i: number) => ({
                id: i, desde: Number(item.minimo), hasta: Number(item.maximo), precio: Number(item.Precio),
            })));
            setBonificaciones((data.bonus || []).map((item: any, i: number) => ({
                id: i, compra: Number(item.Factor), lleva: Number(item.Cantidad), descripcion: item.Descripcion,
                esMismoProducto: item.mismoProduct === 'S', productoBonificado: item.mismoProduct === 'S' ? null : item.IdArticuloBonif,
                descripcionProducto: item.mismoProduct === 'S' ? null : item.DescArticuloBonif
            })));
        } catch (error) {
            setEscalas([]); setBonificaciones([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleSavePrices = async () => {
        if (!priceDetails) return;
        setSaving(true);
        try {
            const payload = {
                code: priceDetails.prod_codigo,
                contado: editForms.contado, credito: editForms.credito,
                contadoBonif: editForms.bonifCont, creditoBonif: editForms.bonifCred
            };
            const response = await apiClient.post('/price/list-prices/edit', payload);
            if (response.data.success) {
                setPriceDetails({
                    ...priceDetails,
                    precio_contado: editForms.contado, precio_credito: editForms.credito,
                    precio_bonif_cont: editForms.bonifCont, precio_bonif_cred: editForms.bonifCred
                });
                setIsEditing(false);
            }
        } catch (error) {
            alert("Error al guardar los precios");
        } finally {
            setSaving(false);
        }
    };

    return {
        selectedProduct,
        lots: { open: lotsModalOpen, setOpen: setLotsModalOpen, data: lotDetails, loading: loadingLots, onOpen: openLots },
        kardex: { open: kardexModalOpen, setOpen: setKardexModalOpen, data: kardexData, loading: loadingKardex, onOpen: openKardex },
        prices: {
            open: pricesModalOpen, setOpen: setPricesModalOpen, data: priceDetails, loading: loadingDetails,
            escalas, bonificaciones, isEditing, setIsEditing, editForms, setEditForms, saving, handleSavePrices, onOpen: openPrices
        }
    };
}