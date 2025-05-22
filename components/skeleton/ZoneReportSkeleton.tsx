import React from "react";

export default function ZoneReportSkeleton() {
    return (
        <div className="rounded-md border bg-white">
            {/* Tabs skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 w-full mb-2 gap-4 px-4 sm:px-6">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-8 bg-gray-300 rounded-md animate-pulse my-2"
                        style={{ minWidth: "80px" }}
                    ></div>
                ))}
            </div>

            {/* Header skeleton */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-4 sm:px-6 py-4 shadow-md mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="h-6 sm:h-7 w-24 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex flex-col sm:items-end gap-1">
                        <div className="h-5 sm:h-6 w-40 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Report item skeleton */}
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
}

