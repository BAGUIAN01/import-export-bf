"use client";

import { Checkbox as Cb } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import { User, Phone, Mail, MapPin, Calendar, Euro, Package, Star } from "lucide-react";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) =>
  amount != null && amount !== "" ? `${Number(amount).toFixed(2)}€` : "-";
const initials = (c) =>
  `${c?.firstName?.[0] || ""}${c?.lastName?.[0] || ""}`.toUpperCase();

const StatusBadge = ({ isActive, isVip }) => {
  if (!isActive) {
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inactif</Badge>;
  }
  if (isVip) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        <Star className="h-3 w-3 mr-1" /> VIP
      </Badge>
    );
  }
  return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Actif</Badge>;
};

const CountryBadge = ({ country }) => {
  const conf = {
    France: { label: "France", color: "bg-blue-50 text-blue-700 border-blue-200" },
    "Burkina Faso": { label: "Burkina Faso", color: "bg-red-50 text-red-700 border-red-200" },
    "Côte d'Ivoire": { label: "Côte d'Ivoire", color: "bg-orange-50 text-orange-700 border-orange-200" },
  }[country] || { label: country || "Non défini", color: "bg-gray-50 text-gray-700 border-gray-200" };

  return <Badge variant="outline" className={conf.color}>{conf.label}</Badge>;
};

export const clientsColumns = ({ onEdit, onDelete, onView, onCreatePackage }) => [
  {
    id: "select",
    header: ({ table }) => (
      <Cb
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
    size: 36,
  },

  {
    accessorKey: "clientCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Code Client" />,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{initials(c)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium truncate">{c.clientCode}</div>
            <div className="text-xs text-muted-foreground truncate">{c.company || "Particulier"}</div>

            {/* Mobile: micro-infos */}
            <div className="sm:hidden mt-1 space-y-0.5">
              {c.phone ? (
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{c.phone}</span>
                </a>
              ) : null}
              {c.email ? (
                <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{c.email}</span>
                </a>
              ) : null}
              {c.recipientCity ? (
                <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{c.recipientCity}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },

  {
    id: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-full bg-blue-50"><User className="h-4 w-4 text-blue-600" /></div>
          <div className="min-w-0">
            <div className="font-medium truncate">{c.firstName} {c.lastName}</div>
            <div className="hidden sm:block text-xs text-muted-foreground truncate">{c.email || "Pas d'email"}</div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: "alphanumeric",
  },

  {
    accessorKey: "phone",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Téléphone" />,
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return phone ? (
        <a href={`tel:${phone}`} className="flex items-center gap-1" title={`Appeler ${phone}`}>
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{phone}</span>
        </a>
      ) : <span className="text-muted-foreground">-</span>;
    },
    enableSorting: false,
    meta: { hiddenOnMobile: true },
  },

  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      const email = row.getValue("email");
      return email ? (
        <a href={`mailto:${email}`} className="flex items-center gap-1 truncate" title={email}>
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm truncate">{email}</span>
        </a>
      ) : <span className="text-muted-foreground">-</span>;
    },
    enableSorting: true,
    meta: { hiddenOnMobile: true },
  },

  {
    accessorKey: "city",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ville" />,
    cell: ({ row }) => {
      const city = row.getValue("city");
      const country = row.original.country;
      return (
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="text-sm truncate">{city}</div>
            <div className="hidden sm:block text-xs text-muted-foreground truncate">{country}</div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  },

  {
    id: "recipient",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Destinataire BF" />,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{c.recipientName}</div>
          <div className="text-xs text-muted-foreground truncate">{c.recipientCity}</div>
          <div className="text-xs text-muted-foreground truncate">{c.recipientPhone}</div>
        </div>
      );
    },
    enableSorting: true,
    meta: { hiddenOnMobile: true },
  },

  {
    id: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Statut" />,
    cell: ({ row }) => {
      const c = row.original;
      return <StatusBadge isActive={c.isActive} isVip={c.isVip} />;
    },
    filterFn: (row, _id, value) => {
      const c = row.original;
      if (value.includes("active") && c.isActive) return true;
      if (value.includes("inactive") && !c.isActive) return true;
      if (value.includes("vip") && c.isVip) return true;
      return false;
    },
    enableSorting: false,
  },

  {
    accessorKey: "country",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pays" />,
    cell: ({ row }) => <CountryBadge country={row.getValue("country")} />,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: true,
    meta: { hiddenOnMobile: true },
  },

  {
    accessorKey: "totalSpent",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total Dépensé" />,
    cell: ({ row }) => {
      const amount = row.getValue("totalSpent");
      return (
        <div className="flex items-center gap-1">
          <Euro className="h-4 w-4 text-muted-foreground" />
          {formatCurrency(amount)}
        </div>
      );
    },
    enableSorting: true,
    meta: { hiddenOnMobile: true },
  },

  {
    id: "packagesCount",
    accessorFn: (r) => Number(r.packagesCount || 0),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nb Colis" />,
    cell: ({ row }) => {
      const count = Number(row.original.packagesCount || 0);
      return (
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{count}</span>
        </div>
      );
    },
    enableSorting: true,
    meta: { hiddenOnMobile: true },
  },

  {
    id: "createdAt",
    accessorFn: (r) => r.createdAt,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date création" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(row.original.createdAt)}
      </div>
    ),
    enableSorting: true,
    sortingFn: (a, b, id) =>
      new Date(a.original[id] ?? 0).getTime() - new Date(b.original[id] ?? 0).getTime(),
    meta: { hiddenOnMobile: true },
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
        className="sm:gap-1 [&_button]:h-9 [&_button]:w-9 sm:[&_button]:w-auto"
      />
    ),
    enableSorting: false,
  },
];
