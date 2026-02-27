import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table"
import { Invoice } from '@/interface/report/report-interface';

interface InvoiceProps {
    invoice: Invoice
}

const InvoiceCollectClientRow: React.FC<InvoiceProps> = ({ invoice }) => {

    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const day = date.getUTCDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    };

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell className="font-medium">{formatDateToDDMMYYYY(invoice.Fecha_Emision)}</TableCell>
            <TableCell className="font-medium">{formatDateToDDMMYYYY(invoice.Fecha_Vcto)}</TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.Abre_Doc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.SerieDoc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoice.NumeroDoc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
                {invoice.Tipo_Moneda || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell text-right">
                {invoice.saldoDoc || "-"}
            </TableCell>
          
        </TableRow>
    );
};

export default InvoiceCollectClientRow;