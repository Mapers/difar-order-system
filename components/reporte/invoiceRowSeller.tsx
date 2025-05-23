import React from 'react';

import { TableCell, TableRow } from "@/components/ui/table"
import { InvoiceSeller } from '@/interface/report/balanceDocClientSeller-interface';

interface InvoiceProps {
    invoiceseller: InvoiceSeller
}

const InvoiceRowSeller: React.FC<InvoiceProps> = ({ invoiceseller }) => {

    return (
        <TableRow className="hover:bg-gray-50">
            <TableCell className="font-medium">{invoiceseller.Fecha_Emision}</TableCell>
            <TableCell className="font-medium">{invoiceseller.Fecha_Vcto}</TableCell>
            
            <TableCell className="hidden md:table-cell">
                {invoiceseller.Tipo_Doc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoiceseller.Abre_Doc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoiceseller.SerieDoc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoiceseller.NumeroDoc || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoiceseller.Tipo_Moneda || "-"}
            </TableCell>
            <TableCell className="hidden md:table-cell">
                {invoiceseller.saldoDoc || "-"}
            </TableCell>
          
        </TableRow>
    );
};

export default InvoiceRowSeller;