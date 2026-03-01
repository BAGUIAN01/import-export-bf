"use client";

import { Table } from "@tanstack/react-table";
import { X, Plus, Download, MoreVertical, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableDateRangeFilter } from "./data-table-date-range-filter";
import * as Icons from "lucide-react";

export function DataTableToolbar({
  table,
  searchPlaceholder = "Filtrer...",
  searchLabel = "Rechercher",
  searchKey = "title",
  useGlobalSearch = false,
  filters = [],
  onAdd,
  onExport,
  onExportPdf,
  addButtonText = "Ajouter",
  customActions = [],
}) {
  const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter;

  // Séparer les actions principales des secondaires
  const hasSecondaryActions = onExport || onExportPdf || customActions.length > 0;

  return (
    <div className="space-y-4">
      {/* Ligne supérieure : Recherche + Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Recherche */}
        <div className="flex-1 min-w-0">
          {useGlobalSearch ? (
            <FloatingLabelInput
              id="datatable-search"
              label={searchLabel}
              value={table.getState().globalFilter ?? ""}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
            />
          ) : (
            <FloatingLabelInput
              id="datatable-search"
              label={searchLabel}
              value={table.getColumn(searchKey)?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bouton d'ajout - TOUJOURS VISIBLE (action principale) */}
          {onAdd && (
            <Button onClick={onAdd} className="h-14 flex-shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{addButtonText}</span>
            </Button>
          )}

          {/* Actions secondaires - Menu déroulant sur mobile */}
          {hasSecondaryActions && (
            <>
              {/* Version Desktop - Boutons individuels */}
              <div className="hidden lg:flex items-center gap-2">
                {onExport && (
                  <Button onClick={onExport} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </Button>
                )}

                {onExportPdf && (
                  <Button onClick={onExportPdf} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                )}

                {customActions.map((act, i) => {
                  const Icon = act.icon && Icons[act.icon] ? Icons[act.icon] : null;
                  return (
                    <Button
                      key={`${act.label}-${i}`}
                      variant={act.variant || "outline"}
                      size={act.size || "sm"}
                      onClick={act.onClick}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {act.label}
                    </Button>
                  );
                })}
              </div>

              {/* Version Mobile/Tablet - Menu déroulant */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="sm" className="flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {onExport && (
                    <DropdownMenuItem onClick={onExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter
                    </DropdownMenuItem>
                  )}

                  {onExportPdf && (
                    <DropdownMenuItem onClick={onExportPdf}>
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </DropdownMenuItem>
                  )}

                  {customActions.length > 0 && (onExport || onExportPdf) && <DropdownMenuSeparator />}

                  {customActions.map((act, i) => {
                    const Icon = act.icon && Icons[act.icon] ? Icons[act.icon] : null;
                    return (
                      <DropdownMenuItem key={`${act.label}-${i}`} onClick={act.onClick}>
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {act.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Bouton Filtres */}
          {filters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-14 flex-shrink-0 relative">
                  <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filtres</span>
                  {isFiltered && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      {table.getState().columnFilters.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-3 space-y-3">
                <DropdownMenuLabel className="px-0 pb-0">Filtres</DropdownMenuLabel>
                {filters
                  .filter(filter => filter.type !== 'date-range' && table.getColumn(filter.key))
                  .map((filter) => {
                    const options = typeof filter.options === 'function'
                      ? filter.options(table)
                      : filter.options;
                    return (
                      <DataTableFacetedFilter
                        key={filter.key}
                        column={table.getColumn(filter.key)}
                        title={filter.title}
                        options={options}
                      />
                    );
                  })}
                {filters
                  .filter(filter => filter.type === 'date-range' && table.getColumn(filter.key))
                  .map((filter) => (
                    <DataTableDateRangeFilter
                      key={filter.key}
                      column={table.getColumn(filter.key)}
                      title={filter.title}
                    />
                  ))}
                {isFiltered && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      table.resetColumnFilters();
                      if (table.getState().globalFilter) {
                        table.setGlobalFilter("");
                      }
                    }}
                    className="h-8 w-full text-xs"
                  >
                    Réinitialiser
                    <X className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}