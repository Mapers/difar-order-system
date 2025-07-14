import React from "react";
import { TableRow, TableCell } from "../ui/table";
import { Skeleton } from "../ui/skeleton";

export default function SkeletonClientRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
      <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[150px]" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[80px]" /></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}