"use client";

import Link from "next/link";
import { Loader2, UserRound } from "lucide-react";
import { useCaisse } from "@/contexts/caisse-context";

/**
 * Garde des étapes Colis et Paiement : attend la restauration de la commande
 * puis, sans client, renvoie vers l'étape Client.
 */
export function GardeClient({ children, exigeArticles = false }) {
  const { restaure, selectedClient, orderItems } = useCaisse();
  if (!restaure) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="size-8 animate-spin text-ink-muted" aria-label="Chargement" />
      </div>
    );
  }
  const manque = !selectedClient ? "client" : exigeArticles && orderItems.length === 0 ? "colis" : null;
  if (!manque) return children;
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-8 text-center">
        <UserRound className="size-12 text-line-strong" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">{manque === "client" ? "Aucun client choisi" : "Le ticket est vide"}</h1>
          <p className="mt-1 text-ink-muted">
            {manque === "client" ? "Choisissez ou créez le client avant d'ajouter des colis." : "Ajoutez au moins un colis avant de passer au paiement."}
          </p>
        </div>
        <Link
          href={manque === "client" ? "/admin/caisse/client" : "/admin/caisse/commande"}
          className="flex h-12 items-center rounded-xl bg-brand px-5 font-semibold text-white"
        >
          {manque === "client" ? "Choisir un client" : "Ajouter des colis"}
        </Link>
      </div>
    </div>
  );
}
