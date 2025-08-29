import React, { useState } from 'react';
import { MapPin, Navigation, CreditCard, Map, ChevronDown } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { IClient, ITerritorio } from '@/interface/order/client-interface';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/use-toast';
import { useAuth } from '@/context/authContext';
import apiClient from '@/app/api/client';

interface ClientRowProps {
  client: IClient;
  nameZone: string;
  unidadTerritorio: ITerritorio;
}

const FinancialZone: React.FC<ClientRowProps> = ({ client, nameZone, unidadTerritorio }) => {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditData, setCreditData] = useState<any[]>([]);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const fetchCreditData = async () => {
    if (!client || !auth.user?.codigo) return;

    setLoadingCredit(true);
    try {
      const response = await apiClient.get(`/reportes/balancePorCliente?codigoVendedor=${auth.user.codigo}&rucCliente=${client.RUC}`);
      setCreditData(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching credit data:", error);
    } finally {
      setLoadingCredit(false);
    }
  };

  const handleCreditClick = () => {
    setShowCreditModal(true);
    fetchCreditData();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Línea de Crédito - Card clickeable */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogTrigger asChild>
          <div
            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
            onClick={handleCreditClick}
          >
            <CreditCard className="w-6 h-6 text-yellow-600" />
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">Línea de Crédito</Label>
              {/*<p className="text-lg font-semibold text-gray-900">{client.LineaCredito || "0.00"}</p>*/}
              <p className="text-xs text-yellow-600 mt-1">Click para ver detalles</p>
            </div>
            <ChevronDown className="w-4 h-4 text-yellow-600 rotate-[-90deg]" />
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Línea de Crédito - {client.Nombre}
            </DialogTitle>
            <DialogDescription>
              Detalles del balance crediticio del cliente
            </DialogDescription>
          </DialogHeader>

          {loadingCredit ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : creditData.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Saldo Documento</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {item.Simb_Moneda} {Number(item.saldoDoc)?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.Fecha_Emision ? new Date(item.Fecha_Emision).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.Fecha_Vcto ? new Date(item.Fecha_Vcto).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No se encontraron datos de crédito para este cliente.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zona - Card existente */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
            <Map className="w-6 h-6 text-purple-600" />
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">Zona</Label>
              <p className="text-lg font-semibold text-gray-900">Zona: {nameZone || "No Definido"} </p>
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