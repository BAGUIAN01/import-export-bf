"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Feuille } from "@/components/caisse/feuille";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelPhoneInput } from "@/components/ui/floating-label-phone-input";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import { PAYS, VILLES_BURKINA, villesDuPays } from "@/lib/data/villes";
import { normaliserTelephone, telephoneValide } from "@/lib/telephone";
import { cn } from "@/lib/utils";

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

// Texte 16 px dans les champs : pas de zoom automatique sur tablette iOS.
const TACTILE = "text-base";

function MessageErreur({ children }) {
  if (!children) return null;
  return <p className="mt-1 px-1 text-[13px] text-danger">{children}</p>;
}

/**
 * Fiche « Nouveau client » : les champs exigés par POST /api/clients
 * (nom, prénom, téléphone, adresse, ville, pays) et le destinataire habituel.
 * Montée seulement quand elle est ouverte : chaque ouverture repart d'un
 * formulaire vide. `onCree(client)` reçoit le client créé.
 */
export function NouveauClient({ onFermer, onCree, rechercheInitiale = "" }) {
  const id = useId();
  // Préremplit le téléphone ou le nom avec la recherche restée sans résultat
  const [f, setF] = useState(() => {
    const r = rechercheInitiale.trim();
    if (!r) return VIDE;
    return /^[+\d\s]+$/.test(r) ? { ...VIDE, phone: normaliserTelephone(r, "FR") } : { ...VIDE, lastName: r };
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const [messageErreur, setMessageErreur] = useState("");

  const changer = (cle, valeur) => {
    setF((x) => ({ ...x, [cle]: valeur }));
    if (erreurs[cle]) setErreurs((x) => ({ ...x, [cle]: undefined }));
  };
  const maj = (cle) => (e) => changer(cle, e.target.value);

  async function enregistrer(e) {
    e.preventDefault();
    // Numéros vérifiés selon le pays choisi avant l'envoi
    const erreursTel = {};
    if (f.phone && !telephoneValide(f.phone)) erreursTel.phone = "Numéro incomplet ou invalide pour ce pays";
    if (f.recipientPhone && !telephoneValide(f.recipientPhone)) erreursTel.recipientPhone = "Numéro incomplet ou invalide pour ce pays";
    if (Object.keys(erreursTel).length) {
      setErreurs((x) => ({ ...x, ...erreursTel }));
      setMessageErreur("Vérifiez les numéros de téléphone.");
      return;
    }
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
        throw new Error(data.errors ? "Complétez les champs en rouge." : data.error || "Le client n'a pas pu être créé.");
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
              form={`${id}-form`}
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
      <form id={`${id}-form`} onSubmit={enregistrer} className="flex flex-col gap-6 pt-2">
        <fieldset className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
          <legend className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Expéditeur</legend>
          <div>
            <FloatingLabelInput id={`${id}-nom`} label="Nom *" autoComplete="family-name" className={TACTILE} value={f.lastName} onChange={maj("lastName")} error={erreurs.lastName} disabled={envoi} />
            <MessageErreur>{erreurs.lastName}</MessageErreur>
          </div>
          <div>
            <FloatingLabelInput id={`${id}-prenom`} label="Prénom *" autoComplete="given-name" className={TACTILE} value={f.firstName} onChange={maj("firstName")} error={erreurs.firstName} disabled={envoi} />
            <MessageErreur>{erreurs.firstName}</MessageErreur>
          </div>
          <div>
            <FloatingLabelPhoneInput
              id={`${id}-tel`}
              label="Téléphone *"
              defaultCountry={f.country === "Burkina Faso" ? "BF" : "FR"}
              className={TACTILE}
              value={f.phone}
              onChange={maj("phone")}
              error={erreurs.phone}
              disabled={envoi}
            />
            <MessageErreur>{erreurs.phone}</MessageErreur>
          </div>
          <div>
            <FloatingLabelInput id={`${id}-email`} label="Email" type="email" inputMode="email" autoComplete="email" className={TACTILE} value={f.email} onChange={maj("email")} error={erreurs.email} disabled={envoi} />
            <MessageErreur>{erreurs.email}</MessageErreur>
          </div>
          <div>
            <FloatingCombobox
              id={`${id}-pays`}
              label="Pays *"
              value={f.country}
              onValueChange={(v) => {
                changer("country", v);
                changer("city", "");
              }}
              error={erreurs.country}
              disabled={envoi}
              placeholder="Sélectionnez le pays"
              options={PAYS}
            />
            <MessageErreur>{erreurs.country}</MessageErreur>
          </div>
          <div>
            <FloatingCombobox
              id={`${id}-ville`}
              label="Ville *"
              value={f.city}
              onValueChange={(v) => changer("city", v)}
              error={erreurs.city}
              disabled={!f.country || envoi}
              placeholder={f.country ? "Sélectionnez la ville" : "Sélectionnez d'abord le pays"}
              options={villesDuPays(f.country).map((v) => ({ value: v, label: v }))}
            />
            <MessageErreur>{erreurs.city}</MessageErreur>
          </div>
          <div className="sm:col-span-2 grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-[minmax(0,1fr)_160px]">
            <div>
              <FloatingLabelTextarea id={`${id}-adresse`} label="Adresse *" rows={2} className={TACTILE} value={f.address} onChange={maj("address")} error={erreurs.address} disabled={envoi} />
              <MessageErreur>{erreurs.address}</MessageErreur>
            </div>
            <FloatingLabelInput id={`${id}-cp`} label="Code postal" inputMode="numeric" autoComplete="postal-code" className={TACTILE} value={f.postalCode} onChange={maj("postalCode")} disabled={envoi} />
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
          <legend className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Destinataire habituel</legend>
          <FloatingLabelInput id={`${id}-dest-nom`} label="Nom du destinataire" className={TACTILE} value={f.recipientName} onChange={maj("recipientName")} disabled={envoi} />
          <div>
            <FloatingLabelPhoneInput
              id={`${id}-dest-tel`}
              label="Téléphone du destinataire"
              defaultCountry="BF"
              className={TACTILE}
              value={f.recipientPhone}
              onChange={maj("recipientPhone")}
              error={erreurs.recipientPhone}
              disabled={envoi}
            />
            <MessageErreur>{erreurs.recipientPhone}</MessageErreur>
          </div>
          <FloatingCombobox
            id={`${id}-dest-ville`}
            label="Ville au Burkina Faso"
            value={f.recipientCity}
            onValueChange={(v) => changer("recipientCity", v)}
            disabled={envoi}
            placeholder="Sélectionnez la ville"
            options={VILLES_BURKINA.map((v) => ({ value: v, label: v }))}
          />
          <div role="radiogroup" aria-label="Lien avec le client" className="flex flex-wrap items-center gap-2">
            {LIENS.map((l) => {
              const choisi = f.recipientRelation === l;
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={choisi}
                  onClick={() => changer("recipientRelation", choisi ? "" : l)}
                  className={cn(
                    "h-11 rounded-xl px-3",
                    choisi ? "border-2 border-brand bg-brand-soft font-medium text-brand-strong" : "border border-line-strong bg-white text-ink-muted"
                  )}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>
    </Feuille>
  );
}
