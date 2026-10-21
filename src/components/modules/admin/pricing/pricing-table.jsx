"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { CustomDataTable } from "@/components/modules/data-table/data-table";
import { usePricing } from "@/hooks/use-pricing";
import { PricingDialog } from "./pricing-dialog";
import {
  categoryOptions,
  counterOptions,
  getPricingColumns,
  photoOptions,
  priceModeOptions,
  siteOptions,
} from "./pricing-columns";

export function PricingTable() {
  const { rows, fromDb, isLoading, error, photoStorageReady, mutate } = usePricing();
  const [editing, setEditing] = useState(undefined); // undefined = fermé, null = nouvel article

  const toggleSite = async (row) => {
    const next = !row.showOnWebsite;
    try {
      const res = await fetch(`/api/pricing/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnWebsite: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Modification impossible");
      }
      toast.success(next ? `« ${row.name} » est affiché sur le site` : `« ${row.name} » est masqué du site`);
      mutate();
    } catch (e) {
      toast.error(e.message === "Failed to fetch" ? "Pas de réseau : rien n'a été modifié." : e.message);
    }
  };

  const columns = useMemo(
    () =>
      getPricingColumns({
        onEdit: (row) => setEditing(row),
        onToggleSite: toggleSite,
        showThumbs: photoStorageReady,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photoStorageReady]
  );

  const counts = useMemo(() => {
    const onSite = rows.filter((r) => r.showOnWebsite).length;
    const quote = rows.filter((r) => r.priceMode === "QUOTE").length;
    const noPhoto = rows.filter((r) => !r.imageUrl).length;
    return { total: rows.length, onSite, quote, noPhoto };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Ces prix sont ceux de la <b>caisse</b>, du <b>formulaire de colis</b> et de la{" "}
          <b>grille tarifaire du site public</b>. Un prix modifié s&apos;applique tout de suite aux
          nouveaux colis. Les colis déjà enregistrés gardent le prix de leur enregistrement.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Les tarifs n&apos;ont pas pu être chargés : {error.message}. Rechargez la page quand la
          connexion revient.
        </p>
      )}
      {!isLoading && !error && !fromDb && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La grille est vide en base : la mise à jour de la base (migration « pricing_catalog »)
          n&apos;a pas encore été appliquée. La caisse utilise en attendant les prix d&apos;origine.
        </p>
      )}

      {fromDb && (
        <p className="text-sm text-muted-foreground">
          {counts.total} articles · {counts.onSite} sur le site · {counts.quote} sur devis
          {photoStorageReady ? ` · ${counts.noPhoto} sans photo` : ""}
        </p>
      )}

      <CustomDataTable
        data={rows}
        columns={columns}
        loading={isLoading}
        searchLabel="Rechercher un article"
        searchKeys={["name", "description", "type"]}
        filters={[
          { key: "category", title: "Catégorie", options: categoryOptions },
          { key: "priceMode", title: "Type de prix", options: priceModeOptions },
          { key: "site", title: "Site public", options: siteOptions },
          { key: "counter", title: "Caisse", options: counterOptions },
          ...(photoStorageReady ? [{ key: "photo", title: "Photo", options: photoOptions }] : []),
        ]}
        defaultHiddenColumns={["photo"]}
        onAdd={fromDb ? () => setEditing(null) : undefined}
        addButtonText="Ajouter un article"
        customActions={[
          {
            label: "Voir la grille du site",
            icon: "ExternalLink",
            onClick: () => window.open("/#tarifs", "_blank", "noopener"),
          },
        ]}
        onRowClick={(row) => setEditing(row)}
      />

      <PricingDialog
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
        row={editing ?? null}
        photoStorageReady={photoStorageReady}
        onSaved={() => mutate()}
      />
    </div>
  );
}
