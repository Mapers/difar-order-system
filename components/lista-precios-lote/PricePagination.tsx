import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PricePagination = ({
                                    currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange
                                }: any) => {

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) onPageChange(page);
    };

    return (
        <div className="border-t bg-gray-50 px-4 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                {/* Lado izquierdo: Mostrar N registros */}
                <div className="flex flex-col xs:flex-row xs:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap">Mostrar:</Label>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-20"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-nowrap">
                        Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                    </div>
                </div>

                {/* Lado derecho: Paginación y Botones */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-1 flex-1 sm:flex-none justify-center">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden xs:inline">Anterior</span>
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(totalPages <= 5 ? totalPages : 3, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 2) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 1) {
                                    pageNum = totalPages - (totalPages <= 5 ? totalPages : 3) + i + 1;
                                } else {
                                    pageNum = currentPage - 1 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => goToPage(pageNum)}
                                        className="w-8 h-8 p-0 text-xs sm:text-sm"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}

                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <span className="px-2 text-sm text-gray-500">...</span>
                            )}

                            {totalPages > 5 && currentPage < totalPages - 1 && (
                                <Button variant={currentPage === totalPages ? "default" : "outline"} size="sm" onClick={() => goToPage(totalPages)} className="w-8 h-8 p-0 text-xs sm:text-sm">
                                    {totalPages}
                                </Button>
                            )}
                        </div>

                        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-1 flex-1 sm:flex-none justify-center">
                            <span className="hidden xs:inline">Siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Selector móvil oculto en escritorio */}
                    {totalPages > 5 && (
                        <div className="flex items-center gap-2 sm:hidden w-full justify-center">
                            <Label htmlFor="pageSelect" className="text-sm text-gray-700 whitespace-nowrap">Ir a:</Label>
                            <select
                                id="pageSelect"
                                value={currentPage}
                                onChange={(e) => goToPage(Number(e.target.value))}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};