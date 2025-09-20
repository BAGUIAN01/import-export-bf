"use client";

import * as React from "react";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function DataTableViewOptions({ table, defaultHiddenColumns = [] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden sm:flex">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Affichage
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide?.())
          .map((column) => {
            // Déterminer si la colonne doit être cochée par défaut
            const shouldBeVisible = !defaultHiddenColumns.includes(column.id);
            
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {/* Amélioration de l'affichage du nom de colonne */}
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

