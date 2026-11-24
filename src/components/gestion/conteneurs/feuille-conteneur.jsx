"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-date-picker";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";

const jourIso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const valeurDate = (v) => (v?.target ? v.target.value : v) || "";

/**
 * Ouvrir un conteneur (sans `conteneur`) ou le modifier : feuille du bas.
 * L'état (fermé, parti, douane, arrivé) ne se change pas ici : il passe par
 * les étapes, qui alimentent le suivi des clients.
 */
export function FeuilleConteneur({ conteneur, onFermer, onFait }) {
  const id = useId();
  const modification = !!conteneur;
  const [nom, setNom] = useState(conteneur?.name || "");
  const [depart, setDepart] = useState(jourIso(conteneur?.departureDate));
  const [arrivee, setArrivee] = useState(jourIso(conteneur?.arrivalDate));
  const [capacite, setCapacite] = useState(String(conteneur?.capacity ?? 100));
  const [notes, setNotes] = useState(conteneur?.notes || "");
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer() {
    setEnvoi(true);
    try {
      const date = (v) => (v ? new Date(v).toISOString() : null);
      const corps = modification
        ? { name: nom.trim() || null, departureDate: date(depart), arrivalDate: date(arrivee), capacity: parseInt(capacite, 10) || 100, notes }
        : {
            name: nom.trim() || `Chargement ${depart ? `du ${new Date(depart).toLocaleDateString("fr-FR")}` : new Date().toLocaleDateString("fr-FR")}`,
            departureDate: date(depart),
            arrivalDate: date(arrivee),
            capacity: parseInt(capacite, 10) || 100,
            notes: notes || null,
            status: "PREPARATION",
          };
      const res = await fetch(modification ? `/api/containers/${conteneur.id}` : "/api/containers", {
        method: modification ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || (modification ? "Le conteneur n'a pas pu être modifié." : "Le conteneur n'a pas pu être ouvert."));
      const c = data.container || data;
      toast.success(modification ? "Conteneur modifié." : `${c.containerNumber} est ouvert : la caisse y enregistre les colis.`);
      onFait(c);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={modification ? "Modifier le conteneur" : "Ouvrir un conteneur"}
      sousTitre={modification ? <span className="chiffres">{conteneur.containerNumber}</span> : "Il devient le conteneur en chargement de la caisse."}
      largeur="max-w-md"
      pied={
        <div className="flex gap-2">
          <button type="button" onClick={onFermer} className="h-14 flex-1 rounded-2xl border border-line-strong font-semibold">
            Annuler
          </button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={envoi}
            className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-2xl bg-brand font-semibold text-white disabled:opacity-50"
          >
            {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {modification ? "Enregistrer" : "Ouvrir le conteneur"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <FloatingLabelInput id={`${id}-nom`} label={modification ? "Nom" : "Nom (facultatif)"} className="text-base" value={nom} onChange={(e) => setNom(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelDatePicker id={`${id}-depart`} label="Départ prévu" value={depart} onChange={(v) => setDepart(valeurDate(v))} />
          <FloatingLabelDatePicker id={`${id}-arrivee`} label="Arrivée prévue" value={arrivee} onChange={(v) => setArrivee(valeurDate(v))} />
        </div>
        <FloatingLabelInput
          id={`${id}-capacite`}
          label="Capacité (colis)"
          inputMode="numeric"
          className="chiffres text-base"
          value={capacite}
          onChange={(e) => setCapacite(e.target.value.replace(/\D/g, ""))}
        />
        <FloatingLabelTextarea id={`${id}-notes`} label="Notes" className="text-base" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>
    </Feuille>
  );
}
