"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import * as Icons from "lucide-react";

/**
 * Générique : passez vos handlers via props
 */
export function DataTableRowActions({ row, onEdit, onDelete, onView, customActions = [] }) {
  const handleView = (e) => {
    e.stopPropagation();
    onView?.(row.original);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(row.original);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(row.original);
  };

  const handleTriggerClick = (e) => {
    e.stopPropagation();
  };

  const handleCustomAction = (e, action) => {
    e.stopPropagation();
    action.onClick?.();
  };

  // Si customActions est fourni, on les utilise en priorité
  const hasCustomActions = customActions && customActions.length > 0;
  const hasStandardActions = (typeof onView === "function" || typeof onEdit === "function" || typeof onDelete === "function") && !hasCustomActions;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleTriggerClick}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ouvrir actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {hasCustomActions ? (
          // Afficher les actions personnalisées
          customActions.map((action, index) => {
            const IconComponent = action.icon && Icons[action.icon] ? Icons[action.icon] : null;
            const isDestructive = action.variant === "destructive";
            
            return (
              <DropdownMenuItem
                key={index}
                onClick={(e) => handleCustomAction(e, action)}
                className={`gap-2 ${isDestructive ? "text-red-600 focus:text-red-600" : ""}`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {action.label}
              </DropdownMenuItem>
            );
          })
        ) : (
          // Afficher les actions standard
          <>
            {typeof onView === "function" && (
              <DropdownMenuItem onClick={handleView} className="gap-2">
                <Eye className="h-4 w-4" /> Voir
              </DropdownMenuItem>
            )}
            {typeof onEdit === "function" && (
              <DropdownMenuItem onClick={handleEdit} className="gap-2">
                <Pencil className="h-4 w-4" /> Modifier
              </DropdownMenuItem>
            )}
            {typeof onDelete === "function" && (
              <DropdownMenuItem
                onClick={handleDelete}
                className="gap-2 text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
