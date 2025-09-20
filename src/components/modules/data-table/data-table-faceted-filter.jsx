"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, PlusCircle, X } from "lucide-react";

/**
 * Props :
 * - column (TanStack column)
 * - title
 * - options: [{ label, value, icon? }]
 * - values? (facultatif) → on tolère undefined
 */
export function DataTableFacetedFilter({
  column,
  title,
  options = [],
  values, // facultatif
}) {
  const selectedValues = new Set(
    (column?.getFilterValue() || []).map?.((v) => String(v)) || []
  );

  // Robustesse : si values n’est pas fourni, on calcule depuis la colonne
  const fallbackValues = Array.from(selectedValues);
  const valuesSafe = Array.isArray(values) ? values : fallbackValues;

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="flex gap-1">
                {valuesSafe.slice(0, 2).map((v) => {
                  const opt = options.find((o) => String(o.value) === String(v));
                  if (!opt) return null;
                  return (
                    <Badge key={v} variant="secondary">
                      {opt.label}
                    </Badge>
                  );
                })}
                {selectedValues.size > 2 && (
                  <Badge variant="secondary">+{selectedValues.size - 2}</Badge>
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Aucun résultat</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(String(option.value));
                return (
                  <CommandItem
                    key={String(option.value)}
                    onSelect={() => {
                      if (isSelected) {
                        const filtered = Array.from(selectedValues).filter(
                          (v) => String(v) !== String(option.value)
                        );
                        column.setFilterValue(filtered);
                      } else {
                        column.setFilterValue([
                          ...Array.from(selectedValues),
                          option.value,
                        ]);
                      }
                    }}
                  >
                    <div
                      className={
                        isSelected
                          ? "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary bg-primary text-primary-foreground"
                          : "mr-2 h-4 w-4 rounded-sm border border-muted-foreground"
                      }
                    >
                      {isSelected && <CheckIcon className="h-4 w-4" />}
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedValues.size > 0 && (
          <>
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => column.setFilterValue([])}
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}