"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Composant de filtre par plage de dates pour les tableaux de données
 * Props :
 * - column (TanStack column)
 * - title
 */
export function DataTableDateRangeFilter({
  column,
  title = "Date",
}) {
  const filterValue = column?.getFilterValue();
  const dateRange = filterValue 
    ? (typeof filterValue === 'object' && 'from' in filterValue 
        ? filterValue 
        : null)
    : null;

  const [open, setOpen] = React.useState(false);

  const handleSelect = (range) => {
    if (range) {
      column.setFilterValue(range);
    } else {
      column.setFilterValue(undefined);
    }
  };

  const handleClear = () => {
    column.setFilterValue(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {title}
          {dateRange?.from && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd MMM", { locale: fr })} -{" "}
                    {format(dateRange.to, "dd MMM", { locale: fr })}
                  </>
                ) : (
                  format(dateRange.from, "dd MMM yyyy", { locale: fr })
                )}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
        {dateRange?.from && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

