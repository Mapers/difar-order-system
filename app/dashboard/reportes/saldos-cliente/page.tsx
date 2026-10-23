'use client'

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, Search, User, X, Calendar as CalendarIcon, MapPin, Users, Phone, Mail, Store, CreditCard, Ban } from "lucide-react"
import { toast } from "@/app/hooks/useToast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/authContext"
import { fetchAvailableZones } from "@/app/api/reports"
import { BuscadorClienteReporte, ClienteBusqueda } from "@/components/reporte/BuscadorClienteReporte"
import apiClient from "@/app/api/client"
import { ClientService } from "@/app/services/client/ClientService"

import { ExportSaldoCobrarPdf } from "@/components/reporte/exportSaldoCobrarPdf"
import { agruparPorVendedor, esSoles } from "./agrupar"
import { DocumentoPdfLink } from "@/components/reporte/DocumentoPdfLink"
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** Datos de contacto y crédito de un cliente, sacados del listado de clientes. */
interface DatosCliente {
    correo:          string;
    lineaCredito:    number;
    telefono:        string;
    nombreComercial: string;
}

const fmtSoles = (v: number) =>
    `S/ ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function SaldoCobrarClientePage() {
    const auth = useAuth();
    const isManagerOrAdmin = auth.isAdmin();
    const isRepresentative = auth.isRepresentante();
    const isVendor = auth.isVendedor();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    // El reporte no trae correo ni línea de crédito: se completan con el
    // listado de clientes (el mismo de la pantalla Clientes), cruzando por
    // RUC. Se carga una sola vez, la primera vez que se busca.
    const datosClientesRef = useRef<Map<string, DatosCliente> | null>(null);
    const vistaTablaClientes = useMemo(() => {
        const config = auth.globalConfigs.find(c => c.cod_config === 'VISTA_TABLA_CLIENTES');
        return config ? config.llave_config : '1';
    }, [auth.globalConfigs]);

    const cargarDatosClientes = async (): Promise<Map<string, DatosCliente>> => {
        if (datosClientesRef.current) return datosClientesRef.current;
        const mapa = new Map<string, DatosCliente>();
        try {
            const res = await ClientService.getAllClientsByCodVendedor(
                isVendor ? auth.user?.codigo ?? '' : '',
                vistaTablaClientes,
                isRepresentative ? auth.user?.codRepres ?? '' : '',
            );
            for (const c of (res?.data || [])) {
                const ruc = String(c.numeroDocumento || c.documento_numero || '').trim();
                if (!ruc) continue;
                mapa.set(ruc, {
                    correo:          String(c.correoElectronico || '').trim(),
                    lineaCredito:    Number(c.lineaCredito) || 0,
                    telefono:        String(c.telefono || '').trim(),
                    nombreComercial: String(c.nombreComercial || c.cliente_comercial || '').trim(),
                });
            }
            datosClientesRef.current = mapa;
        } catch (error) {
            // Sin el listado el reporte igual sale; solo faltan correo y línea.
            console.warn('No se pudo cargar el listado de clientes para completar el reporte:', error);
        }
        return mapa;
    };
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    type SearchMode = 'fecha' | 'mes'
    const [searchMode, setSearchMode] = useState<SearchMode>('fecha')
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const currentYear = new Date().getFullYear()
    const YEARS = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

    const [selectedClientRuc, setSelectedClientRuc] = useState<string>("");
    const [selectedClientName, setSelectedClientName] = useState<string>("");
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [selectedSeller, setSelectedSeller] = useState<string>("");

    const [clienteSel, setClienteSel] = useState<ClienteBusqueda | null>(null);

    const [zones, setZones] = useState<any[]>([]);
    const [sellers, setSellers] = useState<any[]>([]);
    const [openZone, setOpenZone] = useState(false);
    const [openSeller, setOpenSeller] = useState(false);

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const resZones = await fetchAvailableZones();
                setZones(resZones.data?.data || []);
                if (isManagerOrAdmin) {
                    const resSellers = await apiClient.get('/usuarios/listar/vendedores');
                    const vendedoresTransformados = resSellers.data.data.data.map((v: any) => ({
                        idVendedor: String(v.idVendedor),
                        codigo: v.Codigo_Vend,
                        nombres: v.Nombres,
                        apellidos: v.Apellidos
                    }));
                    setSellers(vendedoresTransformados);
                } else if (isRepresentative) {
                    const repVends = auth.user?.vendedores?.map(v => ({
                        idVendedor: String(v.idVendedor),
                        codigo: v.codigo,
                        nombres: v.Nombres,
                        apellidos: ''
                    })) || [];
                    setSellers(repVends);
                } else if (isVendor) {
                    if (auth.user?.codigo) setSelectedSeller(auth.user.codigo);
                }
            } catch (error) {
                console.error("Error cargando catálogos", error);
            }
        };
        loadCatalogs();
    }, [isManagerOrAdmin, auth.user]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const body: Record<string, any> = {
                doc_cliente: selectedClientRuc || null,
                idZona: selectedZone || null,
                codVendedor: selectedSeller || null
            };
            if (searchMode === 'fecha') {
                body.fecha = format(selectedDate, 'yyyy-MM-dd');
            } else {
                body.mes = selectedMonth;
                body.anio = selectedYear;
            }

            const [response, datosClientes] = await Promise.all([
                apiClient.post('/reportes/saldo-por-cobrar-cliente', body),
                cargarDatosClientes(),
            ]);

            let reportData = response.data?.data;

            if (reportData && reportData.Clientes) {
                let allowedVendors: string[] = [];

                if (isRepresentative && !selectedSeller) {
                    allowedVendors = auth.user?.vendedores?.map(v => v.codigo) || [];
                    if (allowedVendors.length === 0) allowedVendors = ['SIN_VENDEDORES'];
                } else if (isVendor && !selectedSeller) {
                    allowedVendors = auth.user?.codigo ? [auth.user.codigo] : [];
                } else if (selectedSeller) {
                    allowedVendors = [selectedSeller];
                }

                if (allowedVendors.length > 0) {
                    let newTotalSoles = 0;
                    let newTotalDolares = 0;

                    const filteredClientes = reportData.Clientes.map((cli: any) => {
                        const filteredVends = cli.vendedores.filter((v: any) => {
                            const codigoVendedor = v.CodigoVend || v.Vendedor.split(' ')[0];
                            return allowedVendors.includes(codigoVendedor);
                        });
                        return { ...cli, vendedores: filteredVends };
                    }).filter((cli: any) => cli.vendedores.length > 0);

                    filteredClientes.forEach((cli: any) => {
                        cli.vendedores.forEach((v: any) => {
                            v.documentos.forEach((doc: any) => {
                                if (doc.Tipo_Moneda === 'NSO' || doc.Moneda === 'S/.') {
                                    newTotalSoles += Number(doc.Saldo) || 0;
                                } else {
                                    newTotalDolares += Number(doc.Saldo) || 0;
                                }
                            });
                        });
                    });

                    reportData = {
                        ...reportData,
                        Clientes: filteredClientes,
                        TotalSoles: newTotalSoles,
                        TotalDolares: newTotalDolares
                    };
                }
            }

            if (reportData && reportData.Clientes && reportData.Clientes.length > 0) {
                // Lo que mande el reporte tiene prioridad; lo que falte se
                // completa con el listado de clientes.
                reportData = {
                    ...reportData,
                    Clientes: reportData.Clientes.map((cli: any) => {
                        const extra = datosClientes.get(String(cli.RUC ?? '').trim());
                        return {
                            ...cli,
                            NombreComercial: cli.NombreComercial || extra?.nombreComercial || '',
                            Telefono:        cli.Telefono || extra?.telefono || '',
                            Correo:          cli.Correo || cli.Email || extra?.correo || '',
                            LineaCredito:    cli.LineaCredito ?? extra?.lineaCredito ?? null,
                        };
                    }),
                };
                setData(reportData);
            } else {
                setData(null);
                toast({ description: "No se encontraron saldos con los filtros indicados." });
            }
        } catch (error) {
            console.error("Error buscando el reporte:", error);
            toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // El reporte viene por cliente; en pantalla (y en el PDF) se muestra por
    // vendedor -> zona -> cliente.
    const grupos = useMemo(() => agruparPorVendedor(data), [data]);

    // Zonas abiertas del acordeón. Al buscar empiezan cerradas para ver el
    // resumen por zona; si un vendedor tiene una sola zona, se abre.
    const [zonasAbiertas, setZonasAbiertas] = useState<Set<string>>(new Set());
    useEffect(() => {
        const abiertas = new Set<string>();
        grupos.forEach(v => { if (v.zonas.length === 1) abiertas.add(`${v.clave}|${v.zonas[0].nombre}`); });
        setZonasAbiertas(abiertas);
    }, [grupos]);

    const cambiarZonas = (claves: string[], abrir: boolean) => {
        setZonasAbiertas(prev => {
            const n = new Set(prev);
            claves.forEach(k => abrir ? n.add(k) : n.delete(k));
            return n;
        });
    };

    const iniciales = (nombre: string) =>
        nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

    const formatMoney = (amount: number) => amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '-';
        try {
            const [y, m, d] = dateString.split('T')[0].split('-');
            if (y && m && d) return `${d}/${m}/${y}`;
            return dateString;
        } catch { return dateString; }
    };


    const renderCliente = (cliente: any, soles: number, dolares: number) => (
        <div className="grid grid-cols-1 items-center gap-3 border-b border-border bg-muted/40 px-3.5 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]">
            <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-foreground">{cliente.Cliente}</h3>
                <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        <span className="mr-1 font-semibold text-foreground">RUC</span>{cliente.RUC}
                    </span>
                    {cliente.NombreComercial && (
                        <span className="inline-flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            <Store className="h-3 w-3" /> {cliente.NombreComercial}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" />{cliente.Direccion || 'Sin dirección'}</span>
                <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 shrink-0" />{cliente.Telefono || 'Sin teléfono'}</span>
                <span className="inline-flex min-w-0 items-center gap-1 break-all"><Mail className="h-3.5 w-3.5 shrink-0" />{cliente.Correo || 'Sin correo'}</span>
                {cliente.LineaCredito == null ? null : Number(cliente.LineaCredito) > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                        <CreditCard className="h-3 w-3" /> Línea {fmtSoles(Number(cliente.LineaCredito))}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        <Ban className="h-3 w-3" /> Sin línea de crédito
                    </span>
                )}
            </div>
            <div className="flex items-baseline justify-between gap-3 md:block md:text-right">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo cliente</p>
                <p className="text-sm font-extrabold text-blue-700 dark:text-blue-400">
                    S/ {formatMoney(soles)}
                    {dolares > 0 && <span className="ml-2 text-green-700 dark:text-green-400">US$ {formatMoney(dolares)}</span>}
                </p>
            </div>
        </div>
    );

    const renderDocumentos = (documentos: any[]) => (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left text-muted-foreground">
                    <thead className="text-[10px] text-muted-foreground uppercase border-b border-border">
                    <tr>
                        <th className="px-3 py-2 font-bold whitespace-nowrap">Emisión</th>
                        <th className="px-3 py-2 font-bold whitespace-nowrap">Vencimiento</th>
                        <th className="px-3 py-2 font-bold whitespace-nowrap">Documento</th>
                        <th className="px-3 py-2 font-bold whitespace-nowrap">Nro Doc</th>
                        <th className="px-3 py-2 font-bold text-center">M</th>
                        <th className="px-3 py-2 font-bold text-right">Provisión</th>
                        <th className="px-3 py-2 font-bold text-right">Amortización</th>
                        <th className="px-3 py-2 font-bold text-right text-blue-700">Saldo S/.</th>
                        <th className="px-3 py-2 font-bold text-right text-green-700">Saldo US$</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                    {documentos.map((doc: any, dIdx: number) => {
                        const isSoles = esSoles(doc);
                        return (
                            <tr key={dIdx} className="hover:bg-muted transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap">{formatDateToDDMMYYYY(doc.Fecha_Emision)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-red-600 font-medium">{formatDateToDDMMYYYY(doc.Fecha_Vcto)}</td>
                                <td className="px-3 py-2 font-medium">{doc.TipoDocumento}</td>
                                <td className="px-3 py-2 font-mono font-semibold">
                                    <DocumentoPdfLink numeroComprobante={doc.SerieDoc && doc.NumeroDoc ? `${doc.SerieDoc}-${doc.NumeroDoc}` : null} existeComprobante={!!doc.existeComprobante} />
                                </td>
                                <td className="px-3 py-2 text-center font-bold">{doc.Moneda}</td>
                                <td className="px-3 py-2 text-right">{formatMoney(doc.SumaProvision)}</td>
                                <td className="px-3 py-2 text-right">{formatMoney(doc.SumaAmortizacion)}</td>
                                <td className="px-3 py-2 text-right font-bold text-blue-700">
                                    {isSoles ? formatMoney(doc.Saldo) : '-'}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-green-700">
                                    {!isSoles ? formatMoney(doc.Saldo) : '-'}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-2 p-2.5 md:hidden">
                {documentos.map((doc: any, dIdx: number) => {
                    const isSoles = esSoles(doc);
                    return (
                        <div key={dIdx} className="rounded-lg border border-border bg-muted/30 p-3 flex flex-col gap-2.5">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{doc.TipoDocumento}</span>
                                    <p className="font-mono font-bold text-sm text-foreground">
                                        <DocumentoPdfLink numeroComprobante={doc.SerieDoc && doc.NumeroDoc ? `${doc.SerieDoc}-${doc.NumeroDoc}` : null} existeComprobante={!!doc.existeComprobante} />
                                    </p>
                                </div>
                                <Badge variant="outline" className="font-bold">{doc.Moneda}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div><span className="text-muted-foreground">Emisión:</span><p className="font-medium text-foreground">{formatDateToDDMMYYYY(doc.Fecha_Emision)}</p></div>
                                <div><span className="text-muted-foreground">Vcto:</span><p className="font-medium text-red-600">{formatDateToDDMMYYYY(doc.Fecha_Vcto)}</p></div>
                                <div><span className="text-muted-foreground">Prov:</span><p className="font-medium">{formatMoney(doc.SumaProvision)}</p></div>
                                <div><span className="text-muted-foreground">Amort:</span><p className="font-medium">{formatMoney(doc.SumaAmortizacion)}</p></div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-border">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Saldo</span>
                                <span className={cn("text-base font-bold", isSoles ? "text-blue-700" : "text-green-700")}>
                                    {doc.Moneda} {formatMoney(doc.Saldo)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );

    return (
        <div className="grid grid-cols-1 gap-6 p-4 md:p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Saldo de Documentos por Cobrar</h1>
                <p className="text-sm md:text-base text-muted-foreground">Consulta los saldos pendientes agrupados por vendedor y zona.</p>
            </div>

            <Card className="shadow-md">
                <CardHeader className="bg-muted border-b border-border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

                        <div className="flex flex-col gap-1 md:col-span-4 relative">
                            <div className="flex items-center gap-1.5 mb-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <Label>Cliente (Opcional)</Label>
                            </div>
                            <BuscadorClienteReporte
                                valor={clienteSel}
                                descripcion="Opcional · por RUC, nombre o nombre comercial"
                                onChange={c => {
                                    setClienteSel(c);
                                    setSelectedClientRuc(c?.RUC ?? "");
                                    setSelectedClientName(c?.Nombre ?? "");
                                }}
                            />
                        </div>

                        <div className={`flex flex-col gap-1 ${isManagerOrAdmin ? 'md:col-span-2' : 'md:col-span-3'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <Label>Zonas (Opcional)</Label>
                            </div>
                            <Popover open={openZone} onOpenChange={setOpenZone}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="justify-between w-full h-10 font-normal bg-background">
                                        <span className="truncate">
                                            {selectedZone ? zones.find(z => z.IdZona === selectedZone)?.NombreZona : "Todas las zonas..."}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Buscar zona..." />
                                        <CommandList>
                                            <CommandEmpty>No se encontraron zonas.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem onSelect={() => { setSelectedZone(""); setOpenZone(false); }}>
                                                    <Check className={cn("mr-2 h-4 w-4", selectedZone === "" ? "opacity-100" : "opacity-0")} />
                                                    Todas las zonas...
                                                </CommandItem>
                                                {zones.map((z) => (
                                                    <CommandItem key={z.IdZona} onSelect={() => { setSelectedZone(z.IdZona); setOpenZone(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedZone === z.IdZona ? "opacity-100" : "opacity-0")} />
                                                        {z.NombreZona}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {isManagerOrAdmin && (
                            <div className="flex flex-col gap-1 md:col-span-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <Label>Vendedor (Opcional)</Label>
                                </div>
                                <Popover open={openSeller} onOpenChange={setOpenSeller}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="justify-between w-full h-10 font-normal bg-background">
                                            <span className="truncate">
                                                {selectedSeller ? sellers.find(s => s.codigo === selectedSeller)?.nombres : "Todos los vendedores..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Buscar vendedor..." />
                                            <CommandList>
                                                <CommandEmpty>No se encontraron vendedores.</CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => { setSelectedSeller(""); setOpenSeller(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedSeller === "" ? "opacity-100" : "opacity-0")} />
                                                        Todos los vendedores...
                                                    </CommandItem>
                                                    {sellers.map((s) => (
                                                        <CommandItem key={s.codigo} onSelect={() => { setSelectedSeller(s.codigo); setOpenSeller(false); }}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedSeller === s.codigo ? "opacity-100" : "opacity-0")} />
                                                            {s.nombres} {s.apellidos}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        <div className={`flex flex-col gap-1 ${isManagerOrAdmin ? 'md:col-span-3' : 'md:col-span-5'}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                    <Label>{searchMode === 'fecha' ? 'Fecha Corte' : 'Mes / Año'}</Label>
                                </div>
                                <div className="flex rounded-md overflow-hidden border border-border text-xs">
                                    <button
                                        type="button"
                                        className={`px-2 py-0.5 transition-colors ${searchMode === 'fecha' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                        onClick={() => setSearchMode('fecha')}
                                    >Corte</button>
                                    <button
                                        type="button"
                                        className={`px-2 py-0.5 transition-colors border-l border-border ${searchMode === 'mes' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                        onClick={() => setSearchMode('mes')}
                                    >Mes</button>
                                </div>
                            </div>
                            {searchMode === 'fecha' ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal bg-background h-10", !selectedDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                            {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : <span>Seleccionar</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 z-50" align="start">
                                        <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus locale={es} />
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <div className="flex gap-2">
                                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                                        <SelectTrigger className="h-10 bg-background flex-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((name, i) => (
                                                <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                                        <SelectTrigger className="h-10 bg-background w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {YEARS.map(y => (
                                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:col-span-12 md:justify-end mt-2">
                            <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-sm h-10">
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                            <ExportSaldoCobrarPdf
                                data={data}
                                dateCorte={searchMode === 'fecha' ? selectedDate : undefined}
                                mes={searchMode === 'mes' ? selectedMonth : undefined}
                                anio={searchMode === 'mes' ? selectedYear : undefined}
                                disabled={loading || !data}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6 bg-muted">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-muted-foreground font-medium">Buscando documentos, por favor espera...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">

                            {grupos.map(vend => {
                                const claves = vend.zonas.map(z => `${vend.clave}|${z.nombre}`)
                                return (
                                    <div key={vend.clave} className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                                        {/* Cabecera del vendedor */}
                                        <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3.5 text-white sm:px-5">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-extrabold">
                                                {iniciales(vend.nombre)}
                                            </div>
                                            <div className="min-w-0 flex-1 basis-48">
                                                <p className="line-clamp-2 text-base font-extrabold leading-tight sm:text-lg">{vend.nombre}</p>
                                                <p className="text-xs text-slate-300">
                                                    {vend.codigo ? `Vendedor ${vend.codigo} · ` : ''}
                                                    {vend.zonas.length} zona{vend.zonas.length !== 1 ? 's' : ''} · {vend.nClientes} cliente{vend.nClientes !== 1 ? 's' : ''} · {vend.nDocumentos} documento{vend.nDocumentos !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                                                {vend.zonas.length > 1 && (
                                                    <div className="flex gap-1.5">
                                                        <button type="button" onClick={() => cambiarZonas(claves, true)}
                                                                className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs text-slate-100 hover:bg-white/20">
                                                            <ChevronsUpDown className="h-3.5 w-3.5" /> Abrir todas
                                                        </button>
                                                        <button type="button" onClick={() => cambiarZonas(claves, false)}
                                                                className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs text-slate-100 hover:bg-white/20">
                                                            <ChevronsDownUp className="h-3.5 w-3.5" /> Cerrar todas
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="ml-auto flex gap-2">
                                                    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-right">
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Saldo S/</p>
                                                        <p className="text-sm font-bold sm:text-base">S/ {formatMoney(vend.soles)}</p>
                                                    </div>
                                                    <div className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-right">
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Saldo US$</p>
                                                        <p className="text-sm font-bold sm:text-base">US$ {formatMoney(vend.dolares)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Zonas en acordeón */}
                                        <div className="space-y-3 p-3 sm:p-4">
                                            {vend.zonas.map(zona => {
                                                const clave = `${vend.clave}|${zona.nombre}`
                                                const abierta = zonasAbiertas.has(clave)
                                                return (
                                                    <div key={clave}>
                                                        <button
                                                            type="button"
                                                            onClick={() => cambiarZonas([clave], !abierta)}
                                                            aria-expanded={abierta}
                                                            className={cn(
                                                                "flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                                                                abierta
                                                                    ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
                                                                    : "border-border bg-background text-foreground hover:bg-muted/60",
                                                            )}
                                                        >
                                                            <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", !abierta && "-rotate-90")} />
                                                            <MapPin className="h-4 w-4 shrink-0" />
                                                            <span className="font-bold">{zona.nombre}</span>
                                                            <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                                                                {zona.clientes.length} cliente{zona.clientes.length !== 1 ? 's' : ''}
                                                            </span>
                                                            {!abierta && (
                                                                <span className="hidden text-[11px] text-muted-foreground sm:inline">Clic para ver sus clientes</span>
                                                            )}
                                                            <span className="ml-auto text-right text-sm font-extrabold">
                                                                S/ {formatMoney(zona.soles)}
                                                                {zona.dolares > 0 && <span className="ml-2 text-green-700 dark:text-green-400">US$ {formatMoney(zona.dolares)}</span>}
                                                            </span>
                                                        </button>

                                                        {abierta && (
                                                            <div className="mt-2.5 space-y-3 border-l-[3px] border-blue-200 pl-2.5 sm:ml-2 sm:pl-4 dark:border-blue-900">
                                                                {zona.clientes.map((cl, cIdx) => (
                                                                    <div key={`${cl.cliente.RUC}-${cIdx}`} className="overflow-hidden rounded-lg border border-border bg-background">
                                                                        {renderCliente(cl.cliente, cl.soles, cl.dolares)}
                                                                        {renderDocumentos(cl.documentos)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}

                            <div className="bg-background border border-blue-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center shadow-md mt-6 sticky bottom-4">
                                <span className="text-sm font-bold uppercase tracking-wider text-foreground mb-2 sm:mb-0">Deuda Total Global</span>
                                <div className="flex gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                    <div className="text-center sm:text-right bg-blue-50 p-2 rounded-md sm:bg-transparent sm:p-0 flex-1 sm:flex-none border border-blue-100 sm:border-none">
                                        <p className="text-xs text-blue-600 font-semibold uppercase">Total Soles</p>
                                        <p className="text-lg sm:text-xl font-bold text-blue-800">S/ {formatMoney(data.TotalSoles)}</p>
                                    </div>
                                    <div className="text-center sm:text-right bg-green-50 p-2 rounded-md sm:bg-transparent sm:p-0 flex-1 sm:flex-none border border-green-100 sm:border-none">
                                        <p className="text-xs text-green-600 font-semibold uppercase">Total Dólares</p>
                                        <p className="text-lg sm:text-xl font-bold text-green-800">US$ {formatMoney(data.TotalDolares)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-background rounded-lg border-2 border-dashed border-border">
                            <p className="text-muted-foreground font-medium text-center px-4">
                                Utiliza los filtros para buscar el saldo por cobrar.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
