"use client";

import { Table } from "@tanstack/react-table";
import { X, Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import * as Icons from "lucide-react";

export function DataTableToolbar({
  table,
  searchPlaceholder = "Filtrer...",
  searchKey = "title",
  filters = [],
  onAdd,
  onExport,
  onImport,
  addButtonText = "Ajouter",
  customActions = [],
  defaultHiddenColumns = [], // Prop pour les colonnes masquées par défaut
}) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Ligne supérieure : Recherche + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={table.getColumn(searchKey)?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-full sm:w-[200px] lg:w-[300px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onImport && (
            <Button
              onClick={onImport}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px]"
            >
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          )}

          {onExport && (
            <Button
              onClick={onExport}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px]"
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
          )}

          {customActions.map((act, i) => {
            const Icon = act.icon && Icons[act.icon] ? Icons[act.icon] : null;
            return (
              <Button
                key={`${act.label}-${i}`}
                variant={act.variant || "default"}
                size={act.size || "default"}
                onClick={act.onClick}
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px]"
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {act.label}
              </Button>
            );
          })}

          {onAdd && (
            <Button 
              onClick={onAdd} 
              size="sm" 
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{addButtonText}</span>
            </Button>
          )}

          <div className="hidden lg:block">
            <DataTableViewOptions 
              table={table} 
              defaultHiddenColumns={defaultHiddenColumns}
            />
          </div>
        </div>
      </div>

      {/* Ligne inférieure : Filtres */}
      {filters.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Filtres :
            </span>
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={() => table.resetColumnFilters()}
                className="h-7 px-2 text-xs"
              >
                Réinitialiser
                <X className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Grille responsive pour les filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filters.map(
              (filter) =>
                table.getColumn(filter.key) && (
                  <DataTableFacetedFilter
                    key={filter.key}
                    column={table.getColumn(filter.key)}
                    title={filter.title}
                    options={filter.options}
                  />
                )
            )}
          </div>
        </div>
      )}
    </div>
  );
}