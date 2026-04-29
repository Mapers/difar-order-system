'use client'

import React, { useState } from 'react';
import { MapPin, Navigation, CreditCard, Map, ChevronDown } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { IClient, ITerritorio } from '@/app/types/order/client-interface';
import { useAuth } from '@/context/authContext';
import apiClient from '@/app/api/client';
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
import {Badge} from "@/components/ui/badge";

interface ClientRowProps {
  client: IClient;
  nameZone: string;
  unidadTerritorio: ITerritorio;
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
        <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
        />
        <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${gap}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={center} y={center - 6} textAnchor="middle" dominantBaseline="middle"
              fill={color} fontSize="28" fontWeight="bold">
          {pct}%
        </text>
        <text x={center} y={center + 16} textAnchor="middle" dominantBaseline="middle"
              fill="#94a3b8" fontSize="11">
          utilizado
        </text>
      </svg>
  );
}

const fmtMoney = (n: number) =>
    "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

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

function EstadoBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'VENCIDA':
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-[10px] font-semibold">Vencida</Badge>;
    case 'POR_VENCER':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-[10px] font-semibold">Por vencer</Badge>;
    case 'VIGENTE':
    default:
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-[10px] font-semibold">Vigente</Badge>;
  }
}

function CreditProgressBar({ pct }: { pct: number }) {
  const getColor = (p: number) => {
    if (p >= 90) return 'bg-red-500';
    if (p >= 70) return 'bg-amber-500';
    return 'bg-green-500';
  };
  return (
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
            className={`h-full rounded-full transition-all duration-500 ${getColor(pct)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
  );
}

interface IFacturaPendiente {
  nro_documento: string;
  tipo_documento: string;
  serie: string;
  numero: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  tipo_moneda: string;
  simbolo_moneda: string;
  provision: number;
  amortizacion: number;
  saldo: number;
  estado: string;
}

interface IResumenCredito {
  linea_credito: number;
  credito_utilizado: number;
  disponible: number;
  pct_utilizado: number;
}

const FinancialZone: React.FC<ClientRowProps> = ({ client, nameZone, unidadTerritorio }) => {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [facturas, setFacturas] = useState<IFacturaPendiente[]>([]);
  const [resumen, setResumen] = useState<IResumenCredito | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const auth = useAuth();

  const fetchCreditDetail = async () => {
    if (!client) return;

    setLoadingCredit(true);
    try {
      const response = await apiClient.get(`/admin/credit-line-details/${client.codigo}`);
      const data = response.data?.data;

      const lineaCredito = Number(client.LineaCredito) || 0;
      const creditoUtilizado = data.reduce((acc, f) => acc + (Number(f.saldo) || 0), 0);
      const disponible = Math.max(0, lineaCredito - creditoUtilizado);
      const pct = lineaCredito > 0 ? Math.min(Math.round((creditoUtilizado / lineaCredito) * 100), 100) : 0;

      setFacturas(data || []);
      setResumen({
        credito_utilizado: creditoUtilizado,
        disponible: disponible,
        linea_credito: lineaCredito,
        pct_utilizado: pct
      });
    } catch (error) {
      setResumen({
        linea_credito: Number(client.LineaCredito || 0),
        credito_utilizado: 0,
        disponible: Number(client.LineaCredito || 0),
        pct_utilizado: 0
      });
      setFacturas([]);
    } finally {
      setLoadingCredit(false);
    }
  };

  const handleCreditClick = () => {
    setShowCreditModal(true);
    fetchCreditDetail();
  };

  const pct = resumen?.pct_utilizado ?? 0;
  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'numeric', year: 'numeric' });

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
          <DialogTrigger asChild>
            <div
                className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={handleCreditClick}
            >
              <CreditCard className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">Línea de Crédito</Label>
                <p className="text-xs text-yellow-600 mt-1">Click para ver detalles</p>
              </div>
              <ChevronDown className="w-4 h-4 text-yellow-600 rotate-[-90deg]" />
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl">
                  <CreditCard className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-900">
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

                  {facturas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                          Facturas Pendientes de Pago
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Nro. Factura</th>
                              <th className="text-left px-3 py-2.5 font-semibold text-slate-500">Vencimiento</th>
                              <th className="text-right px-3 py-2.5 font-semibold text-slate-500">Monto</th>
                              <th className="text-center px-3 py-2.5 font-semibold text-slate-500">Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {facturas.map((factura, index) => (
                                <tr
                                    key={`${factura.nro_documento}-${index}`}
                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-3 py-2.5 font-mono font-medium text-slate-800">
                                    {factura.nro_documento}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-600">
                                    {fmtDate(factura.fecha_vencimiento)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold text-slate-800">
                                    {factura.simbolo_moneda} {Number(factura.saldo).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <EstadoBadge estado={factura.estado} />
                                  </td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                  )}

                  {facturas.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        No se encontraron facturas pendientes de pago.
                      </div>
                  )}
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

        <Dialog>
          <DialogTrigger asChild>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
              <Map className="w-6 h-6 text-purple-600" />
              <div className="flex-1">
                <Label className="text-sm font-medium text-gray-700">Zona</Label>
                <p className="text-lg font-semibold text-gray-900">Zona: {nameZone || "No Definido"}</p>
                <p className="text-xs text-purple-600 mt-1">Click para ver detalles</p>
              </div>
              <ChevronDown className="w-4 h-4 text-purple-600 rotate-[-90deg]" />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-700">
                <Map className="w-5 h-5" />
                Información de Zona
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Map className="w-4 h-4 text-purple-600" />
                    <div>
                      <Label className="text-xs font-medium text-gray-600">ZONA</Label>
                      <p className="text-sm font-semibold text-gray-900">{nameZone || 'No Definido'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <div>
                      <Label className="text-xs font-medium text-gray-600">PROVINCIA</Label>
                      <p className="text-sm font-semibold text-gray-900">{unidadTerritorio?.nombreProvincia}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Navigation className="w-4 h-4 text-green-600" />
                    <div>
                      <Label className="text-xs font-medium text-gray-600">ID DISTRITO</Label>
                      <p className="text-sm font-semibold text-gray-900">{unidadTerritorio?.NombreDistrito}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <div>
                      <Label className="text-xs font-medium text-gray-600">DEPARTAMENTO</Label>
                      <p className="text-sm font-semibold text-gray-900">
                        {unidadTerritorio?.nombreDepartamento}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-purple-700 border-purple-200">
                    Información desde API
                  </Badge>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default FinancialZone;