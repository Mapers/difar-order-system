import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Client, Invoice } from '@/interface/report/report-interface';
import InvoiceClientRow from './invoiceClientRow';
import { calcularTotalWithAmortizacion } from '@/utils/client';

interface ClientRowProps {
    client: Client;
    invoices: Invoice[];
  }
const ClientRow: React.FC<ClientRowProps> = ({ client,invoices }) => {
    const [expanded, setExpanded] = useState(false);
    const total = calcularTotalWithAmortizacion(invoices);


    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    return (
        <div className="mb-4">
            <div
                className="p-4 cursor-pointer flex justify-between items-center bg-white"
                onClick={toggleExpand}
            >
                <div className="w-full">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="flex-1">
                            <div className="font-semibold text-lg text-gray-800">{client.head.NombreComercial}</div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Cliente:</span> {client.head.Cod_Clie}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Zona:</span> {client.head.Nombre}
                            </div>
                        </div>
                        <div className="mt-2 md:mt-0 text-right">
                            <div className="font-semibold text-lg text-gray-800"> S/. {total.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">Saldo Total</div>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center">
                        <div className="text-indigo-600 text-sm">
                            {expanded ? 'Ocultar facturas' : `Ver facturas (${invoices.length})`}
                        </div>
                        <svg
                            className={`ml-1 w-4 h-4 transition-transform duration-200 ${expanded ? 'transform rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-gray-200 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead>Fecha EMISIÓN</TableHead>
                                <TableHead>FECHA VENCIMIENTO</TableHead>
                                <TableHead className="hidden md:table-cell">FECHA AMORTIZACIÓN</TableHead>
                                <TableHead className="hidden md:table-cell">ABRE DOC</TableHead>
                                <TableHead className="hidden md:table-cell">SERIE DE DOCUMENTO</TableHead>
                                <TableHead className="hidden md:table-cell">NÚMERO DE DOCUMENTO</TableHead>
                                <TableHead className="hidden md:table-cell">TIPO DE MONEDA</TableHead>
                                <TableHead className="hidden md:table-cell">PROVISIÓN</TableHead>
                                <TableHead className="hidden md:table-cell">AMORTIZACIÓN</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice: Invoice, index) => (
                                <InvoiceClientRow key={invoice.Fecha_Emision + index} invoice={invoice} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default ClientRow;