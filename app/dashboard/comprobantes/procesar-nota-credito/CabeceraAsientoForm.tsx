'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import {
    AsientoCabecera, ComboAnioRow, ComboGlosaRow, ComboMesRow, ComboTipoAsientoRow, MonedaAsiento,
} from "@/app/types/procesar-nota-credito-types"
import { GlosaComboBox } from "./GlosaComboBox"

interface CabeceraAsientoFormProps {
    cabecera:      AsientoCabecera
    onChange:      (cabecera: AsientoCabecera) => void
    numeroVoucher: number
    onReiniciar:   () => void
    combosLoading: boolean
    combos: {
        glosas:       ComboGlosaRow[]
        tiposAsiento: ComboTipoAsientoRow[]
        meses:        ComboMesRow[]
        anios:        ComboAnioRow[]
    }
}

export function CabeceraAsientoForm({ cabecera, onChange, numeroVoucher, onReiniciar, combosLoading, combos }: CabeceraAsientoFormProps) {
    const set = <K extends keyof AsientoCabecera>(field: K, value: AsientoCabecera[K]) =>
        onChange({ ...cabecera, [field]: value })

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-baseline justify-between gap-3 pb-4">
                <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Registros</Badge>
                    <span className="text-base font-semibold">Aplicación de Nota de Crédito</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Nro Voucher <b className="font-mono text-foreground">{numeroVoucher}</b>
                    <Button variant="outline" size="sm" onClick={onReiniciar} className="gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reiniciar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-6">
                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">Fecha</Label>
                    <Input type="date" value={cabecera.fecha} onChange={e => set('fecha', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">Moneda</Label>
                    <Select value={cabecera.moneda} onValueChange={v => set('moneda', v as MonedaAsiento)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SOLES">SOLES</SelectItem>
                            <SelectItem value="DOLARES">DÓLARES</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">Mes registro</Label>
                    <Select value={cabecera.mesRegistro} onValueChange={v => set('mesRegistro', v)} disabled={combosLoading}>
                        <SelectTrigger><SelectValue placeholder={combosLoading ? "Cargando…" : "—"} /></SelectTrigger>
                        <SelectContent>
                            {combos.meses.map(m => (
                                <SelectItem key={m.Numero} value={String(m.Numero)}>{m.Mes}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">Año registro</Label>
                    <Select value={cabecera.anioRegistro} onValueChange={v => set('anioRegistro', v)} disabled={combosLoading}>
                        <SelectTrigger><SelectValue placeholder={combosLoading ? "Cargando…" : "—"} /></SelectTrigger>
                        <SelectContent>
                            {combos.anios.map(a => (
                                <SelectItem key={a.Anio} value={String(a.Anio)}>{a.Anio}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs uppercase text-muted-foreground">Tipo de asiento</Label>
                    <Select value={cabecera.tipoAsiento} onValueChange={v => set('tipoAsiento', v)} disabled={combosLoading}>
                        <SelectTrigger><SelectValue placeholder={combosLoading ? "Cargando…" : "—"} /></SelectTrigger>
                        <SelectContent>
                            {combos.tiposAsiento.map(t => (
                                <SelectItem key={t.Id_Doc_Registros} value={t.TipoRegistros}>{t.TipoRegistros}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-end gap-2 pb-2">
                    <Switch checked={cabecera.destino} onCheckedChange={v => set('destino', v)} id="destino" />
                    <Label htmlFor="destino" className="text-xs uppercase text-muted-foreground">Destino</Label>
                </div>

                <div className="col-span-2 space-y-1.5 md:col-span-6">
                    <Label className="text-xs uppercase text-muted-foreground">Glosa de registro</Label>
                    <GlosaComboBox
                        glosas={combos.glosas.map(g => g.Glosa)}
                        value={cabecera.glosa}
                        onChange={v => set('glosa', v)}
                        disabled={combosLoading}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
