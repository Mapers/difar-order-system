import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MultiSelectLaboratory from "@/components/price/multiSelectLaboratory";

export const PriceFilters = ({
                                 searchTerm, setSearchTerm, selectedLabs, setSelectedLabs,
                                 laboratories, excludeNoStock, setExcludeNoStock
                             }: any) => (
    <Card className="shadow-sm">
        <CardHeader className="border-b"><CardTitle className="text-lg font-semibold text-gray-800">Filtros</CardTitle></CardHeader>
        <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Búsqueda</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                        <Input className="pl-9" placeholder="Código, descripción..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); }} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Laboratorios</Label>
                    <MultiSelectLaboratory laboratories={laboratories} selectedLabs={selectedLabs} onSelectionChange={setSelectedLabs} />
                </div>
                <div className="space-y-2">
                    <Label>Filtro</Label>
                    <div className="flex items-center space-x-2 pt-2">
                        <input type="checkbox" id="excludeNoStock" checked={excludeNoStock} onChange={(e) => setExcludeNoStock(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="excludeNoStock" className="text-sm font-medium text-gray-700 cursor-pointer">Excluir sin stock</label>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);