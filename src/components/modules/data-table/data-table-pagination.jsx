"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Composant isolé et mémoïsé pour le Select
const PageSizeSelector = React.memo(({ value, onChange }) => {
  const [internalValue, setInternalValue] = React.useState(value);
  const isChangingRef = React.useRef(false);

  // Synchroniser avec la prop value uniquement si elle change vraiment
  React.useEffect(() => {
    if (!isChangingRef.current && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (newValue) => {
    isChangingRef.current = true;
    setInternalValue(newValue);
    
    // Attendre le prochain tick pour appeler onChange
    setTimeout(() => {
      onChange(newValue);
      // Réinitialiser le flag après un délai
      setTimeout(() => {
        isChangingRef.current = false;
      }, 100);
    }, 0);
  };

  return (
    <Select value={internalValue} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-[70px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent side="top">
        {[10, 20, 30, 40, 50].map((size) => (
          <SelectItem key={size} value={String(size)}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}, (prev, next) => prev.value === next.value);

PageSizeSelector.displayName = "PageSizeSelector";

export function DataTablePagination({ table }) {
  // Obtenir l'état actuel de la table à chaque rendu pour garantir la réactivité
  const state = table.getState();
  const pagination = state.pagination;
  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  
  // Calculer directement les valeurs à chaque rendu (TanStack Table est optimisé pour cela)
  // Cela garantit que les valeurs sont toujours à jour
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRowsCount = table.getFilteredRowModel().rows.length;

  const handlePageSizeChange = React.useCallback((value) => {
    table.setPageSize(Number(value));
  }, [table]);

  const handleFirstPage = React.useCallback(() => {
    table.setPageIndex(0);
  }, [table]);

  const handlePreviousPage = React.useCallback(() => {
    table.previousPage();
  }, [table]);

  const handleNextPage = React.useCallback(() => {
    table.nextPage();
  }, [table]);

  const handleLastPage = React.useCallback(() => {
    table.setPageIndex(pageCount - 1);
  }, [table, pageCount]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
      <div className="text-xs sm:flex-1 sm:text-sm text-muted-foreground">
        {selectedRowsCount} sur {totalRowsCount} ligne(s) sélectionnée(s).
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 lg:gap-8">
        {/* Lignes / page : caché en mobile */}
        <div className="hidden sm:flex items-center space-x-2">
          <p className="text-sm font-medium">Lignes par page</p>
          <PageSizeSelector 
            value={String(pageSize)} 
            onChange={handlePageSizeChange}
          />
        </div>

        <div className="flex min-w-[88px] items-center justify-center text-xs sm:text-sm font-medium">
          {pageIndex + 1} / {pageCount}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={handleFirstPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Aller à la première page</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handlePreviousPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Page précédente</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={handleNextPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">Page suivante</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={handleLastPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">Aller à la dernière page</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}