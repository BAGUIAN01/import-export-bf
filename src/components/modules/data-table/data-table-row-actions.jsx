"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

/**
 * Générique : passez vos handlers via props
 */
export function DataTableRowActions({ row, onEdit, onDelete, onView }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ouvrir actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {typeof onView === "function" && (
          <DropdownMenuItem onClick={() => onView(row.original)} className="gap-2">
            <Eye className="h-4 w-4" /> Voir
          </DropdownMenuItem>
        )}
        {typeof onEdit === "function" && (
          <DropdownMenuItem onClick={() => onEdit(row.original)} className="gap-2">
            <Pencil className="h-4 w-4" /> Modifier
          </DropdownMenuItem>
        )}
        {typeof onDelete === "function" && (
          <DropdownMenuItem
            onClick={() => onDelete(row.original)}
            className="gap-2 text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
