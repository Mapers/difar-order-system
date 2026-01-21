'use client';

import React, { useState } from 'react';
import { CreditCard, ChevronDown, Check } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { ICondicion, IMoneda } from '@/interface/order/client-interface';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '../ui/command';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface ClientRowProps {
  conditions: ICondicion[];
  monedas: IMoneda[];
  onConditionChange: (condition: ICondicion) => void;
  onCurrencyChange: (currency: IMoneda) => void;
  selectedCondition: ICondicion | null;
  selectedCurrency: IMoneda | null;
}

const PaymentCondition: React.FC<ClientRowProps> = ({
                                                      conditions,
                                                      monedas,
                                                      onConditionChange,
                                                      onCurrencyChange,
                                                      selectedCondition,
                                                      selectedCurrency,
                                                    }) => {
  const [isConditionOpen, setIsConditionOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);

  return (
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-green-600 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Condiciones de Pago
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="condicion">Condición</Label>
              <Popover
                  open={isConditionOpen}
                  onOpenChange={(open) => {
                    setIsConditionOpen(open);
                    if (open) setIsCurrencyOpen(false);
                  }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                    {selectedCondition
                        ? conditions.find((c) => c.CodigoCondicion === selectedCondition.CodigoCondicion)?.Descripcion
                        : 'Seleccionar condición...'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar condición..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron condiciones.</CommandEmpty>
                      <CommandGroup>
                        {conditions.map((condition: ICondicion) => (
                            <CommandItem
                                key={condition.CodigoCondicion}
                                // CAMBIO AQUÍ: Usamos la Descripción para el value (buscador)
                                value={condition.Descripcion}
                                onSelect={() => {
                                  onConditionChange(condition);
                                  setIsConditionOpen(false);
                                }}
                            >
                              <Check
                                  className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedCondition?.CodigoCondicion === condition.CodigoCondicion
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                  )}
                              />
                              {condition.Descripcion}
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Popover
                  open={isCurrencyOpen}
                  onOpenChange={(open) => {
                    setIsCurrencyOpen(open);
                    if (open) setIsConditionOpen(false);
                  }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                    {selectedCurrency
                        ? monedas.find((m) => m.value === selectedCurrency.value)?.label
                        : 'Seleccionar moneda...'}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar moneda..." />
                    <CommandList>
                      <CommandEmpty>No se encontraron monedas.</CommandEmpty>
                      <CommandGroup>
                        {monedas.map((currency) => (
                            <CommandItem
                                key={currency.value}
                                // Opcional: También podrías cambiar esto a currency.label si quieres buscar por nombre de moneda
                                value={currency.label}
                                onSelect={() => {
                                  onCurrencyChange(currency);
                                  setIsCurrencyOpen(false);
                                }}
                            >
                              <Check
                                  className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedCurrency?.value === currency.value ? 'opacity-100' : 'opacity-0',
                                  )}
                              />
                              {currency.label}
                            </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {(selectedCondition || selectedCurrency) && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Resumen de Condiciones:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCondition && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {conditions.find((c) => c.CodigoCondicion === selectedCondition.CodigoCondicion)?.Descripcion}
                      </Badge>
                  )}
                  {selectedCurrency && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {monedas.find((m) => m.value === selectedCurrency.value)?.label}
                      </Badge>
                  )}
                </div>
              </div>
          )}
        </CardContent>
      </Card>
  );
};

export default PaymentCondition;