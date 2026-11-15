import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, PackagePlus, CheckCircle2, Search, X } from "lucide-react";
import apiClient from "@/app/api/client";
import { ProductosService } from "@/app/services/logistica/ProductosService";
import { CatalogosArticulos, FichaArticulo, GrupoCuenta, Opcion } from "@/app/types/datos-generales-types";
import { fichaArticuloVacia, ListasAbiertas } from "@/components/contabilidad/datos-generales/articulos/FichaArticuloDialog";
import { BuscarOsceDialog } from "@/components/contabilidad/datos-generales/articulos/BuscarOsceDialog";
import { AvisoAmbar, Campo, claseInput, Combo, errorPct, Seccion, textoError } from "@/components/contabilidad/datos-generales/comunes";

/**
 * Crear Producto = ficha completa del form Access [Bienes y Servicios 2] (Inventarios / Contabilidad › Datos Fijos ›
 * Datos Generales › BienesServicios) + precios base, escalas y bonificaciones.
 * Antes solo pedía código, nombre, línea, presentación, medida y principio activo; el resto lo dejaba fijo
 * (Unidad Frascos, Tipo de existencia Materias Primas…) o vacío.
 */
const FISCALIZADO_NO = "2";      // art_fiscaliz_conceptos: 1 SI, 2 NO (el valor que se grababa siempre)
const CTA_VENTAS_COMUN = "1827"; // 7010101 Ventas - Mercaderías: la que tiene la gran mayoría de artículos

const fichaInicial = (): FichaArticulo => ({ ...fichaArticuloVacia(), fiscalizado: FISCALIZADO_NO, ctaVentas: CTA_VENTAS_COMUN });
const listasVacias: ListasAbiertas = { medida: [], tipo: [], modelo: [], marca: [], otros1: [], otros2: [], control: [] };

const CUENTAS: { campo: keyof FichaArticulo; grupo: GrupoCuenta; label: string }[] = [
    { campo: "ctaCargoCosto", grupo: "cargoCosto", label: "Cuenta Contable Cargos" },
    { campo: "ctaAbonoCosto", grupo: "abonoCosto", label: "Cuenta Contable Abonos" },
    { campo: "ctaCostoVentas", grupo: "costoVentas", label: "CtaContab Costo Ventas" },
    { campo: "ctaExistencias", grupo: "existencias", label: "CtaContab Existencias" },
    { campo: "ctaProduccion", grupo: "produccion", label: "CtaContab Producción" },
    { campo: "ctaVentas", grupo: "ventas", label: "CtaContab Ventas" },
];

export const CreateProductModal = ({ laboratories, user, onProductCreated }: any) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aviso, setAviso] = useState("");
    const [exito, setExito] = useState("");
    /** Producto ya grabado en esta apertura: no se puede volver a guardar (evita "código ya existe" al reintentar). */
    const [creado, setCreado] = useState(false);

    const [f, setF] = useState<FichaArticulo>(fichaInicial());
    const set = (p: Partial<FichaArticulo>) => { setF((x) => ({ ...x, ...p })); setAviso(""); };
    const [prices, setPrices] = useState({ PUContado: "", PUCredito: "", PUPorMayor: "", PUPorMenor: "" });

    const [catalogos, setCatalogos] = useState<CatalogosArticulos | null>(null);
    const [listas, setListas] = useState<ListasAbiertas>(listasVacias);
    const [buscarOsce, setBuscarOsce] = useState(false);

    const [laboratorioFiltro, setLaboratorioFiltro] = useState("");
    const [lineas, setLineas] = useState<any[]>([]);
    const [cargandoLineas, setCargandoLineas] = useState(false);

    const [sugerencia, setSugerencia] = useState<any>(null);
    const [codigoEnUso, setCodigoEnUso] = useState<any>(null);
    const [verificando, setVerificando] = useState(false);

    const [escalas, setEscalas] = useState<any[]>([]);
    const [bonos, setBonos] = useState<any[]>([]);

    /** Combos de la ficha (una vez por apertura). */
    useEffect(() => {
        if (!open) return;
        let vigente = true;
        ProductosService.catalogos()
            .then((c) => { if (vigente) setCatalogos(c); })
            .catch(async (e) => { if (vigente) setAviso(await textoError(e, "No se pudieron cargar las listas de la ficha. Cierra y vuelve a abrir.")); });
        ProductosService.listas().then((l) => { if (vigente) setListas(l); }).catch(() => {});
        return () => { vigente = false; };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setCargandoLineas(true);
        apiClient.get('/price/lineas-lote', {
            params: laboratorioFiltro ? { laboratorio: laboratorioFiltro } : undefined,
        })
            .then(res => setLineas(res.data?.data?.data ?? []))
            .catch(() => setLineas([]))
            .finally(() => setCargandoLineas(false));
    }, [laboratorioFiltro, open]);

    useEffect(() => {
        if (!open || !f.subGrupo) { setSugerencia(null); return; }
        apiClient.get('/price/codigo-sugerido', { params: { idLote: f.subGrupo } })
            .then(res => {
                const d = res.data?.data ?? null;
                setSugerencia(d);
                if (d?.codigo_sugerido && !f.codigo) {
                    setF(prev => ({ ...prev, codigo: d.codigo_sugerido }));
                }
            })
            .catch(() => setSugerencia(null));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f.subGrupo, open]);

    /** Verifica contra la base que el codigo no exista ya. */
    useEffect(() => {
        const codigo = f.codigo.trim();
        if (!open || codigo.length < 4) { setCodigoEnUso(null); return; }

        setVerificando(true);
        const t = setTimeout(() => {
            apiClient.get('/price/codigo-existe', { params: { codigo } })
                .then(res => setCodigoEnUso(res.data?.data?.existe ? res.data.data : null))
                .catch(() => setCodigoEnUso(null))
                .finally(() => setVerificando(false));
        }, 400);
        return () => { clearTimeout(t); setVerificando(false); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [f.codigo, open]);

    const unidades = useMemo<Opcion[]>(() => (catalogos?.unidades ?? []).map((u) => ({ id: u.id, nombre: `${u.nombre}${u.abreviatura ? ` (${u.abreviatura})` : ''}` })), [catalogos]);

    const resetForm = () => {
        setF(fichaInicial());
        setLaboratorioFiltro("");
        setSugerencia(null);
        setCodigoEnUso(null);
        setPrices({ PUContado: "", PUCredito: "", PUPorMayor: "", PUPorMenor: "" });
        setEscalas([]);
        setBonos([]);
        setAviso("");
        setExito("");
        setCreado(false);
    };

    /** Al cerrar: si se creó algo, recién ahí se recarga la lista (antes se recargaba al instante y no se veía ningún mensaje). */
    const cerrar = (recienCreado = false) => {
        const recargar = recienCreado || creado;
        setOpen(false);
        resetForm();
        if (recargar && onProductCreated) onProductCreated();
    };

    const num = (v: unknown) => Number(String(v ?? "").trim().replace(",", "."));
    const esNum = (v: unknown) => String(v ?? "").trim() !== "" && Number.isFinite(num(v));
    /** Escalas y bonificaciones se revisan ANTES de crear el producto (antes una celda vacía fallaba con el producto ya creado). */
    const errorEscalasBonos = (): string => {
        const vistos = new Set<string>();
        for (const [i, e] of escalas.entries()) {
            const n = `Escala ${i + 1}`;
            if (!esNum(e.desde) || !esNum(e.hasta) || !esNum(e.precio)) return `${n}: completa mínimo, máximo y precio con números.`;
            if (num(e.desde) < 1 || !Number.isInteger(num(e.desde)) || !Number.isInteger(num(e.hasta))) return `${n}: mínimo y máximo deben ser cantidades enteras desde 1.`;
            if (num(e.hasta) < num(e.desde)) return `${n}: el máximo no puede ser menor que el mínimo.`;
            if (num(e.precio) <= 0) return `${n}: el precio debe ser mayor a 0.`;
            if (!/^\d+([.,]\d{1,2})?$/.test(String(e.precio).trim())) return `${n}: el precio admite hasta 2 decimales.`;
            const k = `${num(e.desde)}-${num(e.hasta)}`;
            if (vistos.has(k)) return `${n}: ya hay otra escala de ${num(e.desde)} a ${num(e.hasta)}.`;
            vistos.add(k);
        }
        for (const [i, b] of bonos.entries()) {
            const n = `Bonificación ${i + 1}`;
            if (!esNum(b.compra) || num(b.compra) <= 0 || !Number.isInteger(num(b.compra))) return `${n}: "Compra" debe ser una cantidad entera mayor a 0.`;
            if (!esNum(b.lleva) || num(b.lleva) <= 0 || !Number.isInteger(num(b.lleva))) return `${n}: "Lleva" debe ser una cantidad entera mayor a 0.`;
            if (!String(b.descripcion ?? "").trim()) return `${n}: escribe la descripción de la promoción.`;
            if (!b.esMismoProducto && (!String(b.productoBonificado ?? "").trim() || !String(b.descripcionProducto ?? "").trim())) return `${n}: indica código y nombre del producto de regalo.`;
        }
        return "";
    };

    const handleSave = async () => {
        setAviso(""); setExito("");
        const faltan = [
            !f.subGrupo && "Línea (SubGrupo)", !f.codigo.trim() && "Código", !f.nombre.trim() && "Descripción del ítem",
            !f.unidad && "Unidad de medida", !f.tipoExistencia && "Tipo de existencia",
        ].filter(Boolean);
        if (faltan.length) { setAviso(`Completa la información, luego guarda: ${faltan.join(", ")}.`); return; }
        if (!/^\d{1,9}$/.test(f.codigo.trim()) || Number(f.codigo) === 0) { setAviso("El código debe ser numérico, mayor a 0 y de hasta 9 dígitos."); return; }
        if (codigoEnUso) { setAviso(`El código ${f.codigo} ya lo usa "${codigoEnUso.nombreItem}". Elige otro.`); return; }
        for (const [k, v] of [["% Precio 1", f.precio1], ["% Precio 2", f.precio2], ["% Precio 3", f.precio3], ["% Precio 4", f.precio4]] as const) {
            const e = errorPct(k, v); if (e) { setAviso(e); return; }
        }
        const numeros: [string, string][] = [
            ["Equivalencia", f.equivalencia], ["Marca", f.marca],
            ["PU Contado", prices.PUContado], ["PU Crédito", prices.PUCredito], ["PU Por Mayor", prices.PUPorMayor], ["PU Por Menor", prices.PUPorMenor],
        ];
        for (const [k, v] of numeros) {
            if (v.trim() && !Number.isFinite(Number(v.replace(",", ".")))) { setAviso(`${k} debe ser un número.`); return; }
        }
        for (const [k, v] of numeros.slice(2)) {
            if (v.trim() && Number(v.replace(",", ".")) < 0) { setAviso(`${k} no puede ser negativo.`); return; }
            if (v.trim() && !/^\d+([.,]\d{1,2})?$/.test(v.trim())) { setAviso(`${k} admite hasta 2 decimales.`); return; }
        }
        const eb = errorEscalasBonos();
        if (eb) { setAviso(eb); return; }

        setLoading(true);
        try {
            const r = await ProductosService.crear(f, prices);
            const codigo = r.codigo || f.codigo.trim();
            setCreado(true);

            const extras = await Promise.allSettled([
                ...escalas.map(escala => apiClient.post('/articulos/scale/upsert', {
                    code: codigo, min: num(escala.desde), max: num(escala.hasta), price: num(escala.precio), user: user?.nombreCompleto
                })),
                ...bonos.map(bonus => apiClient.post('/articulos/bonus/upsert', {
                    code: codigo, description: String(bonus.descripcion).trim(), factor: num(bonus.compra), qty: num(bonus.lleva),
                    user: user?.nombreCompleto, sameProduct: bonus.esMismoProducto,
                    codProdBonus: bonus.esMismoProducto ? codigo : String(bonus.productoBonificado).trim(),
                    descProdBonus: bonus.esMismoProducto ? f.nombre : String(bonus.descripcionProducto).trim()
                })),
            ]);
            const fallaEscalas = extras.slice(0, escalas.length).filter(x => x.status === "rejected").length;
            const fallaBonos = extras.slice(escalas.length).filter(x => x.status === "rejected").length;

            // El producto YA existe: lo que falte se avisa en ámbar, sin cerrar, y no se puede volver a guardar.
            const pendientes: string[] = [];
            if (!r.preciosGuardados) pendientes.push('sus precios base (regístralos con "Editar precios")');
            if (fallaEscalas) pendientes.push(`${fallaEscalas} de ${escalas.length} escala(s)`);
            if (fallaBonos) pendientes.push(`${fallaBonos} de ${bonos.length} bonificación(es)`);
            if (pendientes.length) {
                setAviso(`El producto ${codigo} se creó, pero no se guardaron: ${pendientes.join("; ")}. Regístralos desde la lista de precios.`);
                return;
            }
            setExito(`Producto ${codigo} creado.`);
            setTimeout(() => cerrar(true), 1500);
        } catch (error) {
            setAviso(await textoError(error, "No se pudo crear el producto. Intenta nuevamente."));
        } finally {
            setLoading(false);
        }
    };

    const input = (campo: keyof FichaArticulo, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <input className={claseInput} value={String(f[campo] ?? "")} onChange={(e) => set({ [campo]: e.target.value } as Partial<FichaArticulo>)} {...props} />
    );
    /** Lista abierta de Access: se escribe libre o se elige un valor ya usado. */
    const abierta = (campo: keyof ListasAbiertas, max: number, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <Campo label={label}>
            {input(campo, { list: `cp-lista-${campo}`, maxLength: max, ...props })}
            <datalist id={`cp-lista-${campo}`}>{listas[campo].map((v) => <option key={v} value={v} />)}</datalist>
        </Campo>
    );
    const cuentaCombo = (c: (typeof CUENTAS)[number]) => (
        <Campo key={c.campo} label={c.label}>
            <Combo items={catalogos?.cuentas[c.grupo] ?? []} valor={String(f[c.campo] ?? "")} onCambio={(v) => set({ [c.campo]: v } as Partial<FichaArticulo>)} conCodigo vaciable />
        </Campo>
    );

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (isOpen) setOpen(true); else cerrar();
        }}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PackagePlus className="h-4 w-4" /> Crear Producto
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Crear Producto</DialogTitle>
                    <p className="text-xs text-muted-foreground">Los campos con (*) son obligatorios, como en Bienes y Servicios del sistema anterior.</p>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Seccion titulo="1. Ítem">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                            <Campo label="Laboratorio" className="sm:col-span-4">
                                <select className={claseInput}
                                        value={laboratorioFiltro}
                                        onChange={e => { setLaboratorioFiltro(e.target.value); set({ subGrupo: "" }); }}>
                                    <option value="">Todos</option>
                                    {laboratories?.map((l: any) => <option key={l.IdLineaGe} value={l.IdLineaGe}>{l.Descripcion}</option>)}
                                </select>
                            </Campo>
                            <Campo label="Línea (SubGrupo)" obligatorio className="sm:col-span-8">
                                <select className={claseInput} value={f.subGrupo} disabled={cargandoLineas} onChange={e => set({ subGrupo: e.target.value })}>
                                    <option value="">{cargandoLineas ? "Cargando..." : "Seleccionar..."}</option>
                                    {lineas.map((l: any) => (
                                        <option key={l.IdLote} value={l.IdLote}>
                                            {l.Descripcion}{!laboratorioFiltro && l.LaboratorioDescripcion ? ` · ${l.LaboratorioDescripcion}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </Campo>
                            <Campo label="Código Item" obligatorio className="sm:col-span-3">
                                {input("codigo", { maxLength: 9, inputMode: "numeric", className: `${claseInput} font-mono ${codigoEnUso ? 'border-amber-500' : ''}` })}
                                {!f.subGrupo && <p className="text-[11px] text-muted-foreground">Elige la línea y se sugiere el código.</p>}
                                {codigoEnUso ? (
                                    <p className="text-[11px] text-amber-700">Ya existe: {codigoEnUso.nombreItem}{codigoEnUso.linea ? ` (${codigoEnUso.linea})` : ''}</p>
                                ) : verificando ? (
                                    <p className="text-[11px] text-muted-foreground">Verificando…</p>
                                ) : f.codigo.trim().length >= 4 && (
                                    <p className="text-[11px] text-emerald-600">Código disponible</p>
                                )}
                                {/* El prefijo tiene que corresponder a la línea elegida: los 4 primeros dígitos la identifican. */}
                                {sugerencia?.prefijo && f.codigo.trim().length >= 4 && f.codigo.trim().slice(0, 4) !== sugerencia.prefijo && (
                                    <p className="text-[11px] text-amber-600">El prefijo de esta línea es {sugerencia.prefijo}.</p>
                                )}
                                {sugerencia?.codigo_sugerido && f.codigo !== sugerencia.codigo_sugerido && (
                                    <button type="button" className="text-[11px] text-blue-600 hover:underline" onClick={() => set({ codigo: sugerencia.codigo_sugerido })}>
                                        Usar {sugerencia.codigo_sugerido}
                                    </button>
                                )}
                                {sugerencia && !sugerencia.prefijo && (
                                    <p className="text-[11px] text-amber-600">Esta línea no tiene productos todavía: hay que escribir el código a mano.</p>
                                )}
                                {Number(sugerencia?.prefijos_distintos ?? 0) > 1 && (
                                    <p className="text-[11px] text-amber-600">Ojo: esta línea tiene códigos con {sugerencia.prefijos_distintos} prefijos distintos.</p>
                                )}
                            </Campo>
                            <Campo label="Descripción del Item" obligatorio className="sm:col-span-9">{input("nombre", { maxLength: 255 })}</Campo>
                            <Campo label="Unidad Medida" obligatorio className="sm:col-span-6"><Combo items={unidades} valor={f.unidad} onCambio={(v) => set({ unidad: v })} /></Campo>
                            <Campo label="Tipo Existencia" obligatorio className="sm:col-span-6"><Combo items={catalogos?.tiposExistencia} valor={f.tipoExistencia} onCambio={(v) => set({ tipoExistencia: v })} /></Campo>
                        </div>
                    </Seccion>

                    <Seccion titulo="2. Características del ítem">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                            {abierta("medida", 50, "Medida")}
                            {abierta("tipo", 255, "Tipo (presentación)")}
                            {abierta("modelo", 255, "Modelo (principio activo)")}
                            {abierta("marca", 11, "Marca", { inputMode: "numeric" })}
                            {abierta("otros1", 255, "Otros 1")}
                            {abierta("otros2", 255, "Otros 2")}
                        </div>
                    </Seccion>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Seccion titulo="3. Porcentajes para cálculo de precios">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
                                {(["precio1", "precio2", "precio3", "precio4"] as const).map((p, i) => (
                                    <Campo key={p} label={`% Precio ${i + 1} (%)`}>{input(p, { inputMode: "decimal", placeholder: "0", className: `${claseInput} text-right font-mono` })}</Campo>
                                ))}
                                <label className="col-span-2 flex h-9 cursor-pointer items-center gap-2 text-sm sm:col-span-1">
                                    <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={f.icbper} onChange={(e) => set({ icbper: e.target.checked })} /> ICBPER
                                </label>
                            </div>
                        </Seccion>
                        <Seccion titulo="4. Otras características del ítem">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <Campo label="Equivalencia">{input("equivalencia", { inputMode: "numeric", className: `${claseInput} text-right` })}</Campo>
                                <Campo label="Fiscalizado"><Combo items={catalogos?.fiscalizados} valor={f.fiscalizado} onCambio={(v) => set({ fiscalizado: v })} vaciable /></Campo>
                                <Campo label="Item Abreviado">{input("abreviado", { maxLength: 255 })}</Campo>
                                <Campo label="Código OSCE" className="col-span-2">
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => setBuscarOsce(true)} title={f.osceTexto || "Buscar código OSCE"}
                                                className={`${claseInput} flex min-w-0 items-center gap-2 text-left`}>
                                            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <span className={`truncate ${f.osceTexto ? "" : "text-muted-foreground"}`}>{f.osceTexto || "Buscar…"}</span>
                                        </button>
                                        {f.osce && <Button type="button" variant="ghost" size="icon" className="h-9 w-8 shrink-0" title="Quitar" onClick={() => set({ osce: "", osceTexto: "" })}><X className="h-4 w-4" /></Button>}
                                    </div>
                                </Campo>
                                {abierta("control", 255, "Control")}
                            </div>
                        </Seccion>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <Seccion titulo="5. Registro del uso o consumo">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">{CUENTAS.slice(0, 2).map(cuentaCombo)}</div>
                        </Seccion>
                        <Seccion titulo="6. Registro de costo de ventas" className="lg:col-span-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{CUENTAS.slice(2).map(cuentaCombo)}</div>
                        </Seccion>
                    </div>

                    <Seccion titulo="7. Precios base (S/)">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Campo label="PU Contado (S/)"><Input inputMode="decimal" placeholder="0.00" className="text-right font-mono" value={prices.PUContado} onChange={e => setPrices({ ...prices, PUContado: e.target.value })} /></Campo>
                            <Campo label="PU Crédito (S/)"><Input inputMode="decimal" placeholder="0.00" className="text-right font-mono" value={prices.PUCredito} onChange={e => setPrices({ ...prices, PUCredito: e.target.value })} /></Campo>
                            <Campo label="PU Por Mayor (S/)"><Input inputMode="decimal" placeholder="0.00" className="text-right font-mono" value={prices.PUPorMayor} onChange={e => setPrices({ ...prices, PUPorMayor: e.target.value })} /></Campo>
                            <Campo label="PU Por Menor (S/)"><Input inputMode="decimal" placeholder="0.00" className="text-right font-mono" value={prices.PUPorMenor} onChange={e => setPrices({ ...prices, PUPorMenor: e.target.value })} /></Campo>
                        </div>
                    </Seccion>

                    <section className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase">8. Escalas de Precio</h3>
                            <Button size="sm" variant="outline" onClick={() => setEscalas([...escalas, { desde: "", hasta: "", precio: "" }])}>
                                <Plus className="h-4 w-4 mr-1" /> Añadir Escala
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {escalas.map((esc, i) => (
                                <div key={i} className="flex gap-2 items-end">
                                    <div className="flex-1"><Label className="text-xs">Mínimo</Label><Input type="number" value={esc.desde} onChange={e => { const v = [...escalas]; v[i].desde = e.target.value; setEscalas(v); }}/></div>
                                    <div className="flex-1"><Label className="text-xs">Máximo</Label><Input type="number" value={esc.hasta} onChange={e => { const v = [...escalas]; v[i].hasta = e.target.value; setEscalas(v); }}/></div>
                                    <div className="flex-1"><Label className="text-xs">Precio Unit. (S/)</Label><Input type="number" value={esc.precio} onChange={e => { const v = [...escalas]; v[i].precio = e.target.value; setEscalas(v); }}/></div>
                                    <Button variant="outline" size="icon" title="Quitar escala" onClick={() => setEscalas(escalas.filter((_, idx) => idx !== i))}><Trash className="h-4 w-4"/></Button>
                                </div>
                            ))}
                            {escalas.length === 0 && <p className="text-xs text-muted-foreground">No hay escalas definidas.</p>}
                        </div>
                    </section>

                    <section className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase">9. Bonificaciones</h3>
                            <Button size="sm" variant="outline" onClick={() => setBonos([...bonos, { compra: "", lleva: "", descripcion: "", esMismoProducto: true, productoBonificado: "", descripcionProducto: "" }])}>
                                <Plus className="h-4 w-4 mr-1" /> Añadir Bonificación
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {bonos.map((bono, i) => (
                                <div key={i} className="p-3 bg-muted rounded-md border space-y-3 relative">
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" title="Quitar bonificación" onClick={() => setBonos(bonos.filter((_, idx) => idx !== i))}><Trash className="h-4 w-4"/></Button>

                                    <div className="grid grid-cols-2 gap-4 pr-8">
                                        <div className="space-y-1"><Label className="text-xs">Compra (Factor)</Label><Input type="number" value={bono.compra} onChange={e => { const v = [...bonos]; v[i].compra = e.target.value; setBonos(v); }}/></div>
                                        <div className="space-y-1"><Label className="text-xs">Lleva (Cantidad)</Label><Input type="number" value={bono.lleva} onChange={e => { const v = [...bonos]; v[i].lleva = e.target.value; setBonos(v); }}/></div>
                                    </div>

                                    <div className="space-y-1"><Label className="text-xs">Descripción de Promo</Label><Input placeholder="Ej. Por 10 Cajas lleva 2 gratis" value={bono.descripcion} onChange={e => { const v = [...bonos]; v[i].descripcion = e.target.value; setBonos(v); }}/></div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <input type="checkbox" checked={bono.esMismoProducto} onChange={(e) => { const v = [...bonos]; v[i].esMismoProducto = e.target.checked; setBonos(v); }} className="h-4 w-4 rounded border-border" />
                                        <Label className="text-sm">Bonifica el mismo producto</Label>
                                    </div>

                                    {!bono.esMismoProducto && (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="space-y-1"><Label className="text-xs">Código Prod. Regalo</Label><Input value={bono.productoBonificado} onChange={e => { const v = [...bonos]; v[i].productoBonificado = e.target.value; setBonos(v); }}/></div>
                                            <div className="space-y-1"><Label className="text-xs">Nombre Prod. Regalo</Label><Input value={bono.descripcionProducto} onChange={e => { const v = [...bonos]; v[i].descripcionProducto = e.target.value; setBonos(v); }}/></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {bonos.length === 0 && <p className="text-xs text-muted-foreground">No hay bonificaciones definidas.</p>}
                        </div>
                    </section>
                </div>

                <AvisoAmbar mensaje={aviso} onCerrar={() => setAviso("")} />
                {exito && (
                    <div className="p-4 rounded-md flex items-center gap-3 bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="h-5 w-5" />
                        <p className="text-sm font-medium">{exito}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                    <Button variant="outline" onClick={() => cerrar()} disabled={loading}>{creado ? "Cerrar" : "Cancelar"}</Button>
                    {!creado && <Button onClick={handleSave} disabled={loading}>{loading ? "Guardando..." : "Guardar Producto"}</Button>}
                </div>
            </DialogContent>

            <BuscarOsceDialog abierto={buscarOsce} textoInicial={f.nombre.split(" ")[0]} buscarCodigos={ProductosService.osceBuscar}
                              onCerrar={() => setBuscarOsce(false)}
                              onElegir={(c) => { set({ osce: String(c.id), osceTexto: `${c.codigo} ${c.descripcion}` }); setBuscarOsce(false); }} />
        </Dialog>
    );
};
