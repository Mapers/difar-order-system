import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table"
import { Invoice } from '@/app/types/report/report-interface';

interface InvoiceProps {
    invoice: Invoice
}

const InvoiceCollectSellerRow: React.FC<InvoiceProps> = ({ invoice }) => {

    const formatDateToDDMMYYYY = (dateString: string): string => {
        if (!dateString) return '';

        try {
            // Fecha leída tal cual AAAA-MM-DD: con new Date() el día salía en UTC
            // y el mes en local, y las fechas del día 1 mostraban el mes anterior.
            const [year, month, day] = String(dateString).split('T')[0].split('-');
            if (year && month && day) return `${day}/${month}/${year}`;
            return dateString;
        } catch (error) {
            return dateString;
        }
    };

    return (
        <TableRow className="hover:bg-muted">
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

export default InvoiceCollectSellerRow;