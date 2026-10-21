"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SelectItem } from "@/components/ui/select";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { ImageUploader } from "@/components/ui/image-uploader";
import { cn } from "@/lib/utils";
import { resizeImage } from "@/lib/utils/image-resize";
import {
  PRICE_MODES,
  PRICING_CATEGORIES,
  categoryLabel,
  formatSitePrice,
} from "@/lib/data/pricing-catalog";

const EMPTY = {
  name: "",
  description: "",
  category: "",
  priceMode: "FIXED",
  basePrice: "",
  priceProvince: "",
  showOnWebsite: true,
  isActive: true,
};

function formFromRow(row) {
  if (!row) return EMPTY;
  return {
    name: row.name ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    priceMode: row.priceMode ?? "FIXED",
    basePrice: row.priceMode === "QUOTE" ? "" : String(row.basePrice ?? ""),
    priceProvince: row.priceProvince == null ? "" : String(row.priceProvince),
    showOnWebsite: row.showOnWebsite ?? true,
    isActive: row.isActive ?? true,
  };
}

const toNumber = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

async function readError(res, fallback) {
  const body = await res.json().catch(() => ({}));
  return { message: body.error || fallback, errors: body.errors || {} };
}

// FloatingLabelInput colore le champ en rouge mais n'écrit pas le message.
function FieldError({ children }) {
  return children ? <p className="mt-1 px-1 text-xs text-red-500">{children}</p> : null;
}

function SwitchRow({ id, label, hint, checked, onCheckedChange }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 min-h-12 cursor-pointer"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

export function PricingDialog({ open, onOpenChange, row, photoStorageReady, onSaved }) {
  const isNew = !row;
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null); // { file, url, isLocal } choisi dans ce dialogue
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(formFromRow(row));
    setPhoto(null);
    setRemovePhoto(false);
    setErrors({});
  }, [open, row]);

  // Libère l'aperçu local quand on en choisit un autre ou qu'on ferme
  useEffect(() => {
    return () => {
      if (photo?.isLocal) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const quote = form.priceMode === "QUOTE";
  const currentPhotoUrl = photo?.url ?? (removePhoto ? null : row?.imageUrl ?? null);

  // Aperçu de la ligne telle que le site l'écrira
  const preview = formatSitePrice({
    priceMode: form.priceMode,
    basePrice: toNumber(form.basePrice) ?? 0,
    priceProvince: toNumber(form.priceProvince),
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Le nom de l'article est requis";
    if (!form.category) e.category = "Choisissez une catégorie";
    if (!quote) {
      const base = toNumber(form.basePrice);
      if (base == null || Number.isNaN(base)) e.basePrice = "Indiquez le prix Région parisienne";
      else if (base < 0) e.basePrice = "Le prix ne peut pas être négatif";
      const prov = toNumber(form.priceProvince);
      if (Number.isNaN(prov)) e.priceProvince = "Prix Province invalide";
      else if (prov != null && prov < 0) e.priceProvince = "Le prix ne peut pas être négatif";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        category: form.category,
        priceMode: form.priceMode,
        basePrice: quote ? null : form.basePrice,
        priceProvince: quote ? null : form.priceProvince,
        showOnWebsite: form.showOnWebsite,
        isActive: form.isActive,
      };
      const res = await fetch(isNew ? "/api/pricing" : `/api/pricing/${row.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const { message, errors: fieldErrors } = await readError(res, "Impossible d'enregistrer le tarif");
        setErrors(fieldErrors);
        toast.error(message);
        return;
      }
      const saved = (await res.json()).data;

      // La photo part après le tarif : un échec d'envoi ne fait pas perdre le prix.
      let photoWarning = null;
      if (photo?.file) {
        try {
          const blob = await resizeImage(photo.file);
          const fd = new FormData();
          fd.append("file", blob, `photo.${blob.type === "image/webp" ? "webp" : "jpg"}`);
          const up = await fetch(`/api/pricing/${saved.id}/image`, { method: "POST", body: fd });
          if (!up.ok) {
            const { message } = await readError(up, "La photo n'a pas pu être envoyée");
            photoWarning = `Tarif enregistré. ${message}`;
          }
        } catch {
          photoWarning = "Tarif enregistré. La photo n'a pas pu être préparée : essayez une autre image.";
        }
      } else if (removePhoto && row?.imageUrl) {
        const del = await fetch(`/api/pricing/${saved.id}/image`, { method: "DELETE" });
        if (!del.ok) photoWarning = "Tarif enregistré. La photo n'a pas pu être retirée.";
      }

      if (photoWarning) toast.warning(photoWarning);
      else toast.success(isNew ? "Article ajouté" : "Tarif enregistré");
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("Pas de réseau : le tarif n'a pas été enregistré. Réessayez quand la connexion revient.");
    } finally {
      setSaving(false);
    }
  };

  const updatedAt = row?.updatedAt ? new Date(row.updatedAt) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {isNew ? "Ajouter un article" : "Modifier le tarif"}
          </DialogTitle>
          <DialogDescription>
            {isNew ? "Il apparaîtra à la caisse et, si vous le voulez, sur le site." : categoryLabel(row.category)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Photo</p>
            {photoStorageReady ? (
              <div className="flex flex-wrap items-center gap-2">
                <ImageUploader
                  value={currentPhotoUrl ? { url: currentPhotoUrl } : null}
                  onChange={(v) => {
                    setPhoto(v);
                    setRemovePhoto(false);
                  }}
                  label={currentPhotoUrl ? "Changer la photo" : "Importer une photo"}
                />
                {currentPhotoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setPhoto(null);
                      setRemovePhoto(true);
                    }}
                  >
                    Retirer la photo
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-md bg-muted px-3 py-2">
                Les photos s'ajouteront ici une fois le stockage Cloudflare R2 branché sur le site.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FloatingLabelInput
                id="pricing-name"
                label="Nom de l'article"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                error={errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </div>
            <FloatingLabelSelect
              id="pricing-category"
              label="Catégorie"
              value={form.category}
              onValueChange={set("category")}
              error={errors.category}
            >
              {PRICING_CATEGORIES.map((c) => (
                <SelectItem key={c.key} value={c.key}>
                  {c.label}
                </SelectItem>
              ))}
            </FloatingLabelSelect>
          </div>

          <div>
            <FloatingLabelInput
              id="pricing-description"
              label="Détail (facultatif)"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              error={errors.description}
            />
            <FieldError>{errors.description}</FieldError>
          </div>

          {/* Type de prix */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Type de prix</p>
            <div role="radiogroup" aria-label="Type de prix" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {Object.entries(PRICE_MODES).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={form.priceMode === value}
                  onClick={() => set("priceMode")(value)}
                  className={cn(
                    "h-10 rounded-md text-sm font-medium transition-colors",
                    form.priceMode === value
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {quote ? (
            <div className="rounded-md bg-amber-50 text-amber-900 px-3 py-2.5 text-sm">
              <b>Pas de prix affiché.</b> Le site écrit « Sur devis » et invite à appeler. À la caisse, le
              prix se saisit à la main au moment de la commande, comme aujourd'hui.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FloatingLabelInput
                  id="pricing-base"
                  label={form.priceMode === "FROM" ? "À partir de (€)" : "Région parisienne (€)"}
                  inputMode="decimal"
                  value={form.basePrice}
                  onChange={(e) => set("basePrice")(e.target.value)}
                  error={errors.basePrice}
                />
                <FieldError>{errors.basePrice}</FieldError>
              </div>
              <div className="space-y-1">
                <FloatingLabelInput
                  id="pricing-province"
                  label="Province (€)"
                  inputMode="decimal"
                  value={form.priceProvince}
                  onChange={(e) => set("priceProvince")(e.target.value)}
                  error={errors.priceProvince}
                />
                {errors.priceProvince ? (
                  <FieldError>{errors.priceProvince}</FieldError>
                ) : (
                  <p className="px-1 text-xs text-muted-foreground">Vide : même prix partout.</p>
                )}
              </div>
            </div>
          )}

          <SwitchRow
            id="pricing-site"
            label="Afficher sur le site public"
            hint="Dans la grille tarifaire de la page d'accueil"
            checked={form.showOnWebsite}
            onCheckedChange={set("showOnWebsite")}
          />
          <SwitchRow
            id="pricing-counter"
            label="Proposer à la caisse"
            hint="Et dans le formulaire de colis"
            checked={form.isActive}
            onCheckedChange={set("isActive")}
          />

          <div className="rounded-lg border border-dashed border-green-300 bg-green-50/40 p-3 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Aperçu sur le site
            </p>
            {form.showOnWebsite ? (
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate">{form.name || "Nom de l'article"}</span>
                <span
                  className={cn(
                    "font-semibold whitespace-nowrap",
                    quote ? "italic text-amber-600" : "text-[#0E7A34]"
                  )}
                >
                  {preview}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Masqué : cet article n'apparaît pas sur le site.</p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-muted-foreground order-last sm:order-first">
            {updatedAt
              ? `Modifié le ${updatedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}${row.updatedByName ? ` par ${row.updatedByName}` : ""}`
              : "Les colis déjà enregistrés gardent leur prix."}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNew ? "Ajouter l'article" : "Enregistrer le tarif"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
