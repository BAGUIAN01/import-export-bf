"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { Interrupteur } from "@/components/caisse/interrupteur";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelPhoneInput } from "@/components/ui/floating-label-phone-input";
import { DEVISES, PARITES_FIXES, formatDevise } from "@/lib/devises";
import { MODES_PAIEMENT } from "@/lib/caisse/paiement";
import { cn } from "@/lib/utils";

export const ROLES_AGENCE = [
  { valeur: "DEPART", libelle: "Départ", aide: "Dépose des colis (caisse)" },
  { valeur: "ARRIVEE", libelle: "Arrivée", aide: "Retraits des colis" },
  { valeur: "DEUX", libelle: "Les deux", aide: "Dépose et retraits" },
];

const EXEMPLE_EUROS = 217.24;

/** Fiche d'une agence : rôle, devise et taux, modes de paiement, reçu. */
export function FicheAgence({ agence, onFermer, onEnregistre }) {
  const id = useId();
  const nouvelle = !agence;
  const [f, setF] = useState({
    nom: agence?.nom || "",
    ville: agence?.ville || "",
    pays: agence?.pays || "",
    role: agence?.role || "ARRIVEE",
    devise: agence?.devise || "EUR",
    pariteFixe: agence ? agence.pariteFixe : true,
    taux: agence ? String(agence.taux).replace(".", ",") : "1",
    modesPaiement: agence?.modesPaiement || ["ESPECES"],
    prefixeRecu: agence?.prefixeRecu || "R-",
    adresse: agence?.adresse || "",
    telephone: agence?.telephone || "",
    isActive: agence ? agence.isActive : true,
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const maj = (cle) => (v) => setF((x) => ({ ...x, [cle]: v?.target ? v.target.value : v }));

  const reference = f.devise === "EUR";
  const pariteConnue = !!PARITES_FIXES[f.devise] && !reference;
  const tauxNombre = Number(String(f.taux).replace(",", ".")) || 0;
  const agenceApercu = { devise: f.devise, pariteFixe: pariteConnue && f.pariteFixe, taux: tauxNombre };

  function choisirDevise(code) {
    setF((x) => ({
      ...x,
      devise: code,
      pariteFixe: !!PARITES_FIXES[code],
      taux: code === "EUR" ? "1" : PARITES_FIXES[code] ? String(PARITES_FIXES[code]).replace(".", ",") : x.devise === code ? x.taux : "",
    }));
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur("");
    try {
      const corps = { ...f, taux: reference ? 1 : agenceApercu.pariteFixe ? PARITES_FIXES[f.devise] : tauxNombre, pariteFixe: agenceApercu.pariteFixe };
      const res = await fetch(nouvelle ? "/api/agences" : `/api/agences/${agence.id}`, {
        method: nouvelle ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'agence n'a pas pu être enregistrée.");
      toast.success(nouvelle ? `${data.agence.nom} est créée.` : "Agence enregistrée.");
      onEnregistre(data.agence);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={nouvelle ? "Nouvelle agence" : agence.nom}
      sousTitre={nouvelle ? "Elle apparaît dans le choix d'agence des utilisateurs." : `${agence.ville} · ${agence.pays}`}
      largeur="max-w-xl"
      pied={
        <div className="flex flex-col gap-3">
          {erreur && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {erreur}
            </p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onFermer} className="h-14 rounded-xl border border-line-strong bg-white px-5 font-semibold">
              Annuler
            </button>
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi || !f.nom.trim() || !f.ville.trim() || !f.pays.trim() || (!reference && !agenceApercu.pariteFixe && tauxNombre <= 0)}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
            >
              {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {nouvelle ? "Créer l'agence" : "Enregistrer"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FloatingLabelInput id={`${id}-nom`} label="Nom de l'agence *" className="text-base" value={f.nom} onChange={maj("nom")} />
          </div>
          <FloatingLabelInput id={`${id}-ville`} label="Ville *" className="text-base" value={f.ville} onChange={maj("ville")} />
          <FloatingLabelInput id={`${id}-pays`} label="Pays *" className="text-base" value={f.pays} onChange={maj("pays")} />
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Rôle</legend>
          <div role="radiogroup" aria-label="Rôle de l'agence" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1">
            {ROLES_AGENCE.map((r) => {
              const choisi = f.role === r.valeur;
              return (
                <button
                  key={r.valeur}
                  type="button"
                  role="radio"
                  aria-checked={choisi}
                  onClick={() => maj("role")(r.valeur)}
                  className={cn("flex min-h-14 flex-col items-center justify-center rounded-lg px-2 leading-tight", choisi ? "bg-white shadow-sm" : "text-ink-muted")}
                >
                  <span className="font-semibold">{r.libelle}</span>
                  <span className="text-xs">{r.aide}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Devise de l&apos;agence</legend>
          <div role="radiogroup" aria-label="Devise" className="flex flex-wrap gap-2">
            {Object.values(DEVISES).map((d) => {
              const choisie = f.devise === d.code;
              return (
                <button
                  key={d.code}
                  type="button"
                  role="radio"
                  aria-checked={choisie}
                  onClick={() => choisirDevise(d.code)}
                  className={cn("flex h-12 items-center gap-2 rounded-xl px-4", choisie ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white")}
                >
                  <span className="chiffres">{d.symbole}</span>
                  {d.libelle}
                </button>
              );
            })}
          </div>

          {reference ? (
            <p className="rounded-xl bg-surface-page p-3 text-sm text-ink-muted">L&apos;euro est la devise des tarifs : pas de conversion.</p>
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-page p-4">
              {pariteConnue && (
                <Interrupteur
                  libelle="Parité fixe officielle"
                  aide={`1 € = ${String(PARITES_FIXES[f.devise]).replace(".", ",")} ${DEVISES[f.devise].symbole} (zone franc).`}
                  actif={f.pariteFixe}
                  onChange={(v) => setF((x) => ({ ...x, pariteFixe: v, taux: v ? String(PARITES_FIXES[x.devise]).replace(".", ",") : x.taux }))}
                />
              )}
              <div className="flex items-center gap-3">
                <span className="chiffres shrink-0 text-base">1 € =</span>
                <div className="flex-1">
                  <FloatingLabelInput
                    id={`${id}-taux`}
                    label="Taux de conversion"
                    inputMode="decimal"
                    className="chiffres text-base"
                    disabled={agenceApercu.pariteFixe}
                    value={f.taux}
                    onChange={(e) => maj("taux")(e.target.value.replace(/[^0-9.,]/g, ""))}
                  />
                </div>
                <span className="chiffres shrink-0 text-base">{DEVISES[f.devise].symbole}</span>
              </div>
              <p className="flex flex-wrap items-baseline gap-x-2 rounded-xl border border-line bg-white p-3 text-sm text-ink-muted">
                Exemple : un envoi de <span className="chiffres font-semibold text-ink">217,24 €</span> se paie
                <span className="chiffres text-base font-semibold text-brand-strong">{formatDevise(EXEMPLE_EUROS, agenceApercu)}</span>
              </p>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Modes de paiement acceptés</legend>
          <div role="group" aria-label="Modes de paiement" className="flex flex-wrap gap-2">
            {MODES_PAIEMENT.map((m) => {
              const oui = f.modesPaiement.includes(m.valeur);
              return (
                <button
                  key={m.valeur}
                  type="button"
                  aria-pressed={oui}
                  onClick={() => setF((x) => ({ ...x, modesPaiement: oui ? x.modesPaiement.filter((v) => v !== m.valeur) : [...x.modesPaiement, m.valeur] }))}
                  className={cn("h-11 rounded-xl px-3", oui ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white text-ink-muted")}
                >
                  {m.libelle}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-[140px_minmax(0,1fr)]">
          <FloatingLabelInput id={`${id}-prefixe`} label="Préfixe des reçus" className="chiffres text-base uppercase" value={f.prefixeRecu} onChange={maj("prefixeRecu")} />
          <FloatingLabelInput id={`${id}-adresse`} label="Adresse imprimée sur le reçu" className="text-base" value={f.adresse} onChange={maj("adresse")} />
          <div className="sm:col-span-2">
            <FloatingLabelPhoneInput id={`${id}-tel`} label="Téléphone de l'agence" defaultCountry={f.pays.toLowerCase().includes("burkina") ? "BF" : "FR"} className="text-base" value={f.telephone} onChange={maj("telephone")} />
          </div>
        </div>

        <div className="rounded-2xl bg-surface-page p-4">
          <Interrupteur libelle="Agence active" aide="Inactive : elle n'est plus proposée aux utilisateurs." actif={f.isActive} onChange={maj("isActive")} />
        </div>
      </div>
    </Feuille>
  );
}
