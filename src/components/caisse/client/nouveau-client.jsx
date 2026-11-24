"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { Champ } from "@/components/caisse/champ";

const VIDE = {
  lastName: "",
  firstName: "",
  phone: "",
  email: "",
  address: "",
  postalCode: "",
  city: "",
  country: "France",
  recipientName: "",
  recipientPhone: "",
  recipientCity: "",
  recipientRelation: "",
};

const LIENS = ["Famille", "Conjoint(e)", "Ami(e)", "Entreprise"];

/**
 * Fiche « Nouveau client » : les champs exigés par POST /api/clients
 * (nom, prénom, téléphone, adresse, ville, pays) et le destinataire habituel.
 * `onCree(client)` reçoit le client créé.
 */
// Monté seulement quand la fiche est ouverte : chaque ouverture repart d'un formulaire vide.
export function NouveauClient({ onFermer, onCree, rechercheInitiale = "" }) {
  // Préremplit le téléphone ou le nom avec la recherche restée sans résultat
  const [f, setF] = useState(() => {
    const r = rechercheInitiale.trim();
    if (!r) return VIDE;
    return /^[+\d\s]+$/.test(r) ? { ...VIDE, phone: r } : { ...VIDE, lastName: r };
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [messageErreur, setMessageErreur] = useState("");

  const maj = (cle) => (e) => {
    setF((x) => ({ ...x, [cle]: e.target.value }));
    if (erreurs[cle]) setErreurs((x) => ({ ...x, [cle]: undefined }));
  };

  async function enregistrer(e) {
    e.preventDefault();
    setEnvoi(true);
    setMessageErreur("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreurs(data.errors || {});
        throw new Error(data.error || "Le client n'a pas pu être créé.");
      }
      onCree(data.client);
    } catch (err) {
      setMessageErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre="Nouveau client"
      sousTitre="Les champs marqués * sont obligatoires."
      largeur="max-w-2xl"
      pied={
        <div className="flex flex-col gap-3">
          {messageErreur && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {messageErreur}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onFermer}
              className="h-14 flex-1 rounded-xl border border-line-strong bg-white font-semibold sm:flex-none sm:px-6"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="form-nouveau-client"
              disabled={envoi}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-60"
            >
              {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              Créer et continuer
            </button>
          </div>
        </div>
      }
    >
      <form id="form-nouveau-client" onSubmit={enregistrer} className="flex flex-col gap-6">
        <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">Expéditeur</legend>
          <Champ libelle="Nom" requis autoComplete="family-name" value={f.lastName} onChange={maj("lastName")} erreur={erreurs.lastName} />
          <Champ libelle="Prénom" requis autoComplete="given-name" value={f.firstName} onChange={maj("firstName")} erreur={erreurs.firstName} />
          <Champ libelle="Téléphone" requis type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={maj("phone")} erreur={erreurs.phone} />
          <Champ libelle="E-mail" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={maj("email")} erreur={erreurs.email} />
          <Champ libelle="Adresse" requis className="sm:col-span-2" autoComplete="street-address" value={f.address} onChange={maj("address")} erreur={erreurs.address} />
          <Champ libelle="Code postal" inputMode="numeric" autoComplete="postal-code" value={f.postalCode} onChange={maj("postalCode")} />
          <Champ libelle="Ville" requis autoComplete="address-level2" value={f.city} onChange={maj("city")} erreur={erreurs.city} />
          <Champ libelle="Pays" requis autoComplete="country-name" value={f.country} onChange={maj("country")} erreur={erreurs.country} />
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">Destinataire habituel</legend>
          <Champ libelle="Nom du destinataire" value={f.recipientName} onChange={maj("recipientName")} />
          <Champ libelle="Téléphone du destinataire" type="tel" inputMode="tel" value={f.recipientPhone} onChange={maj("recipientPhone")} />
          <Champ libelle="Ville au Burkina Faso" placeholder="Ouagadougou" value={f.recipientCity} onChange={maj("recipientCity")} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-ink-muted">Lien avec le client</span>
            <div role="radiogroup" aria-label="Lien avec le client" className="flex flex-wrap gap-2">
              {LIENS.map((l) => {
                const choisi = f.recipientRelation === l;
                return (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={choisi}
                    onClick={() => setF((x) => ({ ...x, recipientRelation: choisi ? "" : l }))}
                    className={
                      choisi
                        ? "h-11 rounded-xl border-2 border-brand bg-brand-soft px-3 font-medium text-brand-strong"
                        : "h-11 rounded-xl border border-line-strong bg-white px-3 text-ink-muted"
                    }
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </fieldset>
      </form>
    </Feuille>
  );
}
