import React from 'react';
import { ClientSeller, ZoneSeller } from '@/interface/report/balanceDocClientSeller-interface';
import ClientRowSeller from './clientRowSeller';

interface ZoneSellerReportProps {
  zoneseller: ZoneSeller;
  clientssellers: ClientSeller[];
}

const ZoneReportSeller: React.FC<ZoneSellerReportProps> = ({ zoneseller, clientssellers }) => {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-4 sm:px-6 py-4 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-lg sm:text-xl text-white font-bold">{zoneseller.CodVend}</h2>
          <div className="flex flex-col sm:items-end">
            <span className="text-white text-base sm:text-lg font-semibold">{zoneseller.nomVend}</span>
            {/* <span className="text-white text-sm">Total: {formatCurrency(zoneTotal)} S/</span> */}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {clientssellers.length > 0 ? (
          clientssellers.map((clientseller: ClientSeller) => (
            <ClientRowSeller key={clientseller.head.Nombre} clientseller={clientseller} invoicesellers={clientseller.boddy} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
            No hay clientes en esta zona
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoneReportSeller;
