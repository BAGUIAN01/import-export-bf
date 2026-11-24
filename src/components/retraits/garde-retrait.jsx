"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserRound } from "lucide-react";
import { useRetraits } from "@/contexts/retraits-context";

/**
 * Étapes Colis et Paiement : sans destinataire choisi, retour à l'étape 1 ;
 * colis déjà remis, écran de fin (pas de seconde remise).
 */
export function GardeRetrait({ children }) {
  const router = useRouter();
  const { restaure, donnees, envoi } = useRetraits();
  const remis = !!envoi?.deliveredAt;
  useEffect(() => {
    if (remis) router.replace("/admin/retraits/fin");
  }, [remis, router]);

  if (!restaure || donnees === null || remis) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="size-8 animate-spin text-ink-muted" aria-label="Chargement" />
      </div>
    );
  }
  if (envoi) return children;
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-8 text-center">
        <UserRound className="size-12 text-line-strong" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">Aucun destinataire choisi</h1>
          <p className="mt-1 text-ink-muted">Choisissez d&apos;abord la personne qui vient retirer ses colis.</p>
        </div>
        <Link href="/admin/retraits" className="flex h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white">
          Choisir un destinataire
        </Link>
      </div>
    </div>
  );
}
