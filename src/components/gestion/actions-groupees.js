"use client";

// Actions groupées des tableaux (administrateur) : ce qu'on peut faire sur
// plusieurs lignes cochées. Chaque action passe par la même route que la
// ligne seule (mêmes règles, mêmes refus) ; voir BarreSelection.

import { ArrowRightLeft, ListChecks, Trash2 } from "lucide-react";
import { appel } from "@/components/epure/selection";
import { ETAPES_CONTENEUR, ETAPES_DETAIL, STATUTS_CONTENEUR, corpsEtape, estRecul } from "@/lib/conteneurs";
import { nomAffiche } from "@/lib/caisse/clients";

// « colis » est invariable : pas de « s » ajouté à un mot qui finit déjà par s ou x
const pluriel = (n, mot) => `${n} ${mot}${n > 1 && !/[sx]$/.test(mot) ? "s" : ""}`;
const jour = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const arrondi = (n) => Math.round((Number(n) || 0) * 100) / 100;

const ETATS_COLIS = [
  ["REGISTERED", "Enregistré"],
  ["COLLECTED", "Collecté"],
  ["IN_CONTAINER", "En conteneur"],
  ["IN_TRANSIT", "En route"],
  ["CUSTOMS", "En douane"],
  ["DELIVERED", "Remis"],
  ["RETURNED", "Retourné"],
  ["CANCELLED", "Annulé"],
];
const PAIEMENT = { PAID: "Soldé", PARTIAL: "Acompte", PENDING: "À payer", CANCELLED: "Annulé", REFUNDED: "Remboursé" };

/** Conteneurs qui peuvent recevoir des colis (en chargement ou fermés). */
async function conteneursOuverts() {
  const d = await appel("/api/containers?limit=100");
  return (d.containers || [])
    .filter((c) => ["PREPARATION", "LOADED"].includes(c.status))
    .map((c) => ({
      valeur: c.id,
      libelle: c.containerNumber,
      detail: `${STATUTS_CONTENEUR[c.status]?.libelle} · ${c.packagesCount ?? 0} colis${c.departureDate ? ` · départ ${jour(c.departureDate)}` : ""}`,
    }));
}

function supprimer({ mot, url, texte }) {
  return {
    id: "supprimer",
    libelle: "Supprimer",
    icone: Trash2,
    danger: true,
    confirmation: (n) => ({ titre: `Supprimer ${pluriel(n, mot)} ?`, texte: texte || "Cette action est définitive.", bouton: `Supprimer ${pluriel(n, mot)}` }),
    executer: (l) => appel(url(l), { method: "DELETE" }),
    enCours: "Suppression",
    succes: (n) => `${pluriel(n, mot)} supprimé${n > 1 ? "s" : ""}.`,
  };
}

/* ── Colis ───────────────────────────────────────────────────── */

export function selectionColis(onFait) {
  return {
    onFait,
    actions: [
      {
        id: "conteneur",
        libelle: "Changer de conteneur",
        court: "Conteneur",
        titreChoix: "Vers quel conteneur ?",
        icone: ArrowRightLeft,
        choix: conteneursOuverts,
        executer: (l, conteneurId) => appel(`/api/packages/${l.id}`, { method: "PATCH", body: JSON.stringify({ containerId: conteneurId }) }),
        enCours: "Déplacement",
        succes: (n) => `${pluriel(n, "colis")} déplacé${n > 1 ? "s" : ""}.`,
      },
      {
        id: "etat",
        libelle: "Changer l'état",
        court: "État",
        titreChoix: "Nouvel état des colis",
        icone: ListChecks,
        choix: ETATS_COLIS.map(([valeur, libelle]) => ({ valeur, libelle })),
        executer: (l, status) => (l.status === status ? null : appel(`/api/packages/${l.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })),
        enCours: "Mise à jour",
        succes: (n) => `${pluriel(n, "colis")} mis à jour.`,
      },
      supprimer({ mot: "colis", url: (l) => `/api/packages/${l.id}` }),
    ],
    exporter: {
      nom: "colis",
      ligne: (p) => ({
        "N° colis": p.packageNumber,
        Description: p.description,
        Quantité: p.totalQuantity,
        "Poids (kg)": p.weight ?? "",
        Client: nomAffiche(p.client),
        Envoi: p.shipment?.shipmentNumber || "",
        Conteneur: p.container?.containerNumber || "",
        État: Object.fromEntries(ETATS_COLIS)[p.status] || p.status,
        "Montant (€)": arrondi(p.totalAmount),
      }),
    },
  };
}

/* ── Envois ──────────────────────────────────────────────────── */

export function selectionEnvois(onFait) {
  return {
    onFait,
    actions: [
      {
        id: "conteneur",
        libelle: "Changer de conteneur",
        court: "Conteneur",
        titreChoix: "Vers quel conteneur ?",
        icone: ArrowRightLeft,
        choix: conteneursOuverts,
        // Les colis de l'envoi suivent (route des envois)
        executer: (l, conteneurId) => appel(`/api/shipments/${l.id}`, { method: "PUT", body: JSON.stringify({ containerId: conteneurId }) }),
        enCours: "Déplacement",
        succes: (n) => `${pluriel(n, "envoi")} déplacé${n > 1 ? "s" : ""} avec leurs colis.`,
      },
      supprimer({ mot: "envoi", url: (l) => `/api/shipments/${l.id}`, texte: "Les envois et leurs colis seront supprimés. Cette action est définitive." }),
    ],
    exporter: {
      nom: "envois",
      ligne: (e) => ({
        "N° de suivi": e.shipmentNumber,
        Date: jour(e.createdAt),
        Client: nomAffiche(e.client),
        Téléphone: e.client?.phone || "",
        Destinataire: e.client?.recipientName || "",
        "Ville destinataire": e.client?.recipientCity || "",
        Conteneur: e.container?.containerNumber || "",
        Colis: e.packagesCount ?? "",
        "Montant (€)": arrondi(e.totalAmount),
        "Payé (€)": arrondi(e.paidAmount),
        "Reste (€)": arrondi(Math.max(0, (e.totalAmount || 0) - (e.paidAmount || 0))),
        Paiement: e.deliveredAt ? "Remis" : PAIEMENT[e.paymentStatus] || e.paymentStatus || "",
        "Remis le": jour(e.deliveredAt),
      }),
    },
  };
}

/* ── Clients ─────────────────────────────────────────────────── */

export function selectionClients(onFait) {
  return {
    onFait,
    actions: [supprimer({ mot: "client", url: (l) => `/api/clients/${l.id}`, texte: "Un client qui a des envois est seulement désactivé." })],
    exporter: {
      nom: "clients",
      ligne: (c) => ({
        Code: c.clientCode,
        Nom: c.lastName,
        Prénom: c.firstName,
        Téléphone: c.phone,
        "E-mail": c.email || "",
        Ville: c.city || "",
        Pays: c.country || "",
        Destinataire: c.recipientName || "",
        "Tél. destinataire": c.recipientPhone || "",
        "Ville destinataire": c.recipientCity || "",
        Envois: c.shipmentsCount ?? "",
        "Reste (€)": arrondi(Math.max(0, (c.totalShipmentsAmount || 0) - (c.totalSpent || 0))),
      }),
    },
  };
}

/* ── Conteneurs ──────────────────────────────────────────────── */

export function selectionConteneurs(onFait) {
  return {
    onFait,
    actions: [
      {
        id: "etape",
        libelle: "Changer l'étape",
        court: "Étape",
        titreChoix: "Passer les conteneurs à l'étape",
        icone: ListChecks,
        choix: ETAPES_CONTENEUR.map((s) => ({ valeur: s, libelle: STATUTS_CONTENEUR[s].libelle, detail: ETAPES_DETAIL[s].message })),
        // Comme la feuille des étapes : l'état, puis un point de suivi public (sans SMS)
        executer: async (c, cible) => {
          if (c.status === cible) return;
          await appel(`/api/containers/${c.id}`, { method: "PUT", body: JSON.stringify(corpsEtape(cible)) });
          if (!estRecul(c.status, cible)) {
            const e = ETAPES_DETAIL[cible];
            await appel(`/api/containers/${c.id}/status`, {
              method: "POST",
              body: JSON.stringify({ location: e.lieu || e.court, description: e.message, isPublic: true, notifyClients: false }),
            });
          }
        },
        enCours: "Mise à jour",
        succes: (n) => `${pluriel(n, "conteneur")} mis à jour.`,
      },
      supprimer({ mot: "conteneur", url: (l) => `/api/containers/${l.id}`, texte: "Un conteneur qui contient encore des colis en cours est refusé." }),
    ],
    exporter: {
      nom: "conteneurs",
      ligne: (c) => ({
        "N° conteneur": c.containerNumber,
        Nom: c.name || "",
        État: STATUTS_CONTENEUR[c.status]?.libelle || c.status,
        Départ: jour(c.actualDeparture || c.departureDate),
        Arrivée: jour(c.actualArrival || c.arrivalDate),
        Colis: c.packagesCount ?? "",
        Capacité: c.capacity ?? "",
        Envois: c.shipmentsCount ?? "",
        "Encaissé (€)": arrondi(c.paidAmount),
        "À encaisser (€)": arrondi(Math.max(0, (c.totalAmount || 0) - (c.paidAmount || 0))),
      }),
    },
  };
}
