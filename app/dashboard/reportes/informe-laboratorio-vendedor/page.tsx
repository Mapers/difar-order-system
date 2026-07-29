'use client'

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, FlaskConical, Search, Users, X, Calendar as CalendarIcon, Eye, Loader2, Package } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { useAuth } from "@/context/authContext"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MonthYearPicker } from "@/components/ui/month-year-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import apiClient from '@/app/api/client'

import { ExportLabSellerPdf, LabSellerReportData } from "@/components/reporte/exportLabSellerPdf"
import { ExportDetalleLabVendedorPdf } from "@/components/reporte/exportDetalleLabVendedorPdf"
import { ExportDetalleLabVendedorExcel } from "@/components/reporte/exportDetalleLabVendedorExcel"
import { formatDocumentoConTipo, formatFechaEmision } from "@/components/reporte/detalleLabVendedorShared"
import {Laboratorio} from "@/app/types/user-types";
import { useCuotasReporte } from "@/app/hooks/useCuotasReporte"
import {
    calcPctCuota, estadoCuota, coloresEstado, capPctCuota,
    restanteCuota, sinIgv,
} from "@/app/utils/cuotas-helpers"

interface ProductoAgrupadoBase {
    Codigo_Art: string
    NombreItem: string
    AbrevUnidMed: string
    TotalCantidad: number
    TotalVentas: number
    /** Facturadas: numerador del % de cumplimiento, al margen del switch. */
    TotalCantFact: number
    TotalVentasFact: number
}

interface ProductoConCuota extends ProductoAgrupadoBase {
    cuotaCant: number
    cuotaSoles: number
    /** null solo cuando no hay ni cuota ni venta: la columna no aplica. */
    restante: number | null
    pct: number | null
    sinVentas: boolean
}

/**
 * Celda de % de cumplimiento: barra + número con el color del semáforo.
 *
 * pct nulo significa "no hay cuota contra la cual medir" y se muestra "—",
 * que es distinto de 0%.
 *
 * El valor se topa a 100%: una cuota superada se lee "100%", no "1018%".
 * El semáforo se decide con el porcentaje real, aunque dé lo mismo porque
 * cualquier valor sobre 100 ya es verde.
 */
function CeldaCumplimiento({ pct, compacta = false }: { pct: number | null; compacta?: boolean }) {
    if (pct === null) {
        return <span className="text-xs text-muted-foreground">—</span>
    }
    const c = coloresEstado[estadoCuota(pct)]
    const mostrado = capPctCuota(pct)!
    return (
        <div className={cn("flex items-center gap-2", compacta && "w-full")}>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
                <div className={cn("h-full rounded-full", c.barra)} style={{ width: `${mostrado}%` }} />
            </div>
            <span className={cn("text-xs font-bold tabular-nums whitespace-nowrap", c.texto)}>
                {mostrado.toFixed(2)}%
            </span>
        </div>
    )
}

export default function LabSellerReportPage() {
    const auth = useAuth()
    const isManagerOrAdmin = auth.isAdmin();
    const isRepresentative = auth.isRepresentante();
    const isVendor = auth.isVendedor();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<LabSellerReportData[]>([]);

    const [catLaboratorios, setCatLaboratorios] = useState<Laboratorio[]>([]);
    const [catVendedores, setCatVendedores] = useState<any[]>([]);

    const [selectedLabs, setSelectedLabs] = useState<number[]>([]);
    const [selectedVends, setSelectedVends] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [excluirSerie0800, setExcluirSerie0800] = useState(false);
    // Apagado por defecto: así el reporte sigue devolviendo lo mismo de siempre.
    // El % de cumplimiento NO depende de este switch, siempre usa la venta
    // facturada que el SP devuelve aparte.
    const [soloFacturado, setSoloFacturado] = useState(false);

    // Período consultado, no el del filtro: las cuotas tienen que corresponder
    // a los datos que están en pantalla, no a lo que el usuario esté eligiendo.
    const [periodoConsultado, setPeriodoConsultado] = useState<{ anio: number; mes: number }>(
        { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 }
    );
    // Vendedores del reporte que está en pantalla. Array vacío = todos.
    // Acota el total de cuotas: sp_pbl_meta_vend_listar devuelve TODOS los
    // vendedores del laboratorio, así que sin esto un reporte filtrado por un
    // vendedor sumaría la cuota de sus compañeros.
    const [vendedoresConsultados, setVendedoresConsultados] = useState<string[]>([]);
    const {
        hayCiclo, cicloResuelto, cuotaVendedor,
        cargarCuotasItems, cuotasDeItems,
    } = useCuotasReporte(periodoConsultado.anio, periodoConsultado.mes);

    const [openLab, setOpenLab] = useState(false);
    const [openVend, setOpenVend] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailData, setDetailData] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'laboratorios' | 'productos'>('laboratorios');
    const [selectionModalOpen, setSelectionModalOpen] = useState(false);
    const [pendingDetail, setPendingDetail] = useState<{ labName: string; vendCodigo: string } | null>(null);
    // (laboratorio, vendedor) del detalle abierto, para saber qué cuotas cruzar.
    const [detalleLabVend, setDetalleLabVend] = useState<{ idLab: number; codVend: string } | null>(null);
    // R2.5: divide montos, nunca porcentajes ni cantidades.
    const [quitarIgv, setQuitarIgv] = useState(false);

    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const resLabs = await apiClient.get('/price/laboratories');
                setCatLaboratorios(resLabs.data?.data || []);

                if (isManagerOrAdmin) {
                    const resVends = await apiClient.get('/usuarios/listar/vendedores');
                    const vendsList = resVends.data?.data?.data || resVends.data?.data || [];
                    setCatVendedores(vendsList);
                } else if (isVendor) {
                    // solo el vendedor se pre-selecciona con su propio código;
                    // el representante NO, para que handleSearch use sus vendedores (user.vendedores)
                    if (auth.user?.codigo) setSelectedVends([auth.user.codigo]);
                }
            } catch (error) {
                console.error("Error cargando catálogos", error);
            }
        };

        fetchCatalogs();
    }, [isManagerOrAdmin, auth.user]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const anioSeleccionado = selectedDate.getFullYear();
            const mesSeleccionado = selectedDate.getMonth() + 1;

            let vendorsToQuery: string[] = [];

            if (selectedVends.length > 0) {
                vendorsToQuery = selectedVends;
            } else {
                if (isManagerOrAdmin) {
                    vendorsToQuery = [];
                } else if (isRepresentative) {
                    vendorsToQuery = auth.user?.vendedores?.map(v => v.codigo) || [];
                    if (vendorsToQuery.length === 0) vendorsToQuery = ['SIN_VENDEDORES'];
                } else if (isVendor) {
                    vendorsToQuery = auth.user?.codigo ? [auth.user.codigo] : [];
                }
            }

            const payload = {
                laboratorios: selectedLabs.length > 0 ? selectedLabs : [],
                vendedores: vendorsToQuery,
                anio: anioSeleccionado,
                mes: mesSeleccionado,
                excluir: excluirSerie0800,
                solo_facturado: soloFacturado
            };

            const response = await apiClient.post('/reportes/informe-laboratorio-vendedor', payload);

            // Al filtrar por vendedor hay que recalcular los dos totales del
            // laboratorio, no solo el visible: el facturado es el denominador
            // del % del laboratorio.
            const recalcularTotales = (lab: any) => ({
                ...lab,
                totalVentasLaboratorio: lab.vendedores.reduce((acc: number, v: any) => acc + Number(v.SumaDeVta_Tot || 0), 0),
                totalVentasFacturadas:  lab.vendedores.reduce((acc: number, v: any) => acc + Number(v.SumaDeVta_Fact || 0), 0),
            });

            let reportData = response.data?.data || [];
            if (isRepresentative && vendorsToQuery.length > 0 && vendorsToQuery[0] !== 'SIN_VENDEDORES') {
                reportData = reportData.map((lab: any) => ({
                    ...lab,
                    vendedores: lab.vendedores.filter((v: any) => vendorsToQuery.includes(v.Codigo_Vend))
                })).map(recalcularTotales).filter((lab: any) => lab.vendedores.length > 0);
            } else if (isVendor && auth.user?.codigo) {
                reportData = reportData.map((lab: any) => ({
                    ...lab,
                    vendedores: lab.vendedores.filter((v: any) => v.Codigo_Vend === auth.user?.codigo)
                })).map(recalcularTotales).filter((lab: any) => lab.vendedores.length > 0);
            }

            setData(reportData);
            setPeriodoConsultado({ anio: anioSeleccionado, mes: mesSeleccionado });
            // 'SIN_VENDEDORES' es el centinela del representante sin vendedores
            // asignados: no es un código real y no debe acotar nada.
            setVendedoresConsultados(
                vendorsToQuery.filter(v => v && v !== 'SIN_VENDEDORES')
            );

            if(reportData.length === 0) {
                toast({ description: "No se encontraron datos en este periodo" });
            }
        } catch (error) {
            console.error("Error buscando el reporte:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    const openDetailModal = async (labName: string, vendCodigo: string) => {
        const foundLab = catLaboratorios.find(l => `${l.Codigo_Linea} ${l.Descripcion}` === labName);
        if (!foundLab) {
            toast({ description: "Error al identificar el laboratorio.", variant: "destructive" });
            return;
        }

        setModalOpen(true);
        setDetailLoading(true);
        setDetailData(null);

        try {
            const anio = selectedDate.getFullYear();
            const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const fechaStr = `${anio}-${mes}-01`;

            const res = await apiClient.post('/reportes/detalle-laboratorio-vendedor', {
                fecha: fechaStr,
                id_laboratorio: foundLab.IdLineaGe,
                codigo_vendedor: vendCodigo,
                excluir: excluirSerie0800,
                solo_facturado: soloFacturado
            });

            // Las cuotas por artículo van aparte del detalle: un producto con
            // meta y sin ventas no viene en la respuesta del kardex, y es el
            // caso "Sin ventas → restante = cuota, 0%".
            setDetalleLabVend({ idLab: Number(foundLab.IdLineaGe), codVend: vendCodigo });
            await cargarCuotasItems(Number(foundLab.IdLineaGe), vendCodigo);

            if (res.data?.data && res.data.data.length > 0) {
                setDetailData(res.data.data);
            } else {
                toast({ description: "No hay detalle de ítems para mostrar." });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo cargar el detalle", variant: "destructive" });
        } finally {
            setDetailLoading(false);
        }
    };

    const productosAgrupados = useMemo(() => {
        if (!detailData || detailData.length === 0) return [];
        const map = new Map<string, ProductoAgrupadoBase>();
        for (const lab of detailData[0].Laboratorios) {
            for (const cli of lab.Clientes) {
                for (const item of cli.Items) {
                    const existing = map.get(item.Codigo_Art);
                    if (existing) {
                        existing.TotalCantidad   += Number(item.Cantidad_Sal) || 0;
                        existing.TotalVentas     += Number(item.SumaDeVta_Tot) || 0;
                        existing.TotalCantFact   += Number(item.Cant_Fact) || 0;
                        existing.TotalVentasFact += Number(item.Vta_Fact) || 0;
                    } else {
                        map.set(item.Codigo_Art, {
                            Codigo_Art: item.Codigo_Art,
                            NombreItem: item.NombreItem,
                            AbrevUnidMed: item.AbrevUnidMed,
                            TotalCantidad:   Number(item.Cantidad_Sal) || 0,
                            TotalVentas:     Number(item.SumaDeVta_Tot) || 0,
                            // Facturadas: numerador del % de cumplimiento.
                            TotalCantFact:   Number(item.Cant_Fact) || 0,
                            TotalVentasFact: Number(item.Vta_Fact) || 0,
                        });
                    }
                }
            }
        }
        return Array.from(map.values()).sort((a, b) => b.TotalVentas - a.TotalVentas);
    }, [detailData]);

    /**
     * Productos con cuota, restante y semáforo.
     *
     * Un producto con meta que no se vendió no está en productosAgrupados
     * (sale del kardex): se agrega con cantidad y venta en 0 para cubrir el
     * caso "Sin ventas → restante = cuota, 0%" y para que la fila de totales
     * incluya toda la cuota del vendedor en ese laboratorio.
     */
    const productosConCuota = useMemo<ProductoConCuota[]>(() => {
        const cuotas = detalleLabVend
            ? cuotasDeItems(detalleLabVend.idLab, detalleLabVend.codVend)
            : [];
        const porArt = new Map(cuotas.map(c => [c.cod_articulo, c]));

        // La cuota en soles es el meta_monto configurado, tal cual está en
        // pbl_meta_laboratorio_vendedor_item. NO se revaloriza al precio real
        // de venta: así el total de esta vista coincide con la cuota que
        // muestra la vista 1 para el mismo (laboratorio, vendedor), que sale
        // del mismo campo.
        //
        // Consecuencia asumida: cuando el precio real difiere del precio_ref
        // de la meta, el % en soles deja de ser igual al % en unidades.
        // Manda el % en soles, que es contra lo que se mide la cuota.
        const filas: ProductoConCuota[] = productosAgrupados.map(p => {
            const c = porArt.get(p.Codigo_Art);
            const cuotaCant = c?.meta_cantidad ?? 0;
            const cSoles = c?.meta_monto ?? 0;
            return {
                ...p,
                cuotaCant,
                cuotaSoles: cSoles,
                restante: restanteCuota(cuotaCant, p.TotalCantFact),
                pct: calcPctCuota(p.TotalVentasFact, cSoles),
                sinVentas: false,
            };
        });

        const yaListados = new Set(filas.map(f => f.Codigo_Art));
        for (const c of cuotas) {
            if (yaListados.has(c.cod_articulo) || c.meta_cantidad <= 0) continue;
            filas.push({
                Codigo_Art: c.cod_articulo,
                // El nombre sale de la meta, no del kardex: estos productos no
                // tienen ninguna venta en el período.
                NombreItem: c.nombre_item || '(artículo no encontrado en el maestro)',
                AbrevUnidMed: c.abrev_unidad,
                TotalCantidad: 0, TotalVentas: 0,
                TotalCantFact: 0, TotalVentasFact: 0,
                cuotaCant: c.meta_cantidad,
                cuotaSoles: c.meta_monto,
                restante: c.meta_cantidad,
                pct: 0,
                sinVentas: true,
            });
        }

        return filas.sort((a, b) => b.TotalVentas - a.TotalVentas);
    }, [productosAgrupados, cuotasDeItems, detalleLabVend]);

    /** Fila de totales de la vista de productos (R2.7). */
    const totalesProductos = useMemo(() => {
        const suma = (f: (p: ProductoConCuota) => number) =>
            productosConCuota.reduce((a, p) => a + f(p), 0);
        const cuotaSol = suma(p => p.cuotaSoles);
        return {
            cantidad: suma(p => p.TotalCantidad),
            ventas:   suma(p => p.TotalVentas),
            cuotaCant: suma(p => p.cuotaCant),
            cuotaSoles: cuotaSol,
            // Suma de los faltantes por producto, no la resta de los totales.
            // Así responde "cuántas unidades faltan vender en total"; con la
            // resta de agregados, un producto muy superado tapaba el faltante
            // de todos los demás.
            restante: suma(p => p.restante ?? 0),
            pct: calcPctCuota(suma(p => p.TotalVentasFact), cuotaSol),
        };
    }, [productosConCuota]);

    /** R2.5: el switch afecta montos, no porcentajes ni cantidades. */
    const money = (n: number) => formatMoney(quitarIgv ? sinIgv(n) : n);

    /**
     * Filas de la vista 1 con cuota, % y semáforo.
     *
     * Un vendedor con cuota que no vendió NO viene en la respuesta del reporte,
     * porque esa sale del kardex. Se agrega acá con ventas en 0 para cubrir el
     * caso "Sin ventas → 0%" y para que las filas visibles sumen el total de
     * cuotas del laboratorio (R1.4). Sin esto, el total no cuadraría con lo
     * que el usuario ve.
     *
     * El % usa SIEMPRE SumaDeVta_Fact, no SumaDeVta_Tot: la cuota está en soles
     * facturados. Con el switch apagado, la columna Ventas trae también
     * operaciones que no son venta facturada (en julio 2026, 19,415.09 sobre
     * 143,520.91) y el porcentaje saldría inflado.
     */
    const dataConCuotas = useMemo(() => {
        // Solo se consideran los vendedores dentro del alcance consultado.
        // sp_pbl_meta_vend_listar devuelve todos los del laboratorio; sin este
        // filtro, un reporte de un solo vendedor traía la cuota de todos sus
        // compañeros y el % se hundía.
        const enAlcance = (codVend: string) =>
            vendedoresConsultados.length === 0 || vendedoresConsultados.includes(codVend);

        const filaVendedorSinVentas = (codVend: string, cuota: number) => {
            const cat = catVendedores.find((x: any) => x.Codigo_Vend === codVend);
            return {
                Codigo_Vend: codVend,
                Vendedor: cat ? `${codVend} ${cat.Nombres}, ${cat.Apellidos}` : codVend,
                SumaDeVta_Tot: 0,
                SumaDeVta_Fact: 0,
                cuota,
                pct: 0,
                estado: estadoCuota(0),
                sinVentas: true,
            };
        };

        const conCuota = data.map((lab: any) => {
            const idLab = Number(lab.IdLineaGe);

            const vendedores = lab.vendedores.map((v: any) => {
                const cuota = cuotaVendedor.get(`${idLab}|${v.Codigo_Vend}`) ?? 0;
                const pct = calcPctCuota(Number(v.SumaDeVta_Fact) || 0, cuota);
                return { ...v, cuota, pct, estado: estadoCuota(pct), sinVentas: false };
            });

            const yaListados = new Set(vendedores.map((v: any) => v.Codigo_Vend));
            for (const [claveCuota, cuota] of cuotaVendedor) {
                const [labId, codVend] = claveCuota.split('|');
                if (Number(labId) !== idLab || yaListados.has(codVend) || !enAlcance(codVend)) continue;
                vendedores.push(filaVendedorSinVentas(codVend, cuota));
            }

            const cuotaLab = vendedores.reduce((a: number, v: any) => a + Number(v.cuota || 0), 0);
            const factLab = vendedores.reduce((a: number, v: any) => a + Number(v.SumaDeVta_Fact || 0), 0);

            return { ...lab, vendedores, cuotaLab, pctLab: calcPctCuota(factLab, cuotaLab) };
        });

        // Laboratorios con cuota donde NO se vendió nada. No vienen en la
        // respuesta del reporte, que sale del kardex, así que su cuota se
        // perdía del total. Y son el peor caso posible: meta asignada y cero
        // avance. Esconderlos es justo lo contrario de lo que sirve.
        const idsPresentes = new Set(data.map((l: any) => Number(l.IdLineaGe)));
        const porLabAusente = new Map<number, { codVend: string; cuota: number }[]>();
        for (const [claveCuota, cuota] of cuotaVendedor) {
            const [labId, codVend] = claveCuota.split('|');
            const idLab = Number(labId);
            if (idsPresentes.has(idLab) || !enAlcance(codVend)) continue;
            if (!porLabAusente.has(idLab)) porLabAusente.set(idLab, []);
            porLabAusente.get(idLab)!.push({ codVend, cuota });
        }

        const mes = data[0]?.Mes ?? '';
        const anio = data[0]?.Año ?? periodoConsultado.anio;

        for (const [idLab, vends] of porLabAusente) {
            const cat = catLaboratorios.find((l: any) => Number(l.IdLineaGe) === idLab);
            const cuotaLab = vends.reduce((a, v) => a + v.cuota, 0);
            conCuota.push({
                Laboratorio: cat ? `${cat.Codigo_Linea} ${cat.Descripcion}` : `Lab #${idLab}`,
                IdLineaGe: idLab,
                Mes: mes,
                Año: anio,
                totalVentasLaboratorio: 0,
                totalVentasFacturadas: 0,
                vendedores: vends.map(v => filaVendedorSinVentas(v.codVend, v.cuota)),
                cuotaLab,
                pctLab: calcPctCuota(0, cuotaLab),
            } as any);
        }

        return conCuota;
    }, [data, cuotaVendedor, catVendedores, catLaboratorios, vendedoresConsultados, periodoConsultado]);

    const totalGeneral = useMemo(
        () => dataConCuotas.reduce((acc: number, lab: any) => acc + (lab.totalVentasLaboratorio || 0), 0),
        [dataConCuotas]
    );

    /** Cuota consolidada y % global de todos los laboratorios (R1.5). */
    const totalGeneralCuotas = useMemo(() => {
        const cuota = dataConCuotas.reduce((a: number, l: any) => a + Number(l.cuotaLab || 0), 0);
        const fact = dataConCuotas.reduce(
            (a: number, l: any) => a + l.vendedores.reduce((b: number, v: any) => b + Number(v.SumaDeVta_Fact || 0), 0),
            0
        );
        return { cuota, pct: calcPctCuota(fact, cuota) };
    }, [dataConCuotas]);

    const handleDetalleBtnClick = (labName: string, vendCodigo: string) => {
        setPendingDetail({ labName, vendCodigo });
        setSelectionModalOpen(true);
    };

    const executeDetailModal = (mode: 'laboratorios' | 'productos') => {
        if (!pendingDetail) return;
        setViewMode(mode);
        setSelectionModalOpen(false);
        openDetailModal(pendingDetail.labName, pendingDetail.vendCodigo);
    };

    const toggleLab = (id: number) => setSelectedLabs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleVend = (cod: string) => setSelectedVends(prev => prev.includes(cod) ? prev.filter(x => x !== cod) : [...prev, cod]);

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="grid gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Ventas por Vendedor</h1>
                <p className="text-sm md:text-base text-muted-foreground">Consulta las ventas agrupadas por laboratorio y vendedor del mes seleccionado.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4 md:p-5">
                    <div className="flex flex-col gap-4">
                        {/* Fila de filtros */}
                        <div className={cn(
                            "grid grid-cols-1 gap-4 sm:grid-cols-2",
                            isManagerOrAdmin && "lg:grid-cols-3"
                        )}>
                            {/* Periodo */}
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <CalendarIcon className="w-4 h-4 shrink-0"/> Periodo (Mes y Año)
                                </label>
                                <MonthYearPicker
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                />
                            </div>

                            {/* Laboratorios */}
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                    <FlaskConical className="w-4 h-4 shrink-0"/> Laboratorios
                                </label>
                                <Popover open={openLab} onOpenChange={setOpenLab}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="justify-between w-full h-10 px-3 bg-background font-normal">
                                            {selectedLabs.length > 0 ? <span className="text-sm font-semibold text-blue-700 truncate">{selectedLabs.length} seleccionado(s)</span> : <span className="text-muted-foreground text-sm">Todos...</span>}
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0 z-50" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar laboratorio..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontró laboratorio.</CommandEmpty>
                                                <CommandGroup>
                                                    {catLaboratorios.map((lab) => (
                                                        <CommandItem key={lab.IdLineaGe} onSelect={() => toggleLab(lab.IdLineaGe)}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedLabs.includes(lab.IdLineaGe) ? "opacity-100" : "opacity-0")}/>
                                                            {lab.Descripcion}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedLabs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedLabs.map(id => {
                                            const found = catLaboratorios.find(l => l.IdLineaGe === id);
                                            return found ? (
                                                <Badge key={id} variant="secondary" className="max-w-full text-[10px] md:text-xs px-2 py-0.5 font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                                                    <span className="truncate">{found.Descripcion}</span> <X className="ml-1.5 h-3 w-3 shrink-0 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => toggleLab(id)} />
                                                </Badge>
                                            ) : null;
                                        })}
                                        <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:underline self-center ml-1 font-medium" onClick={() => setSelectedLabs([])}>Limpiar</span>
                                    </div>
                                )}
                            </div>

                            {/* Vendedores (solo admin) */}
                            {isManagerOrAdmin && (
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                        <Users className="w-4 h-4 shrink-0"/> Vendedores
                                    </label>
                                    <Popover open={openVend} onOpenChange={setOpenVend}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="justify-between w-full h-10 px-3 bg-background font-normal">
                                                {selectedVends.length > 0 ? <span className="text-sm font-semibold text-orange-700 truncate">{selectedVends.length} seleccionado(s)</span> : <span className="text-muted-foreground text-sm">Todos...</span>}
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[260px] p-0 z-50" align="start">
                                            <Command>
                                                <CommandInput placeholder="Buscar vendedor..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró vendedor.</CommandEmpty>
                                                    <CommandGroup>
                                                        {catVendedores.map((vend) => (
                                                            <CommandItem key={vend.Codigo_Vend || vend.codigo} onSelect={() => toggleVend(vend.Codigo_Vend || vend.codigo)}>
                                                                <Check className={cn("mr-2 h-4 w-4", selectedVends.includes(vend.Codigo_Vend || vend.codigo) ? "opacity-100" : "opacity-0")}/>
                                                                {vend.Nombres || vend.nombres} {vend.Apellidos || vend.apellidos}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {selectedVends.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedVends.map(cod => {
                                                const found = catVendedores.find(v => (v.Codigo_Vend || v.codigo) === cod);
                                                return found ? (
                                                    <Badge key={cod} variant="secondary" className="max-w-full text-[10px] md:text-xs px-2 py-0.5 font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200">
                                                        <span className="truncate">{found.Nombres || found.nombres}</span> <X className="ml-1.5 h-3 w-3 shrink-0 cursor-pointer hover:text-red-500 hover:bg-red-100 rounded-full" onClick={() => toggleVend(cod)} />
                                                    </Badge>
                                                ) : null;
                                            })}
                                            <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:underline self-center ml-1 font-medium" onClick={() => setSelectedVends([])}>Limpiar</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Pie: opciones + acciones */}
                        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-6">
                                <div className="flex items-center gap-2.5">
                                    <Switch
                                        id="excluir-serie-0800"
                                        checked={excluirSerie0800}
                                        onCheckedChange={setExcluirSerie0800}
                                    />
                                    <label htmlFor="excluir-serie-0800" className="text-sm font-medium text-foreground cursor-pointer select-none">
                                        Excluir serie 0800
                                    </label>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Switch
                                        id="solo-facturado"
                                        checked={soloFacturado}
                                        onCheckedChange={setSoloFacturado}
                                    />
                                    <label htmlFor="solo-facturado" className="text-sm font-medium text-foreground cursor-pointer select-none">
                                        Solo facturado
                                        <span className="block text-[10px] font-normal text-muted-foreground leading-tight">
                                            El % de cumplimiento siempre usa venta facturada
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-sm h-10">
                                    <Search className="mr-2 h-4 w-4" /> Buscar
                                </Button>
                                <ExportLabSellerPdf data={dataConCuotas} disabled={loading || data.length === 0} />
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-muted/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-muted-foreground font-medium">Generando reporte, por favor espera...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <div className="space-y-6">
                            {cicloResuelto && !hayCiclo && (
                                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                    No hay un ciclo de metas cargado para este período: las columnas de cuota y
                                    % de cumplimiento no aplican. No es lo mismo que una cuota en cero.
                                </div>
                            )}
                            {dataConCuotas.map((lab: any, idx: number) => (
                                <div key={idx} className="border border-border rounded-lg overflow-hidden shadow-sm bg-background">
                                    <div className="bg-indigo-600 text-white p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                        <span className="text-lg font-bold text-center sm:text-left">{lab.Laboratorio}</span>
                                        <Badge className="text-[10px] sm:text-xs font-medium bg-indigo-800/60 hover:bg-indigo-800/60 text-indigo-50 border-none w-fit mx-auto sm:mx-0">
                                            Mes: {lab.Mes} | Año: {lab.Año}
                                        </Badge>
                                    </div>

                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm text-left text-muted-foreground">
                                            <thead className="text-xs text-muted-foreground uppercase bg-muted border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 font-bold min-w-[120px]">Cód Vendedor</th>
                                                <th className="px-4 py-3 font-bold min-w-[200px]">Nombre Vendedor</th>
                                                <th className="px-4 py-3 font-bold text-right min-w-[150px]">Ventas (S/.)</th>
                                                <th className="px-4 py-3 font-bold text-right min-w-[130px]">Cuota (S/.)</th>
                                                <th className="px-4 py-3 font-bold text-center min-w-[170px]">% Cumplimiento</th>
                                                <th className="px-4 py-3 font-bold text-center w-[120px]">Acciones</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {lab.vendedores.map((vend: any, vIdx: number) => {
                                                const nombreLimpio = vend.Vendedor.substring(vend.Codigo_Vend.length).trim();
                                                return (
                                                    <tr key={vIdx} className="bg-background border-b border-border hover:bg-muted transition-colors">
                                                        <td className="px-4 py-3 font-mono font-medium text-foreground">{vend.Codigo_Vend}</td>
                                                        <td className="px-4 py-3 text-foreground">{nombreLimpio}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                                                            S/ {formatMoney(vend.SumaDeVta_Tot)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-foreground">
                                                            {vend.cuota > 0 ? `S/ ${formatMoney(vend.cuota)}` : "—"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <CeldaCumplimiento pct={vend.pct} />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" disabled={vend.sinVentas} onClick={() => handleDetalleBtnClick(lab.Laboratorio, vend.Codigo_Vend)}>
                                                                <Eye className="w-4 h-4 mr-1"/> Detalle
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            </tbody>
                                            <tfoot>
                                            <tr className="bg-emerald-50/50">
                                                <td colSpan={2} className="px-4 py-4 text-right text-emerald-800 uppercase tracking-wider text-xs font-bold">
                                                    Total Ventas:
                                                </td>
                                                <td className="px-4 py-4 text-right text-emerald-700 text-base font-bold">
                                                    S/ {formatMoney(lab.totalVentasLaboratorio)}
                                                </td>
                                                <td className="px-4 py-4 text-right text-emerald-700 text-base font-bold">
                                                    {lab.cuotaLab > 0 ? `S/ ${formatMoney(lab.cuotaLab)}` : "—"}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <CeldaCumplimiento pct={lab.pctLab} />
                                                </td>
                                                <td></td>
                                            </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 p-4 md:hidden bg-muted">
                                        {lab.vendedores.map((vend: any, vIdx: number) => {
                                            const nombreLimpio = vend.Vendedor.substring(vend.Codigo_Vend.length).trim();
                                            return (
                                                <div key={vIdx} className="bg-background p-4 rounded-lg border border-border shadow-sm flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-sm text-foreground pr-2">{nombreLimpio}</span>
                                                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded font-bold whitespace-nowrap">
                                                            {vend.Codigo_Vend}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-t border-border pt-2 mt-1">
                                                        <span className="text-xs uppercase text-muted-foreground font-bold">Ventas:</span>
                                                        <span className="font-bold text-indigo-700 text-sm">
                                                            S/ {formatMoney(vend.SumaDeVta_Tot)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs uppercase text-muted-foreground font-bold">Cuota:</span>
                                                        <span className="font-semibold text-foreground text-sm">
                                                            {vend.cuota > 0 ? `S/ ${formatMoney(vend.cuota)}` : "—"}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs uppercase text-muted-foreground font-bold">Cumplimiento:</span>
                                                        <CeldaCumplimiento pct={vend.pct} compacta />
                                                    </div>
                                                    <Button variant="outline" size="sm" className="w-full mt-2 text-indigo-600 border-indigo-200 bg-indigo-50/50" disabled={vend.sinVentas} onClick={() => handleDetalleBtnClick(lab.Laboratorio, vend.Codigo_Vend)}>
                                                        <Eye className="w-4 h-4 mr-2"/> Ver Detalle
                                                    </Button>
                                                </div>
                                            )
                                        })}

                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-2 flex flex-col items-center shadow-sm gap-1">
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Ventas Laboratorio</span>
                                            <span className="font-black text-emerald-800 text-lg">
                                                S/ {formatMoney(lab.totalVentasLaboratorio)}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase mt-1">Cuota</span>
                                            <span className="font-bold text-emerald-800 text-sm">
                                                {lab.cuotaLab > 0 ? `S/ ${formatMoney(lab.cuotaLab)}` : "—"}
                                            </span>
                                            <div className="w-full px-4 mt-1">
                                                <CeldaCumplimiento pct={lab.pctLab} compacta />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="bg-background border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center shadow-md mt-6 sticky bottom-4">
                                <span className="text-sm font-bold uppercase tracking-wider text-foreground mb-2 sm:mb-0">Total General (Todos los Laboratorios)</span>
                                <div className="flex flex-col gap-3 items-stretch sm:flex-row sm:items-center sm:gap-8">
                                    <div className="text-center sm:text-right bg-blue-50 p-2 rounded-md sm:bg-transparent sm:p-0 border border-blue-100 sm:border-none">
                                        <p className="text-xs text-blue-600 font-semibold uppercase">Total Ventas</p>
                                        <p className="text-lg sm:text-xl font-bold text-blue-800">S/ {formatMoney(totalGeneral)}</p>
                                    </div>
                                    <div className="text-center sm:text-right bg-blue-50 p-2 rounded-md sm:bg-transparent sm:p-0 border border-blue-100 sm:border-none">
                                        <p className="text-xs text-blue-600 font-semibold uppercase">Total Cuotas</p>
                                        <p className="text-lg sm:text-xl font-bold text-blue-800">
                                            {totalGeneralCuotas.cuota > 0 ? `S/ ${formatMoney(totalGeneralCuotas.cuota)}` : "—"}
                                        </p>
                                    </div>
                                    <div className="min-w-[150px]">
                                        <p className="text-xs text-blue-600 font-semibold uppercase mb-1 text-center sm:text-right">Cumplimiento</p>
                                        <CeldaCumplimiento pct={totalGeneralCuotas.pct} compacta />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-background rounded-lg border-2 border-dashed border-border">
                            <p className="text-muted-foreground font-medium text-center px-4">
                                No hay datos de ventas para mostrar con los filtros seleccionados.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={selectionModalOpen} onOpenChange={setSelectionModalOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">¿Cómo deseas ver el detalle?</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-2">
                        <button
                            onClick={() => executeDetailModal('laboratorios')}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                            <FlaskConical className="h-8 w-8 text-indigo-500" />
                            <span className="text-sm font-semibold text-foreground">Por Laboratorios</span>
                            <span className="text-[11px] text-muted-foreground text-center leading-tight">Agrupado por cliente e ítem</span>
                        </button>
                        <button
                            onClick={() => executeDetailModal('productos')}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                            <Package className="h-8 w-8 text-emerald-500" />
                            <span className="text-sm font-semibold text-foreground">Por Productos</span>
                            <span className="text-[11px] text-muted-foreground text-center leading-tight">Total cantidad y monto por producto</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-muted p-0">
                    <DialogHeader className="p-4 md:p-6 bg-background border-b border-border flex-shrink-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <DialogTitle className="text-xl text-indigo-800">
                                    {viewMode === 'laboratorios' ? 'Detalle por Laboratorio' : 'Detalle por Productos'}
                                </DialogTitle>
                                {detailData && detailData.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1 font-medium">{detailData[0].Vendedor} | {detailData[0].Laboratorios[0].Laboratorio}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                                {viewMode === 'productos' && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <Switch
                                            id="quitar-igv"
                                            checked={quitarIgv}
                                            onCheckedChange={setQuitarIgv}
                                        />
                                        <label htmlFor="quitar-igv" className="text-xs font-medium text-foreground cursor-pointer select-none whitespace-nowrap">
                                            Quitar IGV
                                        </label>
                                    </div>
                                )}
                                <ExportDetalleLabVendedorExcel
                                    data={detailData}
                                    viewMode={viewMode}
                                    productData={productosConCuota}
                                    quitarIgv={quitarIgv}
                                    totales={totalesProductos}
                                    disabled={detailLoading || !detailData}
                                />
                                <ExportDetalleLabVendedorPdf
                                    data={detailData}
                                    viewMode={viewMode}
                                    productData={productosConCuota}
                                    quitarIgv={quitarIgv}
                                    totales={totalesProductos}
                                    disabled={detailLoading || !detailData}
                                />
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto p-4 md:p-6 flex-1 custom-scrollbar">
                        {detailLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                                <p className="text-sm text-muted-foreground font-medium">Cargando detalle...</p>
                            </div>
                        ) : detailData && detailData.length > 0 ? (
                            viewMode === 'laboratorios' ? (
                                <div className="space-y-6">
                                    {detailData[0].Laboratorios[0].Clientes.map((cli: any, cIdx: number) => (
                                        <div key={cIdx} className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                                            <div className="bg-muted p-3 border-b border-border">
                                                <p className="text-sm font-bold text-foreground">{cli.Codigo} | {cli.Nombre}</p>
                                                {cli.NombreComercial && <p className="text-xs text-muted-foreground mt-0.5">{cli.NombreComercial}</p>}
                                            </div>
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full text-xs text-left text-muted-foreground">
                                                    <thead className="bg-background border-b border-border">
                                                    <tr>
                                                        <th className="px-3 py-2 font-semibold">Cód. Art</th>
                                                        <th className="px-3 py-2 font-semibold text-center">Cant</th>
                                                        <th className="px-3 py-2 font-semibold text-center">U.M.</th>
                                                        <th className="px-3 py-2 font-semibold">Descripción</th>
                                                        <th className="px-3 py-2 font-semibold">Documento</th>
                                                        <th className="px-3 py-2 font-semibold text-center">F. Emisión</th>
                                                        <th className="px-3 py-2 font-semibold text-right">Total S/.</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                    {cli.Items.map((item: any, iIdx: number) => (
                                                        <tr key={iIdx} className="hover:bg-muted">
                                                            <td className="px-3 py-2 font-mono text-muted-foreground">{item.Codigo_Art}</td>
                                                            <td className="px-3 py-2 text-center font-medium">{item.Cantidad_Sal}</td>
                                                            <td className="px-3 py-2 text-center text-[10px] uppercase">{item.AbrevUnidMed}</td>
                                                            <td className="px-3 py-2">{item.NombreItem}</td>
                                                            <td className="px-3 py-2 font-mono text-[11px] whitespace-nowrap">{formatDocumentoConTipo(item)}</td>
                                                            <td className="px-3 py-2 text-center whitespace-nowrap">{formatFechaEmision(item)}</td>
                                                            <td className="px-3 py-2 text-right font-semibold text-foreground">{formatMoney(item.SumaDeVta_Tot)}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                    <tfoot className="bg-indigo-50/50">
                                                    <tr>
                                                        <td colSpan={6} className="px-3 py-2 text-right text-indigo-800 text-xs font-bold uppercase tracking-wider">Total Cliente:</td>
                                                        <td className="px-3 py-2 text-right text-indigo-700 font-bold">{formatMoney(cli.TotalCliente)}</td>
                                                    </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                            <div className="md:hidden grid grid-cols-1 gap-2 p-3 bg-muted">
                                                {cli.Items.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="bg-background border border-border rounded p-2 flex flex-col gap-1">
                                                        <span className="text-xs font-medium text-foreground">{item.NombreItem}</span>
                                                        <div className="flex justify-between items-center gap-2 text-[10px] text-muted-foreground">
                                                            <span className="font-mono">{formatDocumentoConTipo(item)}</span>
                                                            <span>{formatFechaEmision(item)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <Badge variant="outline" className="text-[10px] bg-muted">{item.Cantidad_Sal} {item.AbrevUnidMed}</Badge>
                                                            <span className="text-sm font-bold text-indigo-700">S/ {formatMoney(item.SumaDeVta_Tot)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center pt-2 mt-1 border-t border-indigo-100">
                                                    <span className="text-xs font-bold text-indigo-800 uppercase">Total Cliente</span>
                                                    <span className="text-sm font-black text-indigo-700">S/ {formatMoney(cli.TotalCliente)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-end border-t border-border pt-4">
                                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-right">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase">Total Vendedor</p>
                                            <p className="text-lg font-black text-indigo-900">S/ {formatMoney(detailData[0].TotalVendedor)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="hidden md:block overflow-x-auto bg-background border border-border rounded-lg shadow-sm">
                                        <table className="w-full text-xs text-left text-muted-foreground">
                                            <thead className="bg-muted border-b border-border">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold">Cód. Art</th>
                                                <th className="px-3 py-2 font-semibold">Descripción</th>
                                                <th className="px-3 py-2 font-semibold text-center">U.M.</th>
                                                <th className="px-3 py-2 font-semibold text-right">Cant. Total</th>
                                                <th className="px-3 py-2 font-semibold text-right">Total S/.</th>
                                                <th className="px-3 py-2 font-semibold text-right">Cuota cant.</th>
                                                <th className="px-3 py-2 font-semibold text-right">Cuota S/.</th>
                                                <th className="px-3 py-2 font-semibold text-center min-w-[150px]">% Cumpl.</th>
                                                <th className="px-3 py-2 font-semibold text-right">Restante</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                            {productosConCuota.map((prod, pIdx) => (
                                                <tr key={pIdx} className={cn("hover:bg-muted", prod.sinVentas && "bg-amber-50/40")}>
                                                    <td className="px-3 py-2 font-mono text-muted-foreground">{prod.Codigo_Art}</td>
                                                    <td className="px-3 py-2 text-foreground">
                                                        <span className={cn(prod.sinVentas && "text-muted-foreground")}>{prod.NombreItem}</span>
                                                        {prod.sinVentas && (
                                                            <Badge variant="outline" className="ml-2 text-[9px] bg-amber-50 text-amber-800 border-amber-300 border-dashed align-middle">
                                                                sin ventas
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-[10px] uppercase">{prod.AbrevUnidMed}</td>
                                                    <td className="px-3 py-2 text-right font-medium">{prod.TotalCantidad}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-foreground">{money(prod.TotalVentas)}</td>
                                                    <td className="px-3 py-2 text-right">{prod.cuotaCant > 0 ? prod.cuotaCant : "—"}</td>
                                                    <td className="px-3 py-2 text-right">{prod.cuotaSoles > 0 ? money(prod.cuotaSoles) : "—"}</td>
                                                    <td className="px-3 py-2"><CeldaCumplimiento pct={prod.pct} /></td>
                                                    <td className={cn(
                                                        "px-3 py-2 text-right font-medium tabular-nums",
                                                        prod.restante === null ? "text-muted-foreground"
                                                            : prod.restante === 0 ? "text-emerald-700" : "text-amber-700"
                                                    )}>
                                                        {prod.restante === null ? "—" : prod.restante}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                            <tfoot className="bg-emerald-50/50">
                                            <tr>
                                                <td colSpan={3} className="px-3 py-2 text-right text-emerald-800 text-xs font-bold uppercase tracking-wider">Totales:</td>
                                                <td className="px-3 py-2 text-right text-emerald-700 font-bold">{totalesProductos.cantidad}</td>
                                                <td className="px-3 py-2 text-right text-emerald-700 font-bold">{money(totalesProductos.ventas)}</td>
                                                <td className="px-3 py-2 text-right text-emerald-700 font-bold">{totalesProductos.cuotaCant > 0 ? totalesProductos.cuotaCant : "—"}</td>
                                                <td className="px-3 py-2 text-right text-emerald-700 font-bold">{totalesProductos.cuotaSoles > 0 ? money(totalesProductos.cuotaSoles) : "—"}</td>
                                                <td className="px-3 py-2"><CeldaCumplimiento pct={totalesProductos.pct} /></td>
                                                <td className={cn(
                                                    "px-3 py-2 text-right font-bold tabular-nums",
                                                    totalesProductos.restante === 0 ? "text-emerald-700" : "text-amber-700"
                                                )}>
                                                    {totalesProductos.restante}
                                                </td>
                                            </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <div className="md:hidden grid grid-cols-1 gap-2">
                                        {productosConCuota.map((prod, pIdx) => (
                                            <div key={pIdx} className={cn(
                                                "bg-background border border-border rounded-lg p-3 flex flex-col gap-1.5",
                                                prod.sinVentas && "bg-amber-50/40"
                                            )}>
                                                <p className={cn("text-xs font-semibold text-foreground", prod.sinVentas && "text-muted-foreground")}>
                                                    {prod.NombreItem}
                                                    {prod.sinVentas && (
                                                        <Badge variant="outline" className="ml-2 text-[9px] bg-amber-50 text-amber-800 border-amber-300 border-dashed align-middle">
                                                            sin ventas
                                                        </Badge>
                                                    )}
                                                </p>
                                                <p className="text-[10px] font-mono text-muted-foreground">{prod.Codigo_Art}</p>
                                                <div className="flex justify-between items-center border-t border-border pt-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] bg-muted">{prod.TotalCantidad} {prod.AbrevUnidMed}</Badge>
                                                    <span className="text-sm font-bold text-emerald-700">S/ {money(prod.TotalVentas)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-muted-foreground uppercase font-bold">Cuota</span>
                                                    <span className="text-foreground font-medium">
                                                        {prod.cuotaCant > 0 ? `${prod.cuotaCant} ${prod.AbrevUnidMed} · S/ ${money(prod.cuotaSoles)}` : "—"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-muted-foreground uppercase font-bold">Restante</span>
                                                    <span className={cn(
                                                        "font-medium tabular-nums",
                                                        prod.restante === null ? "text-muted-foreground"
                                                            : prod.restante === 0 ? "text-emerald-700" : "text-amber-700"
                                                    )}>
                                                        {prod.restante === null ? "—" : prod.restante}
                                                    </span>
                                                </div>
                                                <CeldaCumplimiento pct={prod.pct} compacta />
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                                            <span className="text-xs font-bold text-emerald-800 uppercase">Total Vendedor</span>
                                            <span className="text-sm font-black text-emerald-700">S/ {formatMoney(detailData[0].TotalVendedor)}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16">
                                <p className="text-muted-foreground font-medium">No se encontraron detalles para este vendedor.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}