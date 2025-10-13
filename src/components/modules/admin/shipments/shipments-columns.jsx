"use client";

import { Checkbox as Cb } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import { Truck, User, Calendar, Euro, Package } from "lucide-react";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) =>
  amount != null ? `${Number(amount).toFixed(2)}€` : "-";
const initials = (client) =>
  `${client?.firstName?.[0] || ""}${client?.lastName?.[0] || ""}`.toUpperCase();

const PaymentStatusBadge = ({ status }) => {
  const paymentConfig = {
    PENDING:  { label: "En attente", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    PARTIAL:  { label: "Partiel",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
    PAID:     { label: "Payé",       cls: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED:{ label: "Annulé",     cls: "bg-red-50 text-red-700 border-red-200" },
    REFUNDED: { label: "Remboursé",  cls: "bg-purple-50 text-purple-700 border-purple-200" },
  };
  const conf = paymentConfig[status] || paymentConfig.PENDING;
  return <Badge variant="outline" className={`${conf.cls} text-xs xs:text-sm`}>{conf.label}</Badge>;
};

const ContainerStatusBadge = ({ status }) => {
  const map = {
    PREPARATION: { label: "Préparation", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    LOADED:      { label: "Chargé",      cls: "bg-blue-50 text-blue-700 border-blue-200" },
    IN_TRANSIT:  { label: "En transit",  cls: "bg-orange-50 text-orange-700 border-orange-200" },
    CUSTOMS:     { label: "Douanes",     cls: "bg-red-50 text-red-700 border-red-200" },
    DELIVERED:   { label: "Livré",       cls: "bg-green-50 text-green-700 border-green-200" },
  };
  const conf = map[status] || { label: status || "-", cls: "bg-slate-50 text-slate-700 border-slate-200" };
  return <Badge variant="outline" className={`${conf.cls} text-xs xs:text-sm`}>{conf.label}</Badge>;
};

export const shipmentsColumns = ({ onOpen, onEdit, onDelete }) => [
  // Sélecteur
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

  // N° Expédition (clickable)
  {
    accessorKey: "shipmentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="N° Expédition" />
    ),
    cell: ({ row }) => {
      const sh = row.original;
      return (
        <button
          onClick={() => onOpen?.(sh)}
          className="flex items-center gap-2 xs:gap-3 hover:underline min-h-[44px] sm:min-h-auto"
          title="Ouvrir les détails"
        >
          <div className="p-1.5 xs:p-2 rounded-full bg-blue-50 flex-shrink-0">
            <Package className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600" />
          </div>
          <div className="font-medium text-sm xs:text-base truncate">{sh.shipmentNumber}</div>
        </button>
      );
    },
  },

  // Client
  {
    id: "client",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => {
      const client = row.original.client;
      return (
        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
          <Avatar className="h-6 w-6 xs:h-8 xs:w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">{initials(client)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium flex items-center gap-1 xs:gap-2 text-sm xs:text-base">
              <User className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
              <span className="truncate">{client?.firstName} {client?.lastName}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">{client?.clientCode}</div>
          </div>
        </div>
      );
    },
  },

  // Conteneur (étiquette)
  {
    accessorKey: "containerLabel",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Conteneur" />
    ),
    cell: ({ row }) => {
      const sh = row.original;
      return (
        <div className="flex items-center gap-1 xs:gap-2 min-w-0">
          <Truck className="h-3 w-3 xs:h-4 xs:w-4 text-muted-foreground flex-shrink-0" />
          <span className="max-w-[120px] xs:max-w-[180px] truncate text-sm xs:text-base">
            {sh.containerLabel || "-"}
          </span>
        </div>
      );
    },
  },

  // 👉 Colonne technique pour filtrer par statut conteneur
  {
    accessorKey: "containerStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Statut conteneur" />
    ),
    cell: ({ row }) => <ContainerStatusBadge status={row.getValue("containerStatus")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },

  // Quantités/compte
  {
    accessorKey: "packagesCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nb Colis" />
    ),
    cell: ({ row }) => (
      <span className="text-sm xs:text-base font-medium">{row.getValue("packagesCount") ?? 0}</span>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Qté totale" />
    ),
    cell: ({ row }) => (
      <span className="text-sm xs:text-base font-medium">{row.getValue("totalQuantity") ?? 0}</span>
    ),
  },

  // Montants
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Montant" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Euro className="h-3 w-3 xs:h-4 xs:w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm xs:text-base font-medium">{formatCurrency(row.getValue("totalAmount"))}</span>
      </div>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Payé" />
    ),
    cell: ({ row }) => (
      <span className="text-sm xs:text-base font-medium">{formatCurrency(row.getValue("paidAmount"))}</span>
    ),
  },

  // Paiement
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Paiement" />
    ),
    cell: ({ row }) => <PaymentStatusBadge status={row.getValue("paymentStatus")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },

  // Dates
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Création" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3 xs:h-4 xs:w-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm xs:text-base">{formatDate(row.getValue("createdAt"))}</span>
      </div>
    ),
  },

  // Actions
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        onView={() => onOpen?.(row.original)}
        customActions={[
          {
            label: "Ouvrir",
            onClick: () => onOpen?.(row.original),
            icon: "Eye",
          },
          {
            label: "Modifier",
            onClick: () => onEdit?.(row.original),
            icon: "Edit",
          },
          {
            label: "Supprimer",
            onClick: () => onDelete?.(row.original),
            icon: "Trash2",
            variant: "destructive",
          },
        ]}
      />
    ),
  },
];
