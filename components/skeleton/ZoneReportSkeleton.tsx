import React from "react";
import { Tabs, TabsContent, } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";


export const ZoneReportSkeleton = () => (
  <div className="rounded-md border bg-white">
    <div className="grid grid-cols-2 sm:grid-cols-4 w-full mb-2 gap-4 px-4 sm:px-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-8 bg-gray-300 rounded-md animate-pulse my-2"
          style={{ minWidth: "80px" }}
        ></div>
      ))}
    </div>

    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-4 sm:px-6 py-4 shadow-md mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="h-6 sm:h-7 w-24 bg-gray-300 rounded animate-pulse"></div>
        <div className="flex flex-col sm:items-end gap-1">
          <div className="h-5 sm:h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    </div>

    <div className="mt-4 space-y-4 px-4 sm:px-6 py-1">
      {[...Array(1)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 p-4 bg-gray-100 rounded-md animate-pulse"
        >
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 bg-gray-300 rounded"></div>
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
            <div className="h-4 w-52 bg-gray-300 rounded"></div>
            <div className="h-4 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="mt-2 md:mt-0 text-right space-y-2">
            <div className="h-5 w-24 bg-gray-300 rounded"></div>
            <div className="h-4 w-20 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


export const SkeletonState = () => (
  <CardContent className="p-3 flex items-center justify-center">
    <div className="flex items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-gray-400 animate-pulse" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-8 w-20 bg-gray-400 rounded animate-pulse" />
      </div>
    </div>
  </CardContent>
);

export const ClientCardSkeleton = () => (
  <div className="space-y-6 mt-6-1">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-blue-100 border-blue-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-900">
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx}>
              <div className="h-3 w-24 mb-1 bg-gray-400 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-500 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-green-100 border-green-300">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-900">
            Estado y Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx}>
              <div className="h-3 w-28 mb-1 bg-gray-400 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-500 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);
