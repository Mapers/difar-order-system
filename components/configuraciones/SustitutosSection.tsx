'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import {
    Search, Plus, Edit, Trash2, Eye, X, ArrowUp, ArrowDown, PackageSearch
} from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import apiClient from "@/app/api/client"
import { getProductsRequest } from "@/app/api/products"
import { useAuth } from "@/context/authContext"
import { toast } from "@/app/hooks/useToast"
import ProductSearchDialog from "@/components/tomar-pedido/product-step/ProductSearchDialog"

export interface IProduct {
    IdArticulo: number;
    Codigo_Art: string;
    NombreItem: string;
    Presentacion: string;
    PUContado: string | number;
    PUCredito: string | number;
    Laboratorio?: string;
    PrincipioActivo?: string;
    Stock: string | number;
    afecto_igv?: number;
    tipo_afectacion_igv?: string;
    Descripcion?: string;
}

interface GrupoSustituto {
    id: number;
    cod_principal: string;
    observacion: string;
    activo: boolean;
    fec_creacion: string;
    usu_creacion: string;
    sustitutos: {
        cod_sustituto: string;
        prioridad: number;
        NombreItem: string;
        Presentacion: string;
        PrincipioActivo: string;
        Laboratorio: string;
        Stock: number;
        PUContado: number;
        PUCredito: number;
    }[];
}

interface SustitutosSectionProps {
    onOpenModalChange: (fn: () => void) => void;
}

export default function SustitutosSection({ onOpenModalChange }: SustitutosSectionProps) {
    const { user } = useAuth();
    const [allProducts, setAllProducts] = useState<IProduct[]>([])
    const [grupos, setGrupos] = useState<GrupoSustituto[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingSave, setLoadingSave] = useState(false)
    const [activeTab, setActiveTab] = useState("ver")

    // Filtros
    const [searchQuery, setSearchQuery] = useState("")
    const [productSearchQuery, setProductSearchQuery] = useState("")

    // Formulario / Modales
    const [editingId, setEditingId] = useState<number | null>(null)
    const [selMain, setSelMain] = useState<IProduct | null>(null)
    const [selSubs, setSelSubs] = useState<IProduct[]>([])
    const [observacion, setObservacion] = useState("")
    const [isActivo, setIsActivo] = useState(true)

    const [isMainDialogOpen, setIsMainDialogOpen] = useState(false)
    const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)

    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [viewingGroup, setViewingGroup] = useState<GrupoSustituto | null>(null)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const defaultCurrency = { id: 1, value: 'PEN', label: 'Soles' }

    // Conectar el botón "Nuevo Registro" del padre para que abra la pestaña "Matricular"
    useEffect(() => {
        if (onOpenModalChange) {
            onOpenModalChange(() => {
                resetForm();
                setActiveTab("matricular");
            });
        }
    }, [onOpenModalChange]);

    const fetchAllProducts = async () => {
        try {
            const response = await getProductsRequest()
            const prods = response.data?.data?.data || []
            setAllProducts(prods.map((p: any) => ({
                ...p,
                Laboratorio: p.Descripcion,
                PrincipioActivo: p.principioActivo || p.PrincipioAdictivo || ''
            })))
        } catch (error) {
            console.error("Error fetching all products:", error)
        }
    }

    const fetchGrupos = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get('/sustitutos/listar/sustitutos')
            setGrupos(res.data.data || [])
        } catch (error) {
            console.error("Error fetching grupos:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllProducts()
        fetchGrupos()
    }, [])

    const getProdByCode = (code: string) => allProducts.find(p => p.Codigo_Art === code)

    const filteredGrupos = grupos.filter(g => {
        const pMain = getProdByCode(g.cod_principal)
        const matchQ = pMain?.NombreItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.cod_principal.toLowerCase().includes(searchQuery.toLowerCase())
        return matchQ
    })

    const filteredAllProducts = allProducts.filter(product =>
        product.NombreItem.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.Codigo_Art.toLowerCase().includes(productSearchQuery.toLowerCase())
    )

    const handleMoveSub = (index: number, direction: number) => {
        const newSubs = [...selSubs]
        const swapIndex = index + direction
        if (swapIndex >= 0 && swapIndex < newSubs.length) {
            [newSubs[index], newSubs[swapIndex]] = [newSubs[swapIndex], newSubs[index]]
            setSelSubs(newSubs)
        }
    }

    const handleRemoveSub = (index: number) => {
        setSelSubs(selSubs.filter((_, i) => i !== index))
    }

    const resetForm = () => {
        setSelMain(null)
        setSelSubs([])
        setObservacion("")
        setIsActivo(true)
        setEditingId(null)
        setProductSearchQuery("")
    }

    const handleStartEdit = (grupo: GrupoSustituto) => {
        const main = getProdByCode(grupo.cod_principal)
        if(main) setSelMain(main)

        const subsData = grupo.sustitutos
            .sort((a,b) => a.prioridad - b.prioridad)
            .map(s => getProdByCode(s.cod_sustituto))
            .filter((p): p is IProduct => p !== undefined)

        setSelSubs(subsData)
        setObservacion(grupo.observacion || "")
        setIsActivo(grupo.activo)
        setEditingId(grupo.id)
        setActiveTab("matricular")
    }

    const handleSaveGroup = async () => {
        if (!selMain || selSubs.length === 0) return

        setLoadingSave(true)
        const payload = {
            cod_principal: selMain.Codigo_Art,
            observacion,
            activo: isActivo,
            usu_creacion: user?.nombreCompleto || 'SISTEMA',
            sustitutos: selSubs.map((s, idx) => ({
                cod_sustituto: s.Codigo_Art,
                prioridad: idx + 1
            }))
        }

        try {
            if (editingId) {
                await apiClient.put(`/sustitutos/actualizar/sustitutos/${editingId}`, payload)
                toast({ title: "Éxito", description: "Grupo actualizado correctamente." })
            } else {
                await apiClient.post('/sustitutos/crear/sustitutos', payload)
                toast({ title: "Éxito", description: "Grupo matriculado correctamente." })
            }
            resetForm()
            fetchGrupos()
            setActiveTab("ver")
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Ocurrió un error al guardar",
                variant: "destructive"
            })
        } finally {
            setLoadingSave(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingId) return
        try {
            await apiClient.delete(`/sustitutos/eliminar/sustitutos/${deletingId}`)
            toast({ title: "Éxito", description: "Grupo eliminado." })
            fetchGrupos()
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el grupo.", variant: "destructive" })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if(v==='matricular') resetForm() }} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mb-4">
                    <TabsTrigger value="ver"><Eye className="h-4 w-4 mr-2"/> Visualizar Grupos</TabsTrigger>
                    <TabsTrigger value="matricular"><Plus className="h-4 w-4 mr-2"/> {editingId ? 'Editando' : 'Matricular'}</TabsTrigger>
                </TabsList>

                {/* ════════════ VISTA: VISUALIZAR ════════════ */}
                <TabsContent value="ver" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 bg-muted/50 p-4 rounded-lg border">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por código o nombre del principal..."
                                className="pl-9 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Mostrando {filteredGrupos.length} grupos registrados</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-12"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div></div>
                    ) : filteredGrupos.length === 0 ? (
                        <div className="text-center py-12 bg-muted rounded-xl border border-dashed">
                            <PackageSearch className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-foreground">Sin resultados</h3>
                            <p className="text-muted-foreground">No se encontraron grupos de sustitutos activos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                            {filteredGrupos.map((grupo) => {
                                const pMain = getProdByCode(grupo.cod_principal)
                                if (!pMain) return null

                                return (
                                    <Card key={grupo.id} className="border-border hover:shadow-md transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-bold text-indigo-600 text-sm">{pMain.Codigo_Art}</span>
                                                    <div className="text-[11px] font-medium text-muted-foreground mt-0.5 tracking-wider uppercase">{pMain.Laboratorio}</div>
                                                </div>
                                                <Badge variant={grupo.activo ? "default" : "secondary"} className={`ml-2 text-[10px] ${grupo.activo ? 'bg-green-100 text-green-700' : ''}`}>
                                                    {grupo.activo ? 'ACTIVO' : 'INACTIVO'}
                                                </Badge>
                                            </div>

                                            <h3 className="font-semibold text-card-foreground mt-3 leading-tight">{pMain.NombreItem}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">{pMain.PrincipioActivo}</p>
                                            <p className="text-xs font-medium text-muted-foreground mt-1 mb-3">Presentación: {pMain.Presentacion}</p>

                                            <div className="border-t border-border pt-3 mt-2">
                                                <div className="text-[11px] font-bold text-muted-foreground uppercase mb-2 tracking-wider">Sustitutos ({grupo.sustitutos.length})</div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {grupo.sustitutos.sort((a,b)=>a.prioridad - b.prioridad).map((sub, idx) => (
                                                        <Badge key={idx} variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-200 text-xs font-medium">
                                                            {idx + 1}. {sub.NombreItem}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-5">
                                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setViewingGroup(grupo); setIsViewModalOpen(true) }}>
                                                    <Eye className="h-3 w-3 mr-1" /> Ver
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleStartEdit(grupo)}>
                                                    <Edit className="h-3 w-3 mr-1" /> Editar
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2" onClick={() => setDeletingId(grupo.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ════════════ VISTA: MATRICULAR ════════════ */}
                <TabsContent value="matricular" className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Producto Principal (A sustituir)</Label>
                        <Button
                            type="button" variant="outline" onClick={() => setIsMainDialogOpen(true)}
                            className="w-full justify-start h-auto min-h-11 sm:min-h-12 px-3 py-2 text-left font-normal text-sm bg-muted border-border hover:bg-background hover:border-indigo-400 overflow-hidden max-w-full"
                        >
                            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            {selMain ? (
                                <div className="flex flex-col items-start overflow-hidden w-0 flex-1">
                                    <span className="font-semibold text-foreground truncate w-full leading-tight text-sm">
                                        {selMain.NombreItem}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate w-full leading-tight mt-0.5">
                                        {selMain.Codigo_Art} | {selMain.Laboratorio} | Stock: {selMain.Stock}
                                    </span>
                                </div>
                            ) : (
                                <span className="truncate text-muted-foreground font-normal text-xs sm:text-sm">
                                    Buscar producto principal...
                                </span>
                            )}
                        </Button>

                        <ProductSearchDialog
                            open={isMainDialogOpen} onOpenChange={setIsMainDialogOpen}
                            searchQuery={productSearchQuery} onSearchQueryChange={setProductSearchQuery}
                            filteredProducts={filteredAllProducts as any}
                            onProductSelect={(p: any) => {
                                setSelMain(p);
                                setIsMainDialogOpen(false);
                                setProductSearchQuery("");
                            }}
                            currency={defaultCurrency as any}
                        />
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                        <Label className="text-sm font-semibold flex items-center gap-2">Agregar Productos Sustitutos</Label>
                        <Button
                            type="button" variant="outline" onClick={() => setIsSubDialogOpen(true)}
                            className="w-full justify-start h-11 px-3 text-left font-normal text-sm bg-background border-dashed border-2 border-border hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-900 text-muted-foreground transition-colors"
                        >
                            <Plus className="mr-2 h-4 w-4 shrink-0" />
                            Buscar sustituto para agregar...
                        </Button>

                        <ProductSearchDialog
                            open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}
                            searchQuery={productSearchQuery} onSearchQueryChange={setProductSearchQuery}
                            filteredProducts={filteredAllProducts.filter(p => p.Codigo_Art !== selMain?.Codigo_Art && !selSubs.find(s => s.Codigo_Art === p.Codigo_Art)) as any}
                            onProductSelect={(p: any) => {
                                setSelSubs([...selSubs, p]);
                                setIsSubDialogOpen(false);
                                setProductSearchQuery("");
                            }}
                            currency={defaultCurrency as any}
                        />
                    </div>

                    <div className="space-y-3">
                        {selSubs.length === 0 ? (
                            <div className="text-center py-6 bg-muted border border-dashed rounded-lg text-sm text-muted-foreground">
                                No se han agregado sustitutos. El orden en la lista define la prioridad sugerida en mostrador.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selSubs.map((sub, idx) => (
                                    <div key={sub.Codigo_Art} className="flex items-center justify-between p-3 bg-background border rounded-lg hover:border-indigo-300 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="bg-indigo-100 text-indigo-700 font-bold h-8 w-8 rounded-full flex items-center justify-center text-xs shrink-0">
                                                #{idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm truncate">{sub.NombreItem}</div>
                                                <div className="text-xs text-muted-foreground flex gap-2">
                                                    <span>{sub.Codigo_Art}</span>
                                                    <span className="font-medium text-green-600">S/ {Number(sub.PUContado).toFixed(2)}</span>
                                                    <span className="font-medium text-amber-600">Stk: {sub.Stock}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={idx === 0} onClick={() => handleMoveSub(idx, -1)}>
                                                <ArrowUp className="h-4 w-4 text-muted-foreground"/>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={idx === selSubs.length - 1} onClick={() => handleMoveSub(idx, 1)}>
                                                <ArrowDown className="h-4 w-4 text-muted-foreground"/>
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveSub(idx)}>
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                        <div className="space-y-2">
                            <Label>Observaciones (Opcional)</Label>
                            <Textarea
                                placeholder="Ej: Mismo principio activo, diferente concentración..."
                                value={observacion}
                                onChange={(e) => setObservacion(e.target.value)}
                                className="h-20 resize-none"
                            />
                        </div>
                        <div className="space-y-4">
                            <Label>Estado del Grupo</Label>
                            <div className="flex items-center space-x-2">
                                <Switch checked={isActivo} onCheckedChange={setIsActivo} id="activo" />
                                <Label htmlFor="activo" className="font-normal cursor-pointer">Grupo Activo para dispensación</Label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => {resetForm(); setActiveTab("ver")}}>Cancelar</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveGroup} disabled={!selMain || selSubs.length === 0 || loadingSave}>
                            {loadingSave ? "Guardando..." : "Guardar Grupo"}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal Detalle */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Detalle del Grupo</DialogTitle>
                        <DialogDescription>Jerarquía de sustitución sugerida</DialogDescription>
                    </DialogHeader>
                    {viewingGroup && (() => {
                        const pMain = getProdByCode(viewingGroup.cod_principal)
                        return (
                            <div className="space-y-4">
                                <div className="bg-muted p-4 rounded-lg border">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                                            {pMain?.Laboratorio || 'SIN LAB'}
                                        </div>
                                        <Badge variant="outline" className={`text-[10px] ${viewingGroup.activo ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                            {viewingGroup.activo ? 'ACTIVO' : 'INACTIVO'}
                                        </Badge>
                                    </div>
                                    <div className="font-semibold text-lg text-indigo-700">
                                        {pMain?.NombreItem}
                                    </div>
                                    <div className="text-sm text-muted-foreground mb-2">
                                        {pMain?.PrincipioActivo}
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div>Presentación: <span className="font-semibold">{pMain?.Presentacion}</span></div>
                                        <Badge variant="secondary" className="bg-background border text-foreground">Stock: {pMain?.Stock}</Badge>
                                    </div>

                                    <div className="flex gap-6 mt-3 pt-3 border-t border-border">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground font-semibold mb-0.5 uppercase">P. Contado</div>
                                            <div className="font-mono font-medium text-foreground text-base">S/ {Number(pMain?.PUContado || 0).toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] text-muted-foreground font-semibold mb-0.5 uppercase">P. Crédito</div>
                                            <div className="font-mono font-medium text-foreground text-base">S/ {Number(pMain?.PUCredito || 0).toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Sustitutos por prioridad ({viewingGroup.sustitutos.length})</div>
                                    {viewingGroup.sustitutos.sort((a,b)=> a.prioridad - b.prioridad).map((sub) => (
                                        <div key={sub.cod_sustituto} className="p-3 border rounded-md bg-background">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Prioridad {sub.prioridad}</Badge>
                                                    <span className="font-medium text-sm text-foreground">{sub.NombreItem}</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-2 mt-1">
                                                {sub.Laboratorio} — {sub.PrincipioActivo}
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                                                <div>Pres: <span className="font-medium text-foreground">{sub.Presentacion}</span></div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-amber-600 font-semibold">Stk: {sub.Stock}</span>
                                                    <span>Con: <span className="font-mono font-medium text-foreground">S/ {Number(sub.PUContado).toFixed(2)}</span></span>
                                                    <span>Cré: <span className="font-mono font-medium text-foreground">S/ {Number(sub.PUCredito).toFixed(2)}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {viewingGroup.observacion && (
                                    <div className="text-sm text-amber-900 italic bg-amber-50 p-3 rounded border border-amber-100 mt-4">
                                        <span className="font-semibold not-italic text-amber-800 mr-1">Observación:</span> {viewingGroup.observacion}
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-6 pt-4 border-t">
                                    <span>Registrado por: <span className="font-semibold text-muted-foreground">{viewingGroup.usu_creacion}</span></span>
                                    <span>Fecha: <span className="font-semibold text-muted-foreground">{new Date(viewingGroup.fec_creacion).toLocaleDateString()}</span></span>
                                </div>
                            </div>
                        )
                    })()}
                </DialogContent>
            </Dialog>

            {/* Modal Eliminar */}
            <Dialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Eliminar Grupo de Sustitutos</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Sí, eliminar grupo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}