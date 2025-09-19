"use client";

import { Checkbox as Cb } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import { Container, MapPin, Calendar, Truck, Weight, Users } from "lucide-react";
import Link from "next/link";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) => (amount ? `${amount.toFixed(2)}€` : "-");

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PREPARATION: { label: "Préparation", color: "bg-blue-50 text-blue-700 border-blue-200" },
    LOADED: { label: "Chargé", color: "bg-purple-50 text-purple-700 border-purple-200" },
    IN_TRANSIT: { label: "En transit", color: "bg-orange-50 text-orange-700 border-orange-200" },
    CUSTOMS: { label: "Douanes", color: "bg-red-50 text-red-700 border-red-200" },
    DELIVERED: { label: "Livré", color: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED: { label: "Annulé", color: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  const config = statusConfig[status] || statusConfig.PREPARATION;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

export const containersColumns = ({ onEdit, onDelete, onView, onTrack }) => [
  {
    id: "select",
    header: ({ table }) => (
      <Cb
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Tout sélectionner"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Cb
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Sélectionner la ligne"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "containerNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="N° Conteneur" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      return (
        <Link 
          href={`/admin/containers/${container.id}`}
          className="flex items-center gap-3 hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
        >
          <div className="p-2 rounded-full bg-blue-50">
            <Container className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-blue-600 hover:text-blue-800">
              {container.containerNumber}
            </div>
            <div className="text-xs text-muted-foreground">
              {container.name}
            </div>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Statut" />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "capacity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Chargement" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      const percentage = container.capacity > 0 ? 
        Math.round((container.currentLoad / container.capacity) * 100) : 0;
      
      return (
        <div className="space-y-2 min-w-[120px]">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {container.currentLoad}/{container.capacity}
            </span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      );
    },
  },
  {
    id: "weight",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Poids" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      return container.currentWeight ? (
        <div className="flex items-center gap-1">
          <Weight className="h-4 w-4 text-muted-foreground" />
          <span>{container.currentWeight.toFixed(1)} kg</span>
          {container.maxWeight && (
            <span className="text-xs text-muted-foreground">
              / {container.maxWeight.toFixed(0)} kg
            </span>
          )}
        </div>
      ) : "-";
    },
  },
  {
    id: "location",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Localisation" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate">
            {container.currentLocation || container.origin}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "departureDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Départ" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.getValue("departureDate"))}
      </div>
    ),
  },
  {
    accessorKey: "arrivalDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Arrivée prévue" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.getValue("arrivalDate"))}
      </div>
    ),
  },
  {
    id: "transport",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Transport" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      return container.transportCompany ? (
        <div className="flex items-center gap-1">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[120px] truncate">
            {container.transportCompany}
          </span>
        </div>
      ) : "-";
    },
  },
  {
    id: "cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Coût total" />
    ),
    cell: ({ row }) => {
      const container = row.original;
      const totalCost = container.totalCost || 
        ((container.transportCost || 0) + (container.customsCost || 0));
      return totalCost > 0 ? formatCurrency(totalCost) : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        customActions={[
          {
            label: "Suivi GPS",
            onClick: () => onTrack?.(row.original),
            icon: "MapPin",
          },
        ]}
      />
    ),
  },
];