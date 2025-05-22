import React from 'react';
import ClientRow from './clientRow';
import { Client, Zone } from "@/interface/report-interface"


interface ZoneReportProps {
  zone: Zone;
  clients: Client[];
}

const ZoneReport: React.FC<ZoneReportProps> = ({ zone, clients }) => {
  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-4 sm:px-6 py-4 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-lg sm:text-xl text-white font-bold">{zone.CodVend}</h2>
          <div className="flex flex-col sm:items-end">
            <span className="text-white text-base sm:text-lg font-semibold">{zone.nomVend}</span>
            {/* <span className="text-white text-sm">Total: {formatCurrency(zoneTotal)} S/</span> */}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {clients.length > 0 ? (
          clients.map((client: Client) => (
            <ClientRow key={client.head.Cod_Clie} client={client} invoices={client.boddy} />
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

export default ZoneReport;
