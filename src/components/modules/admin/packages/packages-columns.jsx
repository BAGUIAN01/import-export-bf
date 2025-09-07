"use client";

import { Checkbox as Cb } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import { Package, User, MapPin, Calendar, Weight, Euro } from "lucide-react";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) =>
  amount != null ? `${Number(amount).toFixed(2)}€` : "-";
const initials = (client) =>
  `${client?.firstName?.[0] || ""}${client?.lastName?.[0] || ""}`.toUpperCase();

const StatusBadge = ({ status }) => {
  const statusConfig = {
    REGISTERED: {
      label: "Enregistré",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    COLLECTED: {
      label: "Collecté",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    IN_CONTAINER: {
      label: "En conteneur",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    IN_TRANSIT: {
      label: "En transit",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    CUSTOMS: { label: "Douanes", color: "bg-red-50 text-red-700 border-red-200" },
    DELIVERED: {
      label: "Livré",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    RETURNED: {
      label: "Retourné",
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
    CANCELLED: {
      label: "Annulé",
      color: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const config = statusConfig[status] || statusConfig.REGISTERED;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    LOW: { label: "Faible", color: "bg-gray-50 text-gray-600" },
    NORMAL: { label: "Normal", color: "bg-blue-50 text-blue-600" },
    HIGH: { label: "Élevé", color: "bg-orange-50 text-orange-600" },
    URGENT: { label: "Urgent", color: "bg-red-50 text-red-600" },
  };

  const config = priorityConfig[priority] || priorityConfig.NORMAL;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

const PaymentStatusBadge = ({ status }) => {
  const paymentConfig = {
    PENDING: {
      label: "En attente",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    PARTIAL: {
      label: "Partiel",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    PAID: { label: "Payé", color: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED: {
      label: "Annulé",
      color: "bg-red-50 text-red-700 border-red-200",
    },
    REFUNDED: {
      label: "Remboursé",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
  };

  const config = paymentConfig[status] || paymentConfig.PENDING;
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

const TypeBadge = ({ type }) => {
  const map = {
    CARTON: "Carton",
    BARRIQUE: "Barrique",
    VEHICLE: "Véhicule",
    MOTORCYCLE: "Moto",
    ELECTRONICS: "Électronique",
    CLOTHING: "Vêtements",
    FOOD: "Alimentation",
    DOCUMENTS: "Documents",
    OTHER: "Autre",
  };
  return (
    <Badge
      variant="outline"
      className="bg-slate-50 text-slate-700 border-slate-200"
    >
      {map[type] || type || "-"}
    </Badge>
  );
};

export const packagesColumns = ({ onEdit, onDelete, onView, onTrack }) => [
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
    accessorKey: "packageNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="N° Colis" />
    ),
    cell: ({ row }) => {
      const pkg = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-50">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{pkg.packageNumber}</div>
            <div className="text-xs text-muted-foreground">{pkg.type}</div>
          </div>
        </div>
      );
    },
  },
  {
    id: "client",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => {
      const pkg = row.original;
      const client = pkg.client;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {initials(client)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {client?.firstName} {client?.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {client?.clientCode}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description");
      return (
        <div className="max-w-[200px]">
          <p className="truncate">{description}</p>
        </div>
      );
    },
  },
  // ---- NOUVELLE COLONNE TYPE (pour que le filtre 'type' fonctionne) ----
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => <TypeBadge type={row.getValue("type")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  // ----------------------------------------------------------------------
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Statut" />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priorité" />
    ),
    cell: ({ row }) => <PriorityBadge priority={row.getValue("priority")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "weight",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Poids" />
    ),
    cell: ({ row }) => {
      const weight = row.getValue("weight");
      return weight ? (
        <div className="flex items-center gap-1">
          <Weight className="h-4 w-4 text-muted-foreground" />
          {weight} kg
        </div>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount");
      return (
        <div className="flex items-center gap-1">
          <Euro className="h-4 w-4 text-muted-foreground" />
          {formatCurrency(amount)}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Paiement" />
    ),
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.getValue("paymentStatus")} />
    ),
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: "destination",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Destination" />
    ),
    cell: ({ row }) => {
      const pkg = row.original;
      return (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[150px] truncate">
            {pkg.client?.recipientCity || "Non défini"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date création" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.getValue("createdAt"))}
      </div>
    ),
  },
  {
    accessorKey: "estimatedDelivery",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Livraison prévue" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.getValue("estimatedDelivery"))}
      </div>
    ),
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
            label: "Suivi",
            onClick: () => onTrack?.(row.original),
            icon: "MapPin",
          },
        ]}
      />
    ),
  },
];
