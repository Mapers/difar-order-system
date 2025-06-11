'use client';

import React, { useState } from 'react';
import { CreditCard, ChevronDown, Check } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { ICondicion, IMoneda } from '@/interface/order/client-interface';
import { Card, CardContent, CardHeader, CardTitle, } from '../ui/card';
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
  onConditionChange: (value: string) => void
  onCurrencyChange: (value: string) => void
}

const PaymentCondition: React.FC<ClientRowProps> = ({ conditions, monedas, onConditionChange, onCurrencyChange }) => {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');

  const handleConditionSelect = (currenteValue: string) => {
    const newValue = currenteValue === selectedCondition ? "" : currenteValue
    setSelectedCondition(newValue)
    onConditionChange(newValue)
  }
  const handleCurrencySelect = (currenteValue: string) => {
    const newValue = currenteValue === selectedCurrency ? '' : currenteValue;
    setSelectedCurrency(newValue);
    onCurrencyChange(newValue);
  };

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
          {/* Condición */}
          <div className="space-y-2">
            <Label htmlFor="condicion">Condición</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                  {selectedCondition
                    ? conditions.find((c) => c.CodigoCondicion === selectedCondition)?.Descripcion
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
                      {conditions.map((condition) => (
                        <CommandItem
                          key={condition.CodigoCondicion}
                          value={condition.CodigoCondicion}
                          onSelect={handleConditionSelect}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCondition === condition.CodigoCondicion
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

          {/* Moneda */}
          <div className="space-y-2">
            <Label htmlFor="moneda">Moneda</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-12">
                  {selectedCurrency
                    ? monedas.find((m) => m.value === selectedCurrency)?.label
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
                          value={currency.value}
                          onSelect={handleCurrencySelect}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCurrency === currency.value
                                ? 'opacity-100'
                                : 'opacity-0',
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

        {/* Resumen */}
        {(selectedCondition || selectedCurrency) && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Resumen de Condiciones:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCondition && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {conditions.find((c) => c.CodigoCondicion === selectedCondition)?.Descripcion}
                </Badge>
              )}
              {selectedCurrency && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {monedas.find((m) => m.value === selectedCurrency)?.label}
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
