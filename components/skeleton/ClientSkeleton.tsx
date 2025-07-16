import React from "react";
import { TableRow, TableCell } from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { Eye, Edit, FileText, Building, MapPin } from "lucide-react";

export const SkeletonClientRow = () => (
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
)

export const SkeletonCardClient = () => (
  <Card className="bg-white shadow-sm animate-pulse">
    <CardContent className="p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-blue-300 rounded" />
            <div className="h-5 w-12 bg-blue-300 rounded" />
          </div>
          <div className="h-5 bg-gray-300 rounded w-3/4" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <div className="h-4 bg-gray-300 rounded w-24" />
        </div>
      </div>
      <div className="bg-green-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-green-600" />
          <div className="h-4 bg-gray-300 rounded w-32" />
        </div>
      </div>
      <div className="bg-purple-50 rounded-lg p-3 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-1">
            <div className="h-4 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <Label className="text-xs text-gray-500">Fecha Evaluación</Label>
          <div className="h-5 bg-gray-300 rounded w-20 mt-1" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent cursor-wait" disabled>
          <Eye className="mr-2 h-4 w-4" />
          <div className="h-4 bg-gray-300 rounded w-12" />
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent cursor-wait" disabled>
          <Edit className="mr-2 h-4 w-4" />
          <div className="h-4 bg-gray-300 rounded w-12" />
        </Button>
      </div>
    </CardContent>
  </Card>
)