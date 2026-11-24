// lib/recherche.js : recherche générale (fonctions pures, côté client et serveur).
// Comprend ce qui est tapé ou scanné, propose les pages, décide où mène un
// résultat selon le profil. Vérifiables avec : node --test src/lib/recherche.test.mjs

import { canAccess } from "./rbac.js";
import { rechercheTelephone } from "./telephone.js";

/** Minuscules sans accents : « Ouédraogo » → « ouedraogo ». */
export function normaliser(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Préfixes des numéros de l'application
export const CODES = { SHP: "envoi", PKG: "colis", CNT: "conteneur", CLI: "client" };
const MOTIF_CODE = /^(SHP|PKG|CNT|CLI)[\s-]?(\d{2,})$/i;

// Un mot en tête de recherche limite le type : « colis 0071 », « conteneur abidjan »
const TYPES_PAR_MOT = {
  client: "client", clients: "client", expediteur: "client", destinataire: "client",
  envoi: "envoi", envois: "envoi", expedition: "envoi", bordereau: "envoi", suivi: "envoi",
  colis: "colis", paquet: "colis",
  conteneur: "conteneur", conteneurs: "conteneur", container: "conteneur",
};

// Mots vides ignorés dans la recherche de noms
const MOTS_VIDES = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "et", "a", "au", "aux"]);

/**
 * Texte d'un QR code ou d'une douchette → ce qu'il faut chercher.
 * « https://…/tracking?q=SHP202600032 » → « SHP202600032 » ;
 * « …/bordereau/SHP202600032 » → « SHP202600032 » ; « BRD-SHP… » → « SHP… ».
 */
export function extraireDuQR(texte) {
  let t = String(texte ?? "").trim();
  if (/^https?:\/\//i.test(t) || /^[\w.-]+\.\w{2,}(:\d+)?\//.test(t)) {
    try {
      const url = new URL(/^https?:/i.test(t) ? t : `https://${t}`);
      const p = url.searchParams.get("q") || url.searchParams.get("code") || url.searchParams.get("numero");
      t = p || decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    } catch {
      /* pas une adresse : on garde le texte */
    }
  }
  return t.replace(/^BRD-/i, "").trim();
}

/**
 * Ce que veut dire la saisie : un numéro de l'application, un téléphone,
 * des chiffres (fin de numéro), des mots (noms, villes), un type demandé.
 */
export function analyserRecherche(saisie) {
  const texte = extraireDuQR(saisie);
  const resultat = { texte, code: null, telephone: null, chiffres: null, mots: [], type: null };
  if (!texte) return resultat;

  const compact = texte.replace(/\s+/g, "");
  const code = compact.match(MOTIF_CODE);
  if (code) {
    const prefixe = code[1].toUpperCase();
    resultat.code = { type: CODES[prefixe], valeur: `${prefixe}${code[2]}` };
    resultat.chiffres = code[2];
    resultat.type = CODES[prefixe];
    return resultat;
  }

  let mots = normaliser(texte)
    .split(/[^a-z0-9+]+/)
    .filter(Boolean);
  if (mots.length > 1 && TYPES_PAR_MOT[mots[0]]) {
    resultat.type = TYPES_PAR_MOT[mots[0]];
    mots = mots.slice(1);
  }
  const reste = mots.join(" ");

  resultat.telephone = rechercheTelephone(texte);
  if (/^\d[\d\s]*$/.test(reste) && reste.replace(/\s/g, "").length >= 3) resultat.chiffres = reste.replace(/\s/g, "");
  resultat.mots = mots.map((m) => m.replace(/^\+/, "")).filter((m) => m && !MOTS_VIDES.has(m));
  return resultat;
}

/** Assez pour chercher : un code, un téléphone, des chiffres ou au moins 2 lettres. */
export function rechercheUtile(analyse) {
  return !!(analyse.code || analyse.telephone || analyse.chiffres || analyse.mots.some((m) => m.length >= 2));
}

/**
 * Pertinence d'un résultat : chaque mot trouvé en début de mot compte plus
 * qu'au milieu ; un numéro exact passe devant tout.
 * `texte` : texte normalisé du résultat (noms, villes, numéros, téléphones en chiffres).
 */
export function pertinence(texte, analyse, { numero } = {}) {
  let score = 0;
  if (analyse.code && numero && numero.toUpperCase() === analyse.code.valeur) score += 100;
  const debuts = ` ${texte}`;
  for (const m of analyse.mots) {
    if (debuts.includes(` ${m}`)) score += 3;
    else if (texte.includes(m)) score += 2;
  }
  if (analyse.telephone && texte.replace(/\D/g, " ").includes(analyse.telephone)) score += 5;
  return score;
}

/* ── Pages proposées (« actions rapides ») ─────────────────── */

export const PAGES = [
  { id: "caisse", libelle: "Caisse · nouvel envoi", href: "/admin/caisse/client", icone: "caisse", mots: "caisse vendre encaisser nouvel envoi commande ticket" },
  { id: "recus", libelle: "Reçus du jour", href: "/admin/caisse/recus", icone: "recu", mots: "recus reçu jour reimprimer quittance" },
  { id: "caisse-conteneurs", libelle: "Conteneurs de la caisse", href: "/admin/caisse/conteneurs", icone: "conteneur", mots: "conteneur ouvrir fermer depart douane etape" },
  { id: "retraits", libelle: "Retraits à l'arrivée", href: "/admin/retraits", icone: "retrait", mots: "retrait remise remettre arrivee ouaga destinataire" },
  { id: "conteneurs", libelle: "Conteneurs", href: "/admin/containers", icone: "conteneur", mots: "conteneurs containers chargement transit manifeste" },
  { id: "colis", libelle: "Colis", href: "/admin/packages", icone: "colis", mots: "colis paquets packages" },
  { id: "clients", libelle: "Clients", href: "/admin/clients", icone: "client", mots: "clients expediteurs fiches" },
  { id: "encaissements", libelle: "Encaissements", href: "/admin/shipments", icone: "recu", mots: "encaissements envois paiements impayes reste payer" },
  { id: "tarifs", libelle: "Tarifs", href: "/admin/tarifs", icone: "tarif", mots: "tarifs prix articles familles catalogue" },
  { id: "tableau", libelle: "Tableau de bord", href: "/admin/dashboard", icone: "tableau", mots: "tableau bord statistiques chiffres" },
  { id: "utilisateurs", libelle: "Utilisateurs", href: "/admin/parametrage/utilisateurs", icone: "reglage", mots: "utilisateurs comptes personnel mot passe" },
  { id: "agences", libelle: "Agences et devises", href: "/admin/parametrage/agences", icone: "reglage", mots: "agences devises fcfa euro taux paris ouagadougou" },
  { id: "profils", libelle: "Profils et droits", href: "/admin/parametrage/profils", icone: "reglage", mots: "profils droits roles acces" },
  { id: "profil", libelle: "Mon profil", href: "/admin/profile", icone: "reglage", mots: "profil compte mot passe" },
];

/** Pages accessibles au profil dont le nom ou les mots-clés commencent par les mots tapés. */
export function pagesCorrespondantes(analyse, role, max = 4) {
  const accessibles = PAGES.filter((p) => canAccess(role, p.href));
  if (!analyse.mots.length) return [];
  return accessibles
    .map((p) => {
      const mots = ` ${normaliser(`${p.libelle} ${p.mots}`)}`;
      const ok = analyse.mots.every((m) => mots.includes(` ${m}`));
      return ok ? p : null;
    })
    .filter(Boolean)
    .slice(0, max);
}

/** Pages accessibles, pour la palette vide. */
export function pagesAccessibles(role) {
  return PAGES.filter((p) => canAccess(role, p.href));
}

/* ── Où mène un résultat, selon le profil ──────────────────── */

const ARRIVES = ["DELIVERED", "CUSTOMS"];

// Dépôts lus par la caisse et les retraits (voir caisse-context, retraits-context)
export const DEPOT_CAISSE = "caisse:ouvrir-client";
export const DEPOT_RETRAITS = "retraits:ouvrir";

function actionCaisse(client, role) {
  if (!client || !canAccess(role, "/admin/caisse")) return null;
  return { libelle: "Nouvel envoi", href: "/admin/caisse/commande", depot: { cle: DEPOT_CAISSE, valeur: client } };
}

function actionRetrait(envoi, role) {
  if (!envoi?.conteneur || !canAccess(role, "/admin/retraits")) return null;
  const valeur = { envoiId: envoi.id, conteneurId: envoi.conteneur.id, nom: envoi.destinataire || "" };
  if (envoi.deliveredAt) return { libelle: "Bon de remise", href: "/admin/retraits/fin", depot: { cle: DEPOT_RETRAITS, valeur } };
  if (ARRIVES.includes(envoi.conteneur.status)) return { libelle: "Retrait", href: "/admin/retraits/colis", depot: { cle: DEPOT_RETRAITS, valeur } };
  return null;
}

/**
 * Actions d'un résultat : `principale` (toucher la ligne, Entrée) et
 * `secondaire` (bouton à droite). Null si le profil ne peut rien en faire.
 */
export function actionsResultat(r, role) {
  const liste = [];
  const ajouter = (a) => a && !liste.some((x) => x.href === a.href) && liste.push(a);

  switch (r.type) {
    case "client":
      if (canAccess(role, "/admin/clients")) ajouter({ libelle: "Fiche", href: `/admin/clients/${r.id}` });
      ajouter(actionCaisse(r.client, role));
      break;
    case "envoi":
      if (canAccess(role, "/admin/shipments")) ajouter({ libelle: "Fiche", href: `/admin/shipments/${r.id}` });
      ajouter(actionRetrait(r, role));
      if (!liste.length) ajouter(actionCaisse(r.client, role));
      break;
    case "colis":
      if (r.envoi && canAccess(role, "/admin/shipments")) ajouter({ libelle: "Envoi", href: `/admin/shipments/${r.envoi.id}` });
      else if (canAccess(role, "/admin/packages")) ajouter({ libelle: "Colis", href: "/admin/packages" });
      ajouter(actionRetrait(r.envoi, role));
      break;
    case "conteneur":
      if (canAccess(role, "/admin/containers")) ajouter({ libelle: "Fiche", href: `/admin/containers/${r.id}` });
      else if (canAccess(role, "/admin/caisse/conteneurs")) ajouter({ libelle: "Conteneurs", href: "/admin/caisse/conteneurs" });
      break;
    case "page":
      ajouter({ libelle: "Ouvrir", href: r.href });
      break;
    default:
      break;
  }
  return { principale: liste[0] || null, secondaire: liste[1] || null };
}

/** Types visibles par profil (le serveur ne cherche que ceux-là). */
export function typesVisibles(role) {
  const gestion = canAccess(role, "/admin/shipments");
  const types = [];
  if (gestion || canAccess(role, "/admin/caisse")) types.push("client", "envoi");
  if (canAccess(role, "/admin/retraits") && !types.includes("envoi")) types.push("envoi");
  if (gestion || canAccess(role, "/admin/retraits")) types.push("colis");
  if (gestion || canAccess(role, "/admin/caisse/conteneurs")) types.push("conteneur");
  return types;
}
