import React from 'react';

import { TableCell, TableRow } from "@/components/ui/table"
import { Invoice } from '@/interface/report/report-interface';

interface InvoiceProps {
    invoice: Invoice
}

const InvoiceClientRow: React.FC<InvoiceProps> = ({ invoice }) => {

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell className="font-medium">{invoice.Fecha_Emision}</TableCell>
            <TableCell className="font-medium">{invoice.Fecha_Vcto}</TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Date_Amortizacion || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Abre_Doc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.SerieDoc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.NumeroDoc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell text-center">
                {invoice.Tipo_Moneda || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
                {invoice.Provision || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
                {invoice.Amortizacion || "-"}
            </TableCell>
        </TableRow>
    );
};

export default InvoiceClientRow;