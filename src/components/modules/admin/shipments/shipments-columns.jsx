"use client";

import { Checkbox as Cb } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import { User, Euro, Package, PackageCheck, CreditCard } from "lucide-react";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
const formatCurrency = (amount) =>
  amount != null ? `${Number(amount).toFixed(2)}€` : "-";

const PaymentStatusBadge = ({ status }) => {
  const paymentConfig = {
    PENDING:  { label: "En attente", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    PARTIAL:  { label: "Partiel",    cls: "bg-amber-50 text-amber-700 border-amber-200" },
    PAID:     { label: "Payé",       cls: "bg-green-50 text-green-700 border-green-200" },
    CANCELLED:{ label: "Annulé",     cls: "bg-red-50 text-red-700 border-red-200" },
    REFUNDED: { label: "Remboursé",  cls: "bg-purple-50 text-purple-700 border-purple-200" },
  };
  const conf = paymentConfig[status] || paymentConfig.PENDING;
  return <Badge variant="outline" className={`${conf.cls} text-xs xs:text-sm`}>{conf.label}</Badge>;
};

export const shipmentsColumns = ({ onOpen, onEdit, onDelete, onRemit, onPay, onPrintReceipt }) => [
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

  // Expédition + Client (fusionnés, cliquable)
  {
    accessorKey: "shipmentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expédition / Client" />
    ),
    cell: ({ row }) => {
      const sh = row.original;
      const client = sh.client;
      return (
        <button
          onClick={() => onOpen?.(sh)}
          className="flex items-center gap-2 xs:gap-3 hover:underline text-left min-h-[44px] sm:min-h-auto"
          title="Ouvrir les détails"
        >
          <div className="p-1.5 xs:p-2 rounded-full bg-blue-50 flex-shrink-0">
            <Package className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm xs:text-base truncate">{sh.shipmentNumber}</div>
            <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {client?.firstName} {client?.lastName}
                {client?.clientCode ? ` · ${client.clientCode}` : ""}
              </span>
            </div>
          </div>
        </button>
      );
    },
  },

  // Nb colis
  {
    accessorKey: "packagesCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nb Colis" />
    ),
    cell: ({ row }) => (
      <span className="text-sm xs:text-base font-medium">{row.getValue("packagesCount") ?? 0}</span>
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

  // Paiement / Remise (actions rapides)
  {
    id: "remit",
    header: () => <span className="text-sm">Paiement / Remise</span>,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const sh = row.original;
      const remis = Boolean(sh.deliveredAt);
      const unpaid = !["PAID", "CANCELLED", "REFUNDED"].includes(sh.paymentStatus);
      const paid = sh.paymentStatus === "PAID";
      // Empêche la navigation vers le détail (clic de ligne)
      const stop = (fn) => (e) => {
        e.stopPropagation();
        fn();
      };
      return (
        <div className="flex items-center gap-2">
          {unpaid && (
            <Button
              size="sm"
              variant="outline"
              onClick={stop(() => onPay?.(sh))}
              className="h-8 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Payer
            </Button>
          )}
          {remis ? (
            <button
              onClick={stop(() => onRemit?.(sh))}
              title={`Remis le ${formatDate(sh.deliveredAt)}${sh.receivedBy ? ` à ${sh.receivedBy}` : ""}`}
              className="inline-flex items-center"
            >
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 cursor-pointer">
                <PackageCheck className="h-3 w-3 mr-1" />
                Remis
              </Badge>
            </button>
          ) : (
            // « Remettre » seulement si l'expédition est payée
            paid && (
              <Button
                size="sm"
                variant="outline"
                onClick={stop(() => onRemit?.(sh))}
                className="h-8 border-[#0E7A34]/30 text-[#0E7A34] hover:bg-[#0E7A34]/5 hover:text-[#0B5C28]"
              >
                <PackageCheck className="h-4 w-4 mr-1" />
                Remettre
              </Button>
            )
          )}
        </div>
      );
    },
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
            label: "Imprimer quittance",
            onClick: () => onPrintReceipt?.(row.original),
            icon: "Printer",
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
