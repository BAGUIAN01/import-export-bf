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
import { Skeleton } from "@/components/ui/skeleton";

export function CustomDataTable({
  data = [],
  columns = [],
  searchPlaceholder = "Filtrer...",
  searchLabel = "Rechercher",
  searchKey = "title",
  searchKeys = [],
  filters = [],
  initialFilters = {},
  onAdd,
  onExport,
  onExportPdf,
  addButtonText = "Ajouter",
  title,
  customActions = [],
  defaultHiddenColumns = [],
  onRowClick,
  loading = false,
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState(() => {
    const initialVisibility = {};
    defaultHiddenColumns.forEach(columnId => {
      initialVisibility[columnId] = false;
    });
    return initialVisibility;
  });
  const [columnFilters, setColumnFilters] = React.useState(() => {
    return Object.entries(initialFilters).map(([key, value]) => ({
      id: key,
      value: value
    }));
  });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const useGlobalSearch = searchKeys.length > 0;

  const globalFilterFn = React.useCallback((row, columnId, filterValue) => {
    if (!filterValue) return true;
    const search = filterValue.toLowerCase();
    return searchKeys.some((key) => {
      // Utiliser row.original pour éviter les erreurs sur les colonnes inexistantes
      let value = row.original;
      
      // Gérer les clés imbriquées (ex: "patient.nom", "medecin.nom")
      const keys = key.split('.');
      for (const k of keys) {
        if (value == null || value === undefined) return false;
        value = value[k];
      }
      
      if (value == null || value === undefined) return false;
      
      // Si c'est un objet avec libelle
      if (typeof value === "object" && value.libelle) {
        return String(value.libelle).toLowerCase().includes(search);
      }
      
      // Si c'est un objet avec nom et/ou prenom (médecin, patient, etc.)
      if (typeof value === "object" && (value.nom || value.prenom)) {
        const nom = String(value.nom || "").toLowerCase();
        const prenom = String(value.prenom || "").toLowerCase();
        const fullName = `${nom} ${prenom}`.trim();
        return fullName.includes(search) || nom.includes(search) || prenom.includes(search);
      }
      
      // Pour les autres valeurs, convertir en string et chercher
      return String(value).toLowerCase().includes(search);
    });
  }, [searchKeys]);

  // ✅ Stabiliser initialFilters avec useMemo et JSON.stringify pour comparaison profonde
  const initialFiltersKey = React.useMemo(
    () => JSON.stringify(initialFilters),
    [initialFilters]
  );

  React.useEffect(() => {
    const newFilters = Object.entries(initialFilters || {}).map(([key, value]) => ({
      id: key,
      value: value
    }));
    setColumnFilters(newFilters);
  }, [initialFiltersKey]); // ✅ Utiliser la clé stringifiée au lieu de l'objet

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter: useGlobalSearch ? globalFilter : undefined,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: useGlobalSearch ? setGlobalFilter : undefined,
    globalFilterFn: useGlobalSearch ? globalFilterFn : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: false,
    autoResetPageIndex: false,
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // Breakpoint tablette-first: masquer sur mobile (< 768px)
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      const next = {};
      table.getAllLeafColumns().forEach((col) => {
        if (col.columnDef?.meta?.hiddenOnMobile) {
          next[col.id] = !mq.matches;
        }
      });
      if (Object.keys(next).length) {
        setColumnVisibility((prev) => ({ ...prev, ...next }));
      }
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
        searchLabel={searchLabel}
        searchKey={searchKey}
        useGlobalSearch={useGlobalSearch}
        filters={filters}
        onAdd={onAdd}
        onExport={onExport}
        onExportPdf={onExportPdf}
        addButtonText={addButtonText}
        customActions={customActions}
      />

      <div className="rounded-md border border-gray-200 w-full overflow-x-auto bg-white">
        <Table className="min-w-[720px] sm:min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              // Skeleton loader
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: visibleLeafColumnCount }).map((_, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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

      {/* Pagination en bas du tableau */}
      <div className="mt-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}