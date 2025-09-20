"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Usage:
 * <DataTableColumnHeader column={column} title="Nom" />
 */
export function DataTableColumnHeader({ column, title, className }) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted(); // false | "asc" | "desc"

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={className || "h-8 -ml-3 px-2"}
    >
      {title}
      {sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}