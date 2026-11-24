// app/api/recherche/route.js : recherche générale (barre de recherche, scanneur).
// GET /api/recherche?q=… → résultats groupés et classés, limités au profil.
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";
import { ROLES_PERSONNEL } from "@/lib/rbac";
import { analyserRecherche, normaliser, pertinence, rechercheUtile, typesVisibles } from "@/lib/recherche";
import { STATUTS_CONTENEUR } from "@/lib/conteneurs";
import { affichageTelephone } from "@/lib/telephone";

const PAR_GROUPE = 6;
const CANDIDATS = 30;

// Accents → lettres simples, en SQL comme en JS (même table, caractère pour caractère)
const AVEC = "àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ";
const SANS = [...AVEC].map((c) => normaliser(c)).join("");
const norm = (expr) => Prisma.sql`lower(translate(${expr}, ${AVEC}, ${SANS}))`;
const chiffresDe = (col) => Prisma.raw(`regexp_replace(coalesce(${col}, ''), '\\D', '', 'g')`);

// Tolérance aux fautes (« Ouedrago », « Sawadgo ») si l'extension pg_trgm est là
let trigrammes;
function avecTrigrammes() {
  trigrammes ??= prisma
    .$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'`
    .then((r) => r.length > 0)
    .catch(() => false);
  return trigrammes;
}

/** Chaque mot doit se trouver dans le texte (ou lui ressembler, mots de 4 lettres et plus). */
function tousLesMots(texte, mots, flou) {
  return Prisma.join(
    mots.map((m) =>
      flou && m.length >= 4
        ? Prisma.sql`(${texte} LIKE ${`%${m}%`} OR word_similarity(${m}, ${texte}) >= 0.5)`
        : Prisma.sql`${texte} LIKE ${`%${m}%`}`
    ),
    " AND "
  );
}

const ou = (conditions) => {
  const c = conditions.filter(Boolean);
  return c.length ? Prisma.sql`(${Prisma.join(c, " OR ")})` : null;
};

// Texte d'un client : noms, villes, code, e-mail, téléphones en chiffres
const TEXTE_CLIENT = (a) =>
  norm(
    Prisma.raw(
      `concat_ws(' ', ${a}."firstName", ${a}."lastName", ${a}."company", ${a}."recipientName", ${a}."city", ${a}."recipientCity", ${a}."clientCode", ${a}."email", regexp_replace(${a}."phone", '\\D', '', 'g'), regexp_replace(coalesce(${a}."recipientPhone", ''), '\\D', '', 'g'))`
    )
  );

function conditionClient(a, analyse, flou) {
  return ou([
    analyse.code?.type === "client" && Prisma.sql`upper(${Prisma.raw(`${a}."clientCode"`)}) = ${analyse.code.valeur}`,
    !analyse.code && analyse.mots.length && tousLesMots(TEXTE_CLIENT(a), analyse.mots, flou),
    analyse.telephone &&
      Prisma.sql`(${chiffresDe(`${a}."phone"`)} LIKE ${`%${analyse.telephone}%`} OR ${chiffresDe(`${a}."recipientPhone"`)} LIKE ${`%${analyse.telephone}%`})`,
  ]);
}

const nomClient = (c) => [c?.firstName, c?.lastName].filter(Boolean).join(" ") || c?.company || "Sans nom";
const ARRIVES = ["DELIVERED", "CUSTOMS"];
const TONS_CONTENEUR = { PREPARATION: "ambre", LOADED: "bleu", IN_TRANSIT: "bleu", CUSTOMS: "violet", DELIVERED: "vert", CANCELLED: "rouge" };
const STATUTS_COLIS = {
  REGISTERED: ["Enregistré", "gris"],
  COLLECTED: ["Collecté", "gris"],
  IN_CONTAINER: ["Au conteneur", "ambre"],
  IN_TRANSIT: ["En route", "bleu"],
  CUSTOMS: ["En douane", "violet"],
  DELIVERED: ["Livré", "vert"],
  RETURNED: ["Retourné", "rouge"],
  CANCELLED: ["Annulé", "rouge"],
};
const etatConteneur = (k) => (k ? { texte: STATUTS_CONTENEUR[k.status]?.libelle || k.status, ton: TONS_CONTENEUR[k.status] || "gris" } : null);

function etatEnvoi(e) {
  if (e.deliveredAt) return { texte: "Retiré", ton: "vert" };
  if ((e.totalAmount || 0) - (e.paidAmount || 0) > 0.009) return { texte: "Reste à payer", ton: "ambre" };
  return { texte: "Payé", ton: "vert" };
}

/**
 * Totaux des envois de chaque client (comme /api/clients) : la caisse affiche
 * le reste à payer sur la carte du client trouvé.
 */
async function avecTotaux(clients) {
  const ids = [...new Set(clients.filter(Boolean).map((c) => c.id))];
  if (!ids.length) return new Map();
  const sommes = await prisma.shipment.groupBy({
    by: ["clientId"],
    where: { clientId: { in: ids } },
    _sum: { totalAmount: true, paidAmount: true },
    _count: { _all: true },
  });
  return new Map(
    sommes.map((x) => [x.clientId, { totalShipmentsAmount: x._sum.totalAmount || 0, totalSpent: x._sum.paidAmount || 0, shipmentsCount: x._count._all }])
  );
}

/* ── Recherches par type ──────────────────────────────────── */

async function chercherClients(analyse, flou) {
  const condition = conditionClient("c", analyse, flou);
  if (!condition) return [];
  const ids = await prisma.$queryRaw`SELECT c.id FROM clients c WHERE ${condition} ORDER BY c."updatedAt" DESC LIMIT ${CANDIDATS}`;
  if (!ids.length) return [];
  const clients = await prisma.client.findMany({ where: { id: { in: ids.map((r) => r.id) } } });
  const totaux = await avecTotaux(clients);
  return clients.map((c) => ({
    type: "client",
    id: c.id,
    numero: c.clientCode,
    titre: nomClient(c),
    sousTitre: [affichageTelephone(c.phone), c.clientCode, c.city].filter(Boolean).join(" · "),
    details: c.recipientName ? `→ ${c.recipientName}${c.recipientCity ? ` · ${c.recipientCity}` : ""}` : null,
    etat: c.isVip ? { texte: "VIP", ton: "violet" } : null,
    client: { ...c, ...totaux.get(c.id) },
    _texte: normaliser(`${nomClient(c)} ${c.company || ""} ${c.recipientName || ""} ${c.city} ${c.recipientCity || ""} ${c.clientCode} ${c.phone} ${c.recipientPhone || ""}`.replace(/\+/g, "")),
    _date: c.updatedAt,
  }));
}

async function chercherEnvois(analyse, flou) {
  const condition = ou([
    analyse.code?.type === "envoi" && Prisma.sql`upper(s."shipmentNumber") = ${analyse.code.valeur}`,
    !analyse.code && analyse.chiffres && analyse.chiffres.length >= 3 && Prisma.sql`s."shipmentNumber" LIKE ${`%${analyse.chiffres}%`}`,
    analyse.code?.type !== "envoi" && analyse.code?.type !== "colis" && analyse.code?.type !== "conteneur" && conditionClient("c", analyse, flou),
  ]);
  if (!condition) return [];
  const ids = await prisma.$queryRaw`
    SELECT s.id FROM shipments s JOIN clients c ON c.id = s."clientId"
    WHERE ${condition} ORDER BY s."createdAt" DESC LIMIT ${CANDIDATS}`;
  if (!ids.length) return [];
  const envois = await prisma.shipment.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    include: { client: true, container: { select: { id: true, containerNumber: true, status: true } } },
  });
  const totaux = await avecTotaux(envois.map((e) => e.client));
  return envois.map((e) => ({
    type: "envoi",
    id: e.id,
    numero: e.shipmentNumber,
    titre: e.shipmentNumber,
    sousTitre: `${nomClient(e.client)} → ${e.client?.recipientName || "destinataire ?"}`,
    details: [`${e.packagesCount || 0} colis`, e.container ? `${e.container.containerNumber} · ${STATUTS_CONTENEUR[e.container.status]?.libelle || ""}` : "sans conteneur"].join(" · "),
    etat: etatEnvoi(e),
    destinataire: e.client?.recipientName || "",
    deliveredAt: e.deliveredAt,
    conteneur: e.container ? { id: e.container.id, numero: e.container.containerNumber, status: e.container.status } : null,
    client: e.client ? { ...e.client, ...totaux.get(e.client.id) } : null,
    _texte: normaliser(
      `${e.shipmentNumber} ${nomClient(e.client)} ${e.client?.recipientName || ""} ${e.client?.city || ""} ${e.client?.recipientCity || ""} ${e.client?.phone || ""} ${e.client?.recipientPhone || ""} ${e.client?.clientCode || ""}`.replace(/\+/g, "")
    ),
    _date: e.createdAt,
  }));
}

async function chercherColis(analyse, flou) {
  const condition = ou([
    analyse.code?.type === "colis" && Prisma.sql`upper(p."packageNumber") = ${analyse.code.valeur}`,
    !analyse.code && analyse.chiffres && analyse.chiffres.length >= 3 && Prisma.sql`p."packageNumber" LIKE ${`%${analyse.chiffres}%`}`,
    // Recherche dans les descriptions seulement si on demande des colis (« colis valise »)
    !analyse.code && analyse.type === "colis" && analyse.mots.length && !analyse.chiffres && tousLesMots(norm(Prisma.raw(`concat_ws(' ', p."description", p."packageNumber")`)), analyse.mots, flou),
  ]);
  if (!condition) return [];
  const ids = await prisma.$queryRaw`SELECT p.id FROM packages p WHERE ${condition} ORDER BY p."createdAt" DESC LIMIT ${CANDIDATS}`;
  if (!ids.length) return [];
  const colis = await prisma.package.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    include: {
      client: { select: { firstName: true, lastName: true, company: true, recipientName: true } },
      shipment: { select: { id: true, shipmentNumber: true, deliveredAt: true } },
      container: { select: { id: true, containerNumber: true, status: true } },
    },
  });
  return colis.map((p) => {
    const [libelle, ton] = STATUTS_COLIS[p.status] || [p.status, "gris"];
    return {
      type: "colis",
      id: p.id,
      numero: p.packageNumber,
      titre: p.packageNumber,
      sousTitre: `${p.description} · × ${p.totalQuantity}`,
      details: [nomClient(p.client), p.shipment?.shipmentNumber, p.container?.containerNumber].filter(Boolean).join(" · "),
      etat: { texte: libelle, ton },
      envoi: p.shipment
        ? {
            id: p.shipment.id,
            deliveredAt: p.shipment.deliveredAt,
            destinataire: p.client?.recipientName || "",
            conteneur: p.container ? { id: p.container.id, status: p.container.status } : null,
          }
        : null,
      _texte: normaliser(`${p.packageNumber} ${p.description}`),
      _date: p.createdAt,
    };
  });
}

async function chercherConteneurs(analyse, flou) {
  const texte = norm(
    Prisma.raw(`concat_ws(' ', k."containerNumber", k."name", k."sealNumber", k."currentLocation", k."origin", k."destination", k."transportCompany")`)
  );
  const condition = ou([
    analyse.code?.type === "conteneur" && Prisma.sql`upper(k."containerNumber") = ${analyse.code.valeur}`,
    !analyse.code && analyse.chiffres && analyse.chiffres.length >= 3 && Prisma.sql`k."containerNumber" LIKE ${`%${analyse.chiffres}%`}`,
    !analyse.code && !analyse.chiffres && analyse.mots.length && tousLesMots(texte, analyse.mots, flou),
  ]);
  if (!condition) return [];
  const ids = await prisma.$queryRaw`SELECT k.id FROM containers k WHERE ${condition} ORDER BY k."createdAt" DESC LIMIT ${CANDIDATS}`;
  if (!ids.length) return [];
  const conteneurs = await prisma.container.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    include: { _count: { select: { packages: true } } },
  });
  return conteneurs.map((k) => {
    const depart = k.actualDeparture || k.departureDate;
    return {
      type: "conteneur",
      id: k.id,
      numero: k.containerNumber,
      titre: k.containerNumber,
      sousTitre: k.name || `${k.origin} → ${k.destination}`,
      details: [`${k._count.packages} colis`, depart ? `départ ${new Date(depart).toLocaleDateString("fr-FR")}` : "départ à fixer", k.sealNumber ? `plomb ${k.sealNumber}` : null]
        .filter(Boolean)
        .join(" · "),
      etat: etatConteneur(k),
      _texte: normaliser(`${k.containerNumber} ${k.name || ""} ${k.sealNumber || ""} ${k.currentLocation || ""} ${k.origin} ${k.destination}`),
      _date: k.createdAt,
    };
  });
}

const RECHERCHES = { client: chercherClients, envoi: chercherEnvois, colis: chercherColis, conteneur: chercherConteneurs };
const TITRES = { envoi: "Envois", client: "Clients", colis: "Colis", conteneur: "Conteneurs" };

export async function GET(request) {
  const { session, refus } = await exigerSession(ROLES_PERSONNEL);
  if (refus) return refus;

  try {
    const q = new URL(request.url).searchParams.get("q") || "";
    const analyse = analyserRecherche(q.slice(0, 200));
    if (!rechercheUtile(analyse)) return NextResponse.json({ analyse, exact: null, groupes: [] });

    let types = typesVisibles(session.user.role);
    if (analyse.type) {
      // « CLI… » montre aussi les envois du client
      const voulus = analyse.code?.type === "client" ? ["client", "envoi"] : [analyse.type];
      types = types.filter((t) => voulus.includes(t));
    }
    const flou = await avecTrigrammes();

    const groupes = (
      await Promise.all(
        types.map(async (type) => {
          const resultats = (await RECHERCHES[type](analyse, flou))
            .map((r) => ({ ...r, score: pertinence(r._texte, analyse, { numero: r.numero }) }))
            .sort((a, b) => b.score - a.score || new Date(b._date) - new Date(a._date))
            .slice(0, PAR_GROUPE)
            .map(({ _texte, _date, ...r }) => r);
          return { type, titre: TITRES[type], resultats };
        })
      )
    )
      .filter((g) => g.resultats.length)
      // Le groupe le plus pertinent d'abord (un téléphone : les clients ; un n° de suivi : les envois)
      .sort((a, b) => b.resultats[0].score - a.resultats[0].score);

    const exact = analyse.code ? groupes.flatMap((g) => g.resultats).find((r) => r.type === analyse.code.type && r.score >= 100) || null : null;
    return NextResponse.json({ analyse, exact, groupes });
  } catch (error) {
    console.error("Recherche :", error);
    return NextResponse.json({ error: "La recherche n'a pas abouti." }, { status: 500 });
  }
}
