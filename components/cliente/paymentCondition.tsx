'use client';

import React, { useState } from 'react';
import { CreditCard, ChevronDown, Check } from 'lucide-react';
import { Label } from '@radix-ui/react-label';
import { ICondicion, IMoneda } from '@/app/types/order/client-interface';
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
    <div className="space-y-3 p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-base font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
        <CreditCard className="w-4 h-4" />
        Condiciones de Pago
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Condición</Label>
          <Popover
            open={isConditionOpen}
            onOpenChange={(open) => {
              setIsConditionOpen(open);
              if (open) setIsCurrencyOpen(false);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-10 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <span className="truncate">
                  {selectedCondition
                    ? conditions.find((c) => c.CodigoCondicion === selectedCondition.CodigoCondicion)?.Descripcion
                    : 'Seleccionar condición...'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 dark:bg-gray-900 dark:border-gray-700">
              <Command className="dark:bg-gray-900">
                <CommandInput placeholder="Buscar condición..." className="dark:text-gray-100" />
                <CommandList>
                  <CommandEmpty className="dark:text-gray-400">No se encontraron condiciones.</CommandEmpty>
                  <CommandGroup>
                    {conditions.map((condition: ICondicion) => (
                      <CommandItem
                        key={condition.CodigoCondicion}
                        value={condition.Descripcion}
                        onSelect={() => {
                          onConditionChange(condition);
                          setIsConditionOpen(false);
                        }}
                        className="dark:text-gray-300 dark:hover:bg-gray-800"
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

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Moneda</Label>
          <Popover
            open={isCurrencyOpen}
            onOpenChange={(open) => {
              setIsCurrencyOpen(open);
              if (open) setIsConditionOpen(false);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-10 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
              >
                <span className="truncate">
                  {selectedCurrency
                    ? monedas.find((m) => m.value === selectedCurrency.value)?.label
                    : 'Seleccionar moneda...'}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 dark:bg-gray-900 dark:border-gray-700">
              <Command className="dark:bg-gray-900">
                <CommandInput placeholder="Buscar moneda..." className="dark:text-gray-100" />
                <CommandList>
                  <CommandEmpty className="dark:text-gray-400">No se encontraron monedas.</CommandEmpty>
                  <CommandGroup>
                    {monedas.map((currency) => (
                      <CommandItem
                        key={currency.value}
                        value={currency.label}
                        onSelect={() => {
                          onCurrencyChange(currency);
                          setIsCurrencyOpen(false);
                        }}
                        className="dark:text-gray-300 dark:hover:bg-gray-800"
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
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedCondition && (
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-xs">
              {conditions.find((c) => c.CodigoCondicion === selectedCondition.CodigoCondicion)?.Descripcion}
            </Badge>
          )}
          {selectedCurrency && (
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs">
              {monedas.find((m) => m.value === selectedCurrency.value)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentCondition;
