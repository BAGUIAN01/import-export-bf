"use client";

/* eslint-disable @next/next/no-img-element -- aperçu local (data URL) ou photo servie par l'API */
import { useId, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Feuille } from "@/components/caisse/feuille";
import { Interrupteur } from "@/components/caisse/interrupteur";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { reduireImage } from "@/lib/image-reduite";
import { iconeDe } from "@/lib/caisse/icones";
import { teinte, urlImage } from "@/lib/caisse/familles";
import { cn } from "@/lib/utils";

/**
 * Fiche d'un article du catalogue (création ou modification) : photo prise
 * avec la tablette ou choisie, nom, prix (ou sur devis), famille, présence
 * à la caisse et dans « Fréquents ».
 */
export function FicheArticle({ article, familles, familleParDefaut, onFermer, onEnregistre }) {
  const id = useId();
  const nouveau = !article;
  const [f, setF] = useState(() => ({
    nom: article?.nom || "",
    detail: article?.detail || "",
    prix: article ? String(article.prix).replace(".", ",") : "",
    surDevis: !!article?.surDevis,
    familleId: article?.familleId || familleParDefaut || familles[0]?.id || "",
    proposeCaisse: article ? article.proposeCaisse : true,
    frequent: !!article?.frequent,
    code: article?.code || "",
  }));
  // undefined : photo inchangée ; null : à enlever ; data URL : nouvelle photo
  const [image, setImage] = useState(undefined);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const appareil = useRef(null);
  const galerie = useRef(null);

  const famille = familles.find((x) => x.id === f.familleId);
  const apercu = image === null ? null : image || urlImage(article);
  const maj = (cle) => (e) => setF((x) => ({ ...x, [cle]: e?.target ? e.target.value : e }));

  async function choisirPhoto(e) {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (!fichier) return;
    try {
      setImage(await reduireImage(fichier));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function enregistrer() {
    setErreur("");
    setEnvoi(true);
    try {
      const corps = { ...f, prix: f.surDevis && !f.prix ? 0 : f.prix, ...(image !== undefined ? { image } : {}) };
      if (!corps.code) delete corps.code;
      const res = await fetch(nouveau ? "/api/tarifs/articles" : `/api/tarifs/articles/${article.id}`, {
        method: nouveau ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'article n'a pas pu être enregistré.");
      toast.success(nouveau ? `${data.article.nom} est ajouté au catalogue.` : "Article enregistré.");
      onEnregistre(data.article);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer() {
    if (!window.confirm(`Retirer « ${article.nom} » du catalogue ? Les colis déjà enregistrés ne changent pas.`)) return;
    setEnvoi(true);
    try {
      const res = await fetch(`/api/tarifs/articles/${article.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'article n'a pas pu être retiré.");
      toast.success(`${article.nom} est retiré du catalogue.`);
      onEnregistre(null);
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  }

  const Icone = iconeDe(article?.icone || famille?.icone);
  const t = teinte(famille?.teinte);

  return (
    <Feuille
      ouvert
      onFermer={onFermer}
      titre={nouveau ? "Nouvel article" : article.nom}
      sousTitre={famille ? `Famille ${famille.nom}` : undefined}
      largeur="max-w-xl"
      pied={
        <div className="flex flex-col gap-3">
          {erreur && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
              {erreur}
            </p>
          )}
          <div className="flex gap-3">
            {!nouveau && (
              <button type="button" onClick={retirer} disabled={envoi} aria-label="Retirer du catalogue" className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-danger/30 bg-danger-soft text-danger">
                <Trash2 className="size-5" aria-hidden="true" />
              </button>
            )}
            <button type="button" onClick={onFermer} className="h-14 rounded-xl border border-line-strong bg-white px-5 font-semibold">
              Annuler
            </button>
            <button
              type="button"
              onClick={enregistrer}
              disabled={envoi || !f.nom.trim() || !f.familleId}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white disabled:opacity-50"
            >
              {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {nouveau ? "Ajouter au catalogue" : "Enregistrer"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Photo */}
        <div className="relative h-[200px] overflow-hidden rounded-2xl" style={{ background: t.fond }}>
          {apercu ? (
            <img src={apercu} alt={`Photo de ${f.nom || "l'article"}`} className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center" style={{ color: t.trait }} aria-hidden="true">
              <Icone className="size-16" strokeWidth={1.5} />
            </span>
          )}
          {apercu && (
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Enlever la photo"
              className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-white/90 text-ink shadow"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => appareil.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white font-semibold">
            <Camera className="size-5" aria-hidden="true" />
            Prendre une photo
          </button>
          <button type="button" onClick={() => galerie.current?.click()} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white font-semibold">
            <ImagePlus className="size-5" aria-hidden="true" />
            Choisir une image
          </button>
          <input ref={appareil} type="file" accept="image/*" capture="environment" className="hidden" onChange={choisirPhoto} />
          <input ref={galerie} type="file" accept="image/*" className="hidden" onChange={choisirPhoto} />
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FloatingLabelInput id={`${id}-nom`} label="Nom de l'article *" className="text-base" value={f.nom} onChange={maj("nom")} />
          </div>
          <div className="sm:col-span-2">
            <FloatingLabelInput id={`${id}-detail`} label="Détail (dimensions, contenance…)" className="text-base" value={f.detail} onChange={maj("detail")} />
          </div>
          <FloatingLabelInput
            id={`${id}-prix`}
            label={f.surDevis ? "Prix indicatif (€)" : "Prix (€) *"}
            inputMode="decimal"
            className="chiffres text-base"
            value={f.prix}
            onChange={(e) => setF((x) => ({ ...x, prix: e.target.value.replace(/[^0-9.,]/g, "") }))}
          />
          <FloatingLabelInput id={`${id}-code`} label="Code colis (facultatif)" className="chiffres text-base uppercase" value={f.code} onChange={maj("code")} />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium text-ink-muted">Famille</legend>
          <div role="radiogroup" aria-label="Famille" className="flex flex-wrap gap-2">
            {familles.map((x) => {
              const choisie = x.id === f.familleId;
              const tt = teinte(x.teinte);
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={choisie}
                  onClick={() => setF((y) => ({ ...y, familleId: x.id }))}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-xl px-3",
                    choisie ? "border-2 border-brand bg-brand-soft font-semibold text-brand-strong" : "border border-line-strong bg-white"
                  )}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: tt.trait }} />
                  {x.nom}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 rounded-2xl bg-surface-page p-4">
          <Interrupteur libelle="Sur devis" aide="Le prix se tape à la caisse, au clavier." actif={f.surDevis} onChange={maj("surDevis")} />
          <Interrupteur libelle="Proposé à la caisse" aide="Masqué : l'article reste dans les tarifs mais pas dans la caisse." actif={f.proposeCaisse} onChange={maj("proposeCaisse")} />
          <Interrupteur libelle="Dans « Fréquents »" aide="Accès en un toucher dès l'ouverture de l'écran Colis." actif={f.frequent} onChange={maj("frequent")} disabled={f.surDevis} />
        </div>
      </div>
    </Feuille>
  );
}
