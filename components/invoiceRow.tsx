import React from 'react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Invoice } from '@/interface/report-interface';

interface InvoiceProps {
    invoice: Invoice
}

const InvoiceRow: React.FC<InvoiceProps> = ({ invoice }) => {

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell className="font-medium">{invoice.Fecha_Emision}</TableCell>
            <TableCell className="font-medium">{invoice.Fecha_Vcto}</TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Date_Amortizacion || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Tipo_Doc || "-"}
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
            <TableCell className="hidden md:table-cell">
                {invoice.Tipo_Moneda || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Provision || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Amortizacion || "-"}
            </TableCell>
        </TableRow>
    );
};

export default InvoiceRow;