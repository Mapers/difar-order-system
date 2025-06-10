'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { IClient } from '@/interface/client/client-interface';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '../ui/command';

// Función utilitaria para clases condicionales
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Mock de condiciones y monedas (reemplázalos con los reales)
const condicionesPago = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito', label: 'Crédito' },
];

const monedas = [
  { value: 'pen', label: 'Soles (PEN)' },
  { value: 'usd', label: 'Dólares (USD)' },
];

interface ClientRowProps {
  client: IClient;
}

const PaymentCondition: React.FC<ClientRowProps> = ({ client }) => {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');

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
                    ? condicionesPago.find((c) => c.value === selectedCondition)?.label
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
                      {condicionesPago.map((condition) => (
                        <CommandItem
                          key={condition.value}
                          value={condition.value}
                          onSelect={(currentValue) => {
                            setSelectedCondition(
                              currentValue === selectedCondition ? '' : currentValue,
                            );
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCondition === condition.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {condition.label}
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
                          onSelect={(currentValue) => {
                            setSelectedCurrency(
                              currentValue === selectedCurrency ? '' : currentValue,
                            );
                          }}
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
                  {condicionesPago.find((c) => c.value === selectedCondition)?.label}
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
