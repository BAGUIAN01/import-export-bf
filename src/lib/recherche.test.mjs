// node --test src/lib/recherche.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { actionsResultat, analyserRecherche, extraireDuQR, pagesCorrespondantes, pertinence, rechercheUtile, typesVisibles } from "./recherche.js";

test("QR du bordereau, douchette, référence", () => {
  assert.equal(extraireDuQR("https://naange.vercel.app/tracking?q=SHP202600032"), "SHP202600032");
  assert.equal(extraireDuQR("http://localhost:3000/tracking?q=SHP202600032"), "SHP202600032");
  assert.equal(extraireDuQR("https://site.fr/bordereau/SHP202600031"), "SHP202600031");
  assert.equal(extraireDuQR("BRD-SHP202600031"), "SHP202600031");
  assert.equal(extraireDuQR("  PKG202600075 "), "PKG202600075");
});

test("numéros de l'application", () => {
  assert.deepEqual(analyserRecherche("shp202600032").code, { type: "envoi", valeur: "SHP202600032" });
  assert.deepEqual(analyserRecherche("PKG 202600075").code, { type: "colis", valeur: "PKG202600075" });
  assert.deepEqual(analyserRecherche("cnt-202604383").code, { type: "conteneur", valeur: "CNT202604383" });
  assert.deepEqual(analyserRecherche("CLI015").code, { type: "client", valeur: "CLI015" });
  assert.equal(analyserRecherche("https://x.fr/tracking?q=SHP202600032").code.valeur, "SHP202600032");
});

test("téléphones sous toutes les formes", () => {
  assert.equal(analyserRecherche("70 96 61 35").telephone, "70966135");
  assert.equal(analyserRecherche("+226 70 96 61 35").telephone, "22670966135");
  assert.equal(analyserRecherche("06 12 34 56 78").telephone, "612345678");
  assert.equal(analyserRecherche("0033612345678").telephone, "33612345678");
  assert.equal(analyserRecherche("Moussa").telephone, null);
});

test("noms sans accents, dans le désordre, type en tête", () => {
  const a = analyserRecherche("Ouédraogo  Moussa");
  assert.deepEqual(a.mots, ["ouedraogo", "moussa"]);
  assert.equal(a.type, null);
  const b = analyserRecherche("colis 0071");
  assert.equal(b.type, "colis");
  assert.equal(b.chiffres, "0071");
  assert.deepEqual(analyserRecherche("Envoi de Traoré").mots, ["traore"]);
  assert.equal(rechercheUtile(analyserRecherche("a")), false);
  assert.equal(rechercheUtile(analyserRecherche("ab")), true);
});

test("pertinence : début de mot, numéro exact, téléphone", () => {
  const a = analyserRecherche("ouedr");
  assert.ok(pertinence("moussa ouedraogo", a) > pertinence("sawadogo kouedr", a));
  const c = analyserRecherche("SHP202600032");
  assert.ok(pertinence("shp202600032", c, { numero: "SHP202600032" }) >= 100);
  const t = analyserRecherche("70 96 61 35");
  assert.ok(pertinence("moussa 22670966135", t) >= 5);
});

test("pages proposées selon le profil", () => {
  const tarifs = analyserRecherche("tarif");
  assert.deepEqual(pagesCorrespondantes(tarifs, "ADMIN").map((p) => p.id), ["tarifs"]);
  assert.deepEqual(pagesCorrespondantes(tarifs, "AGENT"), []);
  assert.deepEqual(pagesCorrespondantes(analyserRecherche("retrait"), "AGENT").map((p) => p.id), ["retraits"]);
  assert.ok(pagesCorrespondantes(analyserRecherche("caisse"), "STAFF").some((p) => p.id === "caisse"));
});

test("types visibles par profil", () => {
  assert.deepEqual(typesVisibles("ADMIN"), ["client", "envoi", "colis", "conteneur"]);
  assert.deepEqual(typesVisibles("AGENT"), ["envoi", "colis"]);
  assert.ok(!typesVisibles("STAFF").includes("colis"));
  assert.deepEqual(typesVisibles("CLIENT"), []);
});

test("où mène un résultat", () => {
  const client = { type: "client", id: "c1", client: { id: "c1" } };
  assert.equal(actionsResultat(client, "ADMIN").principale.href, "/admin/clients/c1");
  assert.equal(actionsResultat(client, "ADMIN").secondaire.libelle, "Nouvel envoi");
  assert.equal(actionsResultat(client, "STAFF").principale.href, "/admin/caisse/commande");
  assert.equal(actionsResultat(client, "STAFF").principale.depot.cle, "caisse:ouvrir-client");

  const arrive = { type: "envoi", id: "e1", destinataire: "Moussa", conteneur: { id: "k1", status: "DELIVERED" }, client: { id: "c1" } };
  assert.equal(actionsResultat(arrive, "ADMIN").principale.href, "/admin/shipments/e1");
  assert.equal(actionsResultat(arrive, "ADMIN").secondaire.libelle, "Retrait");
  assert.equal(actionsResultat(arrive, "AGENT").principale.href, "/admin/retraits/colis");
  assert.deepEqual(actionsResultat(arrive, "AGENT").principale.depot.valeur, { envoiId: "e1", conteneurId: "k1", nom: "Moussa" });
  assert.equal(actionsResultat({ ...arrive, deliveredAt: "2026-11-24" }, "AGENT").principale.libelle, "Bon de remise");

  const enRoute = { ...arrive, conteneur: { id: "k1", status: "IN_TRANSIT" } };
  assert.equal(actionsResultat(enRoute, "AGENT").principale, null);
  assert.equal(actionsResultat(enRoute, "STAFF").principale.libelle, "Nouvel envoi");

  const colis = { type: "colis", id: "p1", envoi: { ...arrive } };
  assert.equal(actionsResultat(colis, "TRACKER").principale.href, "/admin/shipments/e1");
  assert.equal(actionsResultat(colis, "AGENT").principale.libelle, "Retrait");
});

test("surlignage sans accents ni majuscules", async () => {
  const { segmentsSurlignes, termesSurlignes } = await import("./recherche.js");
  assert.deepEqual(segmentsSurlignes("Moussa Ouédraogo", ["ouedr"]), [
    { texte: "Moussa ", fort: false },
    { texte: "Ouédr", fort: true },
    { texte: "aogo", fort: false },
  ]);
  assert.deepEqual(segmentsSurlignes("SHP202600032", termesSurlignes(analyserRecherche("shp202600032"))), [{ texte: "SHP202600032", fort: true }]);
  assert.deepEqual(segmentsSurlignes("abc", []), [{ texte: "abc", fort: false }]);
  assert.deepEqual(termesSurlignes(analyserRecherche("colis 0071")), ["0071"]);
});
