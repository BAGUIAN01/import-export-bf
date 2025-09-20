"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

export function CustomDataTable({
  data = [],
  columns = [],
  searchPlaceholder = "Filtrer...",
  searchKey = "title",
  filters = [],
  onAdd,
  onExport,
  onImport,
  addButtonText = "Ajouter",
  title,
  customActions = [],
  initialHiddenColumns = [], 
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [sorting, setSorting] = React.useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Appliquer les colonnes masquées par défaut une seule fois
  const appliedInitialRef = React.useRef(false);
  React.useEffect(() => {
    if (appliedInitialRef.current) return;

    if (initialHiddenColumns && initialHiddenColumns.length > 0) {
      const next = {};
      initialHiddenColumns.forEach((id) => {
        next[id] = false; // false => masqué
      });
      setColumnVisibility((prev) => ({ ...next, ...prev }));
    }

    appliedInitialRef.current = true;
  }, [initialHiddenColumns]);

  // Auto-hide mobile: n’appliquer que si aucune valeur n’a déjà été posée
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");

    const apply = () => {
      setColumnVisibility((prev) => {
        const next = { ...prev };
        table.getAllLeafColumns().forEach((col) => {
          if (col.columnDef?.meta?.hiddenOnMobile) {
            if (typeof prev[col.id] === "undefined") {
              next[col.id] = !mq.matches; // mobile => false, desktop => true
            }
          }
        });
        return next;
      });
    };

    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [table]);

  const visibleLeafColumnCount = table.getVisibleLeafColumns().length || 1;

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        </div>
      )}

      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        searchKey={searchKey}
        filters={filters}
        onAdd={onAdd}
        onExport={onExport}
        onImport={onImport}
        addButtonText={addButtonText}
        customActions={customActions}
      />

      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="min-w-[720px] sm:min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleLeafColumnCount}
                  className="h-24 text-center"
                >
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
