"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { Interrupteur } from "@/components/caisse/interrupteur";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { FloatingLabelDatePicker } from "@/components/ui/floating-label-date-picker";
import { ETAPES_DETAIL, STATUTS_CONTENEUR, corpsEtape, estRecul } from "@/lib/conteneurs";
import { cn } from "@/lib/utils";

/** Lieux proposés en un toucher pour le suivi. */
const LIEUX = ["Agence de Paris", "Port du Havre", "En mer", "Port d'Abidjan", "Port de Lomé", "Port de Tema", "Frontière", "Ouagadougou"];

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * Passer un conteneur à une étape (`cible`) ou, sans `cible`, ajouter un
 * point de suivi. Chaque passage écrit une ligne du suivi (lieu, message),
 * visible des clients sur le suivi public, avec SMS si on le demande.
 * Revenir à une étape précédente ne fait que corriger l'état.
 */
export function FeuilleEtape({ conteneur, cible, onFermer, onFait }) {
  const id = useId();
  const pointSeul = !cible;
  const recul = !pointSeul && estRecul(conteneur.status, cible);
  const e = pointSeul ? {} : ETAPES_DETAIL[cible];

  const [date, setDate] = useState(aujourdhui());
  const [plomb, setPlomb] = useState(conteneur.sealNumber || "");
  const [lieu, setLieu] = useState(e.lieu || "");
  const [message, setMessage] = useState(e.message || "");
  const [visible, setVisible] = useState(true);
  const [prevenir, setPrevenir] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const titre = pointSeul ? "Point de suivi" : recul ? `Revenir à « ${e.court} »` : e.verbe;
  const pret = recul || ((!e.plomb || plomb.trim()) && (pointSeul ? lieu.trim() && message.trim() : true));

  async function valider() {
    setEnvoi(true);
    try {
      let maj = null;
      if (!pointSeul) {
        const res = await fetch(`/api/containers/${conteneur.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpsEtape(cible, { date, plomb: e.plomb ? plomb : undefined })),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Le conteneur n'a pas pu être mis à jour.");
        maj = data.container;
      }
      if (!recul && (lieu.trim() || message.trim())) {
        const res = await fetch(`/api/containers/${conteneur.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: lieu.trim() || e.court || "Suivi",
            description: message.trim() || STATUTS_CONTENEUR[cible]?.libelle || "Mise à jour",
            isPublic: visible,
            notifyClients: prevenir,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Le point de suivi n'a pas pu être ajouté.");
      }
      toast.success(pointSeul ? "Point de suivi ajouté." : `${conteneur.containerNumber} : ${STATUTS_CONTENEUR[cible].libelle.toLowerCase()}.`);
      onFait?.(maj);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={titre}
      sousTitre={`${conteneur.containerNumber}${recul ? " · pour corriger une erreur" : ""}`}
      largeur="max-w-lg"
      pied={
        <button
          type="button"
          onClick={valider}
          disabled={envoi || !pret}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
        >
          {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {pointSeul ? "Ajouter au suivi" : recul ? "Corriger l'étape" : "Valider"}
        </button>
      }
    >
      {recul ? (
        <p className="rounded-2xl bg-alerte-soft p-4 text-alerte">
          Le conteneur repasse à « {e.court} ». Le suivi déjà publié ne change pas.
        </p>
      ) : (
        <div className="flex flex-col gap-5 pt-2">
          {e.plomb && <FloatingLabelInput id={`${id}-plomb`} label="N° du plomb *" className="text-base" autoComplete="off" value={plomb} onChange={(x) => setPlomb(x.target.value)} />}
          {e.date && <FloatingLabelDatePicker id={`${id}-date`} label={e.date === "actualDeparture" ? "Date de départ" : "Date d'arrivée"} value={date} onChange={(v) => setDate(v?.target ? v.target.value : v)} />}

          <div className="flex flex-col gap-2">
            <FloatingLabelInput id={`${id}-lieu`} label={pointSeul ? "Lieu *" : "Lieu"} className="text-base" value={lieu} onChange={(x) => setLieu(x.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              {LIEUX.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLieu(l)}
                  className={cn("h-9 rounded-full border px-3 text-sm", lieu === l ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-ink-muted hover:text-ink")}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <FloatingLabelTextarea id={`${id}-message`} label={pointSeul ? "Message *" : "Message du suivi"} rows={2} className="text-base" value={message} onChange={(x) => setMessage(x.target.value)} />

          <div className="flex flex-col gap-4 rounded-2xl bg-surface-page p-4">
            <Interrupteur libelle="Visible sur le suivi public" aide="Les clients le voient avec leur n° de suivi." actif={visible} onChange={setVisible} />
            <Interrupteur libelle="Prévenir les clients par SMS" aide="Tous les clients du conteneur." actif={prevenir} onChange={setPrevenir} />
          </div>
        </div>
      )}
    </Feuille>
  );
}
