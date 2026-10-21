"use client";

import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/modules/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/modules/data-table/data-table-row-actions";
import {
  PRICING_CATEGORIES,
  categoryLabel,
  comparePricing,
  formatEuro,
  formatSitePrice,
} from "@/lib/data/pricing-catalog";

export function PricingThumb({ url, size = 40, className }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className={cn("rounded-md object-cover bg-muted shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn(
        "rounded-md border border-dashed border-zinc-300 bg-muted text-zinc-400 grid place-items-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Pas de photo"
    >
      <ImageIcon className="h-4 w-4" />
    </span>
  );
}

export function SitePrice({ row }) {
  if (!row.showOnWebsite) {
    return <span className="text-muted-foreground">pas sur le site</span>;
  }
  const quote = row.priceMode === "QUOTE";
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        quote ? "italic text-amber-600" : "text-[#0E7A34]"
      )}
    >
      {formatSitePrice(row)}
    </span>
  );
}

const includes = (row, id, value) => value.includes(row.getValue(id));

export const categoryOptions = PRICING_CATEGORIES.map((c) => ({ label: c.label, value: c.key }));
export const priceModeOptions = [
  { label: "Prix fixe", value: "FIXED" },
  { label: "À partir de", value: "FROM" },
  { label: "Sur devis", value: "QUOTE" },
];
export const siteOptions = [
  { label: "Affiché", value: "yes" },
  { label: "Masqué", value: "no" },
];
export const counterOptions = [
  { label: "Proposé", value: "yes" },
  { label: "Retiré", value: "no" },
];
export const photoOptions = [
  { label: "Avec photo", value: "yes" },
  { label: "Sans photo", value: "no" },
];

// `showThumbs` : sans stockage de photos branché, 55 cases vides n'apprennent rien.
export function getPricingColumns({ onEdit, onToggleSite, showThumbs }) {
  return [
    {
      id: "name",
      accessorFn: (r) => r.name,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Article" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            {(showThumbs || r.imageUrl) && <PricingThumb url={r.imageUrl} />}
            <div className="min-w-0">
              <div className="font-medium truncate">{r.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {/* Sur téléphone, les autres colonnes sont masquées : on garde l'essentiel ici */}
                <span className="md:hidden">{categoryLabel(r.category)}{r.description ? " · " : ""}</span>
                {r.description}
              </div>
              <div className="md:hidden text-sm">
                <SitePrice row={r} />
              </div>
            </div>
          </div>
        );
      },
      sortingFn: (a, b) => String(a.original.name).localeCompare(String(b.original.name), "fr"),
      enableSorting: true,
    },
    {
      id: "category",
      accessorFn: (r) => r.category,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Catégorie" />,
      cell: ({ row }) => <span className="text-zinc-600">{categoryLabel(row.original.category)}</span>,
      sortingFn: (a, b) => comparePricing(a.original, b.original),
      filterFn: includes,
      enableSorting: true,
      meta: { hiddenOnMobile: true },
    },
    {
      id: "basePrice",
      accessorFn: (r) => (r.priceMode === "QUOTE" ? -1 : r.basePrice),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Région parisienne" />
      ),
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="text-right tabular-nums">
            {r.priceMode === "QUOTE" ? <span className="text-zinc-400">—</span> : formatEuro(r.basePrice)}
          </div>
        );
      },
      enableSorting: true,
      meta: { hiddenOnMobile: true },
    },
    {
      id: "priceProvince",
      accessorFn: (r) => r.priceProvince ?? -1,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Province" />,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="text-right tabular-nums">
            {r.priceProvince == null || r.priceMode === "QUOTE" ? (
              <span className="text-zinc-400">—</span>
            ) : (
              formatEuro(r.priceProvince)
            )}
          </div>
        );
      },
      enableSorting: true,
      meta: { hiddenOnMobile: true },
    },
    {
      id: "priceMode",
      accessorFn: (r) => r.priceMode,
      header: "Sur le site, se lit",
      cell: ({ row }) => <SitePrice row={row.original} />,
      filterFn: includes,
      enableSorting: false,
      meta: { hiddenOnMobile: true },
    },
    {
      id: "site",
      accessorFn: (r) => (r.showOnWebsite ? "yes" : "no"),
      header: "Site public",
      cell: ({ row }) =>
        row.original.showOnWebsite ? (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Affiché</Badge>
        ) : (
          <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200">Masqué</Badge>
        ),
      filterFn: includes,
      enableSorting: false,
      meta: { hiddenOnMobile: true },
    },
    {
      id: "counter",
      accessorFn: (r) => (r.isActive ? "yes" : "no"),
      header: "Caisse",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Proposé</Badge>
        ) : (
          <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200">Retiré</Badge>
        ),
      filterFn: includes,
      enableSorting: false,
      meta: { hiddenOnMobile: true },
    },
    {
      // Colonne cachée : ne sert qu'au filtre « Photo »
      id: "photo",
      accessorFn: (r) => (r.imageUrl ? "yes" : "no"),
      header: "Photo",
      filterFn: includes,
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DataTableRowActions
            row={row}
            customActions={[
              { label: "Modifier", icon: "Pencil", onClick: () => onEdit(row.original) },
              row.original.showOnWebsite
                ? { label: "Masquer du site", icon: "EyeOff", onClick: () => onToggleSite(row.original) }
                : { label: "Afficher sur le site", icon: "Eye", onClick: () => onToggleSite(row.original) },
            ]}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
