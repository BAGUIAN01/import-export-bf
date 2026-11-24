"use client";

import { useId, useState } from "react";
import { Eye, EyeOff, Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Bloc, SECONDAIRE } from "@/components/epure";
import { Feuille } from "@/components/caisse/feuille";
import { Interrupteur } from "@/components/caisse/interrupteur";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";

const quand = (d) => new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Suivi d'un conteneur, épuré : la chronologie des étapes (lieu, message,
 * visible ou non sur le suivi public) et « Ajouter une étape ».
 */
export function SuiviConteneur({ conteneur, onAjoute }) {
  const etapes = conteneur.trackingUpdates || [];
  const [ouvert, setOuvert] = useState(false);

  return (
    <Bloc
      titre="Étapes du voyage"
      actions={
        <button type="button" onClick={() => setOuvert(true)} className={SECONDAIRE}>
          <Plus className="size-4" aria-hidden="true" />
          Ajouter une étape
        </button>
      }
    >
      {etapes.length === 0 ? (
        <p className="py-6 text-center text-ink-muted">Aucune étape pour l&apos;instant.</p>
      ) : (
        <ol className="flex flex-col">
          {etapes.map((t, i) => (
            <li key={t.id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < etapes.length - 1 && <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
              <span aria-hidden="true" className={i === 0 ? "grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white" : "grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-muted"}>
                <MapPin className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{t.location}</span>
                  <span className="text-[13px] text-ink-muted">{quand(t.timestamp)}</span>
                  {!t.isPublic && (
                    <span className="flex items-center gap-1 text-xs text-ink-subtle">
                      <EyeOff className="size-3.5" aria-hidden="true" />
                      interne
                    </span>
                  )}
                </div>
                <p className="text-[15px] text-ink-muted">{t.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {ouvert && <FeuilleEtape conteneur={conteneur} onFermer={() => setOuvert(false)} onAjoute={() => { setOuvert(false); onAjoute?.(); }} />}
    </Bloc>
  );
}

function FeuilleEtape({ conteneur, onFermer, onAjoute }) {
  const id = useId();
  const [lieu, setLieu] = useState("");
  const [message, setMessage] = useState("");
  const [public_, setPublic] = useState(true);
  const [prevenir, setPrevenir] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function ajouter() {
    setEnvoi(true);
    try {
      const res = await fetch(`/api/containers/${conteneur.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: lieu.trim(), description: message.trim(), isPublic: public_, notifyClients: prevenir }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'étape n'a pas pu être ajoutée.");
      toast.success("Étape ajoutée.");
      onAjoute();
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
      titre="Ajouter une étape"
      sousTitre={conteneur.containerNumber}
      largeur="max-w-lg"
      pied={
        <button type="button" onClick={ajouter} disabled={envoi || !lieu.trim() || !message.trim()} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50">
          {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          Ajouter l&apos;étape
        </button>
      }
    >
      <div className="flex flex-col gap-5 pt-2">
        <FloatingLabelInput id={`${id}-lieu`} label="Lieu *" placeholder="Port d'Abidjan" className="text-base" value={lieu} onChange={(e) => setLieu(e.target.value)} />
        <FloatingLabelTextarea id={`${id}-message`} label="Message *" rows={3} className="text-base" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="flex flex-col gap-4 rounded-2xl bg-surface-page p-4">
          <Interrupteur libelle="Visible sur le suivi public" aide="Les clients le voient avec leur n° de suivi." actif={public_} onChange={setPublic} />
          <Interrupteur libelle="Prévenir les clients" aide="SMS aux clients du conteneur." actif={prevenir} onChange={setPrevenir} />
        </div>
        <p className="flex items-center gap-2 text-[13px] text-ink-muted">
          <Eye className="size-4" aria-hidden="true" />
          Le lieu devient la position actuelle du conteneur.
        </p>
      </div>
    </Feuille>
  );
}
