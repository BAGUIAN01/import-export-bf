"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { Interrupteur } from "@/components/caisse/interrupteur";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelPhoneInput } from "@/components/ui/floating-label-phone-input";
import { PROFILS, libelleRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

/** Fiche d'un compte du personnel : identité, profil, agence, mot de passe, activation. */
export function FicheUtilisateur({ utilisateur, agences, onFermer, onEnregistre }) {
  const id = useId();
  const nouveau = !utilisateur;
  const [f, setF] = useState({
    name: utilisateur?.name || "",
    phone: utilisateur?.phone || "",
    email: utilisateur?.email || "",
    role: utilisateur?.role || "STAFF",
    agenceId: utilisateur?.agenceId || "",
    isActive: utilisateur ? utilisateur.isActive : true,
    password: "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const maj = (cle) => (v) => setF((x) => ({ ...x, [cle]: v?.target ? v.target.value : v }));

  async function enregistrer() {
    setEnvoi(true);
    setErreur("");
    try {
      const corps = { ...f, agenceId: f.agenceId || null };
      if (!nouveau && !corps.password) delete corps.password;
      const res = await fetch(nouveau ? "/api/utilisateurs" : `/api/utilisateurs/${utilisateur.id}`, {
        method: nouveau ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Le compte n'a pas pu être enregistré.");
      toast.success(nouveau ? `Le compte de ${data.utilisateur.name} est créé.` : "Compte enregistré.");
      onEnregistre(data.utilisateur);
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
      titre={nouveau ? "Nouvel utilisateur" : utilisateur.name || "Utilisateur"}
      sousTitre={nouveau ? "Il se connecte avec son téléphone (ou son e-mail) et son mot de passe." : libelleRole(utilisateur.role)}
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
              disabled={envoi || !f.name.trim() || !f.phone || (nouveau && f.password.length < 8)}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
            >
              {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {nouveau ? "Créer le compte" : "Enregistrer"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FloatingLabelInput id={`${id}-nom`} label="Nom et prénom *" className="text-base" autoComplete="off" value={f.name} onChange={maj("name")} />
          </div>
          <FloatingLabelPhoneInput id={`${id}-tel`} label="Téléphone *" defaultCountry="FR" className="text-base" value={f.phone} onChange={maj("phone")} />
          <FloatingLabelInput id={`${id}-email`} label="E-mail" type="email" inputMode="email" className="text-base" autoComplete="off" value={f.email} onChange={maj("email")} />
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Profil</legend>
          <div role="radiogroup" aria-label="Profil" className="flex flex-col gap-2">
            {PROFILS.map((p) => {
              const choisi = f.role === p.role;
              return (
                <button
                  key={p.role}
                  type="button"
                  role="radio"
                  aria-checked={choisi}
                  onClick={() => maj("role")(p.role)}
                  className={cn(
                    "flex min-h-14 flex-col justify-center rounded-xl px-4 py-2 text-left",
                    choisi ? "border-2 border-brand bg-brand-soft" : "border border-line-strong bg-white"
                  )}
                >
                  <span className={cn("font-semibold", choisi && "text-brand-strong")}>{libelleRole(p.role)}</span>
                  <span className="text-[13px] text-ink-muted">{p.aide}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Agence</legend>
          <div role="radiogroup" aria-label="Agence" className="flex flex-wrap gap-2">
            {[{ id: "", nom: "Toutes les agences" }, ...agences].map((a) => {
              const choisie = f.agenceId === a.id;
              return (
                <button
                  key={a.id || "toutes"}
                  type="button"
                  role="radio"
                  aria-checked={choisie}
                  onClick={() => maj("agenceId")(a.id)}
                  className={cn("h-11 rounded-xl px-3", choisie ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white")}
                >
                  {a.nom}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[13px] text-ink-muted">L&apos;agence fixe la devise de la caisse et des retraits de la personne.</p>
        </fieldset>

        <FloatingLabelInput
          id={`${id}-mdp`}
          label={nouveau ? "Mot de passe * (8 caractères au moins)" : "Nouveau mot de passe (laisser vide pour garder l'actuel)"}
          type="password"
          autoComplete="new-password"
          className="text-base"
          value={f.password}
          onChange={maj("password")}
        />

        <div className="rounded-2xl bg-surface-page p-4">
          <Interrupteur libelle="Compte actif" aide="Désactivé : la personne ne peut plus se connecter." actif={f.isActive} onChange={maj("isActive")} />
        </div>
      </div>
    </Feuille>
  );
}
