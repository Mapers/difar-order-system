import { useState } from "react";
import { Search, Check, ChevronsUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import MultiSelectLaboratory from "@/components/price/multiSelectLaboratory";
import { cn } from "@/lib/utils";

export const PriceFilters = ({
                                 searchTerm, setSearchTerm,
                                 selectedLabs, setSelectedLabs,
                                 laboratories,
                                 excludeNoStock, setExcludeNoStock,
                                 selectedPrinciple, setSelectedPrinciple, uniquePrinciples
                             }: any) => {
    const [openPrinciple, setOpenPrinciple] = useState(false);

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold text-gray-800">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                    {/* NUEVO FILTRO: PRINCIPIO ACTIVO */}
                    <div className="space-y-2">
                        <Label>Principio Activo</Label>
                        <Popover open={openPrinciple} onOpenChange={setOpenPrinciple}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openPrinciple}
                                    className="w-full justify-between font-normal text-left px-3 bg-white"
                                >
                                    <span className="truncate">
                                        {selectedPrinciple ? selectedPrinciple : "Todos los principios..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] lg:w-[350px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar principio activo..." />
                                    <CommandList className="max-h-[300px]">
                                        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setSelectedPrinciple("");
                                                    setOpenPrinciple(false);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", !selectedPrinciple ? "opacity-100" : "opacity-0")} />
                                                Todos
                                            </CommandItem>
                                            {uniquePrinciples?.map((principle: string) => (
                                                <CommandItem
                                                    key={principle}
                                                    onSelect={() => {
                                                        setSelectedPrinciple(principle);
                                                        setOpenPrinciple(false);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", selectedPrinciple === principle ? "opacity-100" : "opacity-0")} />
                                                    {principle}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2 lg:pl-4 flex flex-col justify-center">
                        <Label className="invisible hidden lg:block">Filtro</Label>
                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="excludeNoStock"
                                checked={excludeNoStock}
                                onChange={(e) => setExcludeNoStock(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="excludeNoStock" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Excluir sin stock
                            </label>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};