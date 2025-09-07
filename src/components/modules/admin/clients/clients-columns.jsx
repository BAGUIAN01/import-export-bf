"use client";

import { Checkbox as Cb } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import { User, Phone, Mail, MapPin, Calendar, Euro, Package, Star } from "lucide-react";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) =>
  amount != null ? `${Number(amount).toFixed(2)}€` : "-";
const initials = (client) =>
  `${client?.firstName?.[0] || ""}${client?.lastName?.[0] || ""}`.toUpperCase();

const StatusBadge = ({ isActive, isVip }) => {
  if (!isActive) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Inactif
      </Badge>
    );
  }
  
  if (isVip) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Star className="h-3 w-3 mr-1" />
        VIP
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      Actif
    </Badge>
  );
};

const CountryBadge = ({ country }) => {
  const countryConfig = {
    "France": { label: "France", color: "bg-blue-50 text-blue-700 border-blue-200" },
    "Burkina Faso": { label: "Burkina Faso", color: "bg-red-50 text-red-700 border-red-200" },
    "Côte d'Ivoire": { label: "Côte d'Ivoire", color: "bg-orange-50 text-orange-700 border-orange-200" },
  };

  const config = countryConfig[country] || { 
    label: country || "Non défini", 
    color: "bg-gray-50 text-gray-700 border-gray-200" 
  };
  
  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
};

export const clientsColumns = ({ onEdit, onDelete, onView, onCreatePackage }) => [
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
    accessorKey: "clientCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code Client" />
    ),
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {initials(client)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{client.clientCode}</div>
            <div className="text-xs text-muted-foreground">
              {client.company || "Particulier"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-blue-50">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">
              {client.firstName} {client.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {client.email || "Pas d'email"}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Téléphone" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return (
        <div className="flex items-center gap-1">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{phone}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email");
      return email ? (
        <div className="flex items-center gap-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{email}</span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ville" />
    ),
    cell: ({ row }) => {
      const city = row.getValue("city");
      const country = row.original.country;
      return (
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm">{city}</div>
            <div className="text-xs text-muted-foreground">{country}</div>
          </div>
        </div>
      );
    },
  },
  {
    id: "recipient",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Destinataire BF" />
    ),
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div>
          <div className="text-sm font-medium">{client.recipientName}</div>
          <div className="text-xs text-muted-foreground">
            {client.recipientCity}
          </div>
          <div className="text-xs text-muted-foreground">
            {client.recipientPhone}
          </div>
        </div>
      );
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Statut" />
    ),
    cell: ({ row }) => {
      const client = row.original;
      return <StatusBadge isActive={client.isActive} isVip={client.isVip} />;
    },
    filterFn: (row, id, value) => {
      const client = row.original;
      if (value.includes("active") && client.isActive) return true;
      if (value.includes("inactive") && !client.isActive) return true;
      if (value.includes("vip") && client.isVip) return true;
      return false;
    },
  },
  {
    accessorKey: "country",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Pays" />
    ),
    cell: ({ row }) => <CountryBadge country={row.getValue("country")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: "totalSpent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Dépensé" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalSpent");
      return (
        <div className="flex items-center gap-1">
          <Euro className="h-4 w-4 text-muted-foreground" />
          {formatCurrency(amount)}
        </div>
      );
    },
  },
  {
    id: "packagesCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nb Colis" />
    ),
    cell: ({ row }) => {
      const count = row.original.packagesCount || 0;
      return (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{count}</span>
        </div>
      );
    },
  },
  {
    id: "createdAt",
    accessorFn: (row) => row.createdAt,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date création" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.original.createdAt)}
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
            label: "Nouveau Colis",
            onClick: () => onCreatePackage?.(row.original),
            icon: "Package",
          },
        ]}
      />
    ),
  },
];