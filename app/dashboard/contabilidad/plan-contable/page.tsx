'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { BookPlus, FileStack, Link2, ListChecks, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaginaInformes } from '@/components/contabilidad/informes/PaginaInformes'
import { PESTANAS_PLAN } from '@/components/contabilidad/informes/definiciones'
import { FichaCuentaDialog, fichaDe } from '@/components/contabilidad/plan-contable/FichaCuentaDialog'
import { ClaveMaestro, MaestroDialog } from '@/components/contabilidad/plan-contable/MaestroDialog'
import { InformesContablesService, mensajeError } from '@/app/services/contabilidad/InformesContablesService'
import { PlanCuentasService } from '@/app/services/contabilidad/PlanCuentasService'
import { CatalogosPlan, FichaCuenta } from '@/app/types/plan-cuentas-types'
import { FilaInforme } from '@/app/types/informes-contables-types'
import { toast } from '@/app/hooks/useToast'

/**
 * Plan Contable (Access: Datos Fijos › Datos Generales › PlanCuenta, form [Plan Contable]).
 * Igual que Access: lista con "Ingrese cuenta" + Filtrar e impresión, ficha de la cuenta
 * (Guardar y nuevo, Modificar, Eliminar Registro) y los botones Tipo Cuenta, Concepto EEFF,
 * Amarre Cargo, Amarre Abono y SUNAT.
 */
export default function PlanContablePage() {
    const [catalogos, setCatalogos] = useState<CatalogosPlan | null>(null)
    const [plan, setPlan] = useState<FilaInforme[]>([])
    const [ficha, setFicha] = useState<FichaCuenta | null>(null)
    const [fichaAbierta, setFichaAbierta] = useState(false)
    const [maestro, setMaestro] = useState<ClaveMaestro | null>(null)
    const [recargar, setRecargar] = useState(0)

    const cargarDatos = useCallback(async () => {
        try {
            const [c, p] = await Promise.all([PlanCuentasService.catalogos(), InformesContablesService.reporte('plan-cuentas', {})])
            setCatalogos(c); setPlan(p?.filas ?? [])
        } catch (e) {
            toast({ title: 'No se pudieron cargar los datos de la ficha', description: await mensajeError(e, 'Intenta nuevamente.'), variant: 'destructive' })
        }
    }, [])
    useEffect(() => { cargarDatos() }, [cargarDatos])

    const huboCambio = () => { cargarDatos(); setRecargar(n => n + 1) }
    const abrir = (f: FichaCuenta | null) => { setFicha(f); setFichaAbierta(true) }

    const botones: { t: string; icono: React.ReactNode; accion: () => void }[] = [
        { t: 'Nueva cuenta', icono: <BookPlus className="mr-1.5 h-4 w-4" />, accion: () => abrir(null) },
        { t: 'Tipo Cuenta', icono: <Tags className="mr-1.5 h-4 w-4" />, accion: () => setMaestro('tipo-cuenta') },
        { t: 'Concepto EEFF', icono: <ListChecks className="mr-1.5 h-4 w-4" />, accion: () => setMaestro('concepto-eeff') },
        { t: 'Amarre Cargo', icono: <Link2 className="mr-1.5 h-4 w-4" />, accion: () => setMaestro('amarre-cargo') },
        { t: 'Amarre Abono', icono: <Link2 className="mr-1.5 h-4 w-4" />, accion: () => setMaestro('amarre-abono') },
        { t: 'SUNAT', icono: <FileStack className="mr-1.5 h-4 w-4" />, accion: () => setMaestro('cuenta-sunat') },
    ]

    return (
        <>
            <PaginaInformes
                titulo="Plan Contable"
                descripcion="Plan de cuentas: busca una cuenta, ábrela para modificarla o crea una nueva. Exporta a PDF y Excel."
                pestanas={PESTANAS_PLAN}
                onFila={(f) => abrir(fichaDe(f))}
                recargar={recargar}
                aviso={
                    <div className="flex flex-wrap gap-2 pt-1">
                        {botones.map((b, i) => (
                            <Button key={b.t} variant={b.t === 'Nueva cuenta' ? 'default' : 'outline'} size="sm" onClick={b.accion}
                                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                                    className={`animate-in fade-in-0 slide-in-from-top-1 duration-500 transition-all hover:-translate-y-0.5 hover:shadow-md ${b.t === 'Nueva cuenta'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30 hover:shadow-blue-600/40'
                                        : 'hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300'}`}>
                                {b.icono}{b.t}
                            </Button>
                        ))}
                        <span className="self-center text-xs text-muted-foreground">Haz clic en una cuenta de la lista para ver su ficha.</span>
                    </div>
                }
            />
            <FichaCuentaDialog abierta={fichaAbierta} ficha={ficha} catalogos={catalogos} plan={plan}
                               onCerrar={() => setFichaAbierta(false)} onCambio={huboCambio} />
            <MaestroDialog clave={maestro} catalogos={catalogos} onCerrar={() => setMaestro(null)} onCambio={huboCambio} />
        </>
    )
}
