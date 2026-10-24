'use client'

import React, { useState } from 'react'
import { CreditCard, ChevronDown } from 'lucide-react'
import { IClient } from '@/app/types/order/client-interface'
import { CreditoCliente, tieneCreditoActivo } from '@/app/hooks/useCreditoCliente'
import apiClient from '@/app/api/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger
} from "@/components/ui/dialog";
import {DialogTitle} from "@radix-ui/react-dialog";
import {Button} from "@/components/ui/button";

// Chip de Línea de Crédito, extraído de FinancialZoneAlpha para poder
// mostrarlo directo dentro de la tarjeta del cliente seleccionado (en vez
// de más abajo junto a Zona/Condición) — se abre el mismo modal de detalle
// de siempre (donut y montos de la línea).
interface CreditLineChipProps {
  client: IClient
  /** Línea, usado y disponible según /clientes/credito. Sin él se calcula como antes. */
  credito?: CreditoCliente | null
  cargandoCredito?: boolean
}

function CreditDonut({ pct, size = 160, strokeWidth = 14 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;
  const gap = circumference - filled;
  const center = size / 2;

  const getColor = (p: number) => {
    if (p >= 90) return '#dc2626';
    if (p >= 70) return '#f59e0b';
    return '#16a34a';
  };

  const color = getColor(pct);

  return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${gap}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={center} y={center - 6} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="28" fontWeight="bold">
          {pct}%
        </text>
        <text x={center} y={center + 16} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="11">
          utilizado
        </text>
      </svg>
  );
}

const fmtMoney = (n: number) =>
    "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CreditAlert({ pct }: { pct: number }) {
  if (pct >= 90) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 rounded-lg border border-red-200">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span className="text-sm font-medium text-red-800">Límite crítico — crédito casi agotado</span>
        </div>
    );
  }
  if (pct >= 70) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-sm font-medium text-amber-800">Advertencia — crédito en uso elevado</span>
        </div>
    );
  }
  return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 rounded-lg border border-green-200">
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
        <span className="text-sm font-medium text-green-800">Crédito saludable — disponible para uso</span>
      </div>
  );
}

function CreditProgressBar({ pct }: { pct: number }) {
  const getColor = (p: number) => {
    if (p >= 90) return 'bg-red-500';
    if (p >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };
  return (
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${getColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
  );
}

interface IResumenCredito {
  linea_credito: number;
  credito_utilizado: number;
  disponible: number;
  pct_utilizado: number;
}

export default function CreditLineChip({ client, credito, cargandoCredito = false }: CreditLineChipProps) {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [resumen, setResumen] = useState<IResumenCredito | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);

  const fetchCreditDetail = async () => {
    if (!client) return;

    setLoadingCredit(true);
    try {
      const response = await apiClient.get(`/admin/credit-line-details/${client.codigo}`);
      const data = response.data?.data;

      // Sin datos del endpoint de crédito: se calcula con la línea del cliente y sus documentos pendientes.
      const lineaCredito = credito ? credito.lineaCredito : (Number(client.LineaCredito) || 0);
      const creditoUtilizado = credito ? credito.usado : (data || []).reduce((acc: number, f: any) => acc + (Number(f.saldo) || 0), 0);
      const disponible = credito ? credito.disponible : Math.max(0, lineaCredito - creditoUtilizado);
      const pct = lineaCredito > 0 ? Math.min(Math.round((creditoUtilizado / lineaCredito) * 100), 100) : 0;
      setResumen({
        credito_utilizado: creditoUtilizado,
        disponible: disponible,
        linea_credito: lineaCredito,
        pct_utilizado: pct
      });
    } catch (error) {
      const linea = credito ? credito.lineaCredito : Number(client.LineaCredito || 0);
      const usado = credito ? credito.usado : 0;
      setResumen({
        linea_credito: linea,
        credito_utilizado: usado,
        disponible: credito ? credito.disponible : linea,
        pct_utilizado: linea > 0 ? Math.min(Math.round((usado / linea) * 100), 100) : 0
      });
    } finally {
      setLoadingCredit(false);
    }
  };

  const handleCreditClick = () => {
    setShowCreditModal(true);
    if (credito) {
      const linea = credito.lineaCredito;
      setResumen({
        linea_credito: linea,
        credito_utilizado: credito.usado,
        disponible: credito.disponible,
        pct_utilizado: linea > 0 ? Math.min(Math.round((credito.usado / linea) * 100), 100) : 0,
      });
      return;
    }
    fetchCreditDetail();
  };

  const pct = resumen?.pct_utilizado ?? 0;
  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'numeric', year: 'numeric' });

  return (
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogTrigger asChild>
          <button
              type="button"
              onClick={handleCreditClick}
              className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                credito && !tieneCreditoActivo(credito)
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400'
                  : 'border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-400'
              }`}
          >
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            {cargandoCredito ? (
              <span>Línea de crédito…</span>
            ) : credito && !tieneCreditoActivo(credito) ? (
              <span className="font-semibold">Sin línea de crédito activa</span>
            ) : credito ? (
              <>
                <span>Línea <b className="tabular-nums">{fmtMoney(credito.lineaCredito)}</b></span>
                <span className="opacity-50">·</span>
                <span>Disponible <b className={`tabular-nums ${credito.disponible <= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{fmtMoney(credito.disponible)}</b></span>
              </>
            ) : (
              <span>Línea de crédito</span>
            )}
            <ChevronDown className="h-3 w-3 shrink-0 rotate-[-90deg]" />
          </button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Línea de crédito
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 uppercase tracking-wide mt-0.5">
                  {client.Nombre}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingCredit ? (
              <div className="flex justify-center items-center h-52">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
              </div>
          ) : resumen ? (
              <div className="px-6 pb-2 space-y-5">
                <CreditAlert pct={pct} />
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <CreditDonut pct={pct} size={160} strokeWidth={14} />
                  </div>
                  <div className="flex-1 w-full space-y-3">
                    <div className="border border-slate-200 rounded-lg p-3 bg-white">
                      <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">
                        Línea Total Asignada
                      </p>
                      <p className="text-xl font-bold text-slate-900">
                        {fmtMoney(resumen.linea_credito)}
                      </p>
                      <div className="mt-2">
                        <CreditProgressBar pct={pct} />
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-semibold text-red-400 tracking-wider mb-1">
                        Crédito Utilizado
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {fmtMoney(resumen.credito_utilizado)}
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-[10px] uppercase font-semibold text-green-500 tracking-wider mb-1">
                        Disponible
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        {fmtMoney(resumen.disponible)}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
          ) : (
              <div className="text-center py-12 text-slate-400 text-sm px-6">
                No se pudo obtener la información de crédito.
              </div>
          )}

          <DialogFooter className="flex flex-row sm:justify-between items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              {resumen ? `${pct}% de la línea comprometida` : ''} · {today}
            </p>
            <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreditModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
