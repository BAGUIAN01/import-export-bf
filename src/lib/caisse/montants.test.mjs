// node --test src/lib/caisse/montants.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  arrondi,
  formatMontant,
  saisieVersNombre,
  toucheClavier,
  calculerRemise,
  repartirPaiement,
  montantsRapides,
  initiales,
} from "./montants.js";

test("arrondi au centime", () => {
  assert.equal(arrondi(0.1 + 0.2), 0.3);
  assert.equal(arrondi(1.005), 1.01);
});

test("format euro", () => {
  assert.equal(formatMontant(1234.5), "1 234,50 €");
  assert.equal(formatMontant(0), "0,00 €");
});

test("saisie → nombre", () => {
  assert.equal(saisieVersNombre("12,5"), 12.5);
  assert.equal(saisieVersNombre(""), 0);
  assert.equal(saisieVersNombre("abc"), 0);
});

test("clavier : montant", () => {
  let s = "";
  for (const t of ["0", "0", "1", "2", ",", "5", "0", "9"]) s = toucheClavier(s, t);
  assert.equal(s, "12,50");
  assert.equal(toucheClavier("12,50", "⌫"), "12,5");
  assert.equal(toucheClavier("", ","), "0,");
  assert.equal(toucheClavier("12", "00"), "1200");
  assert.equal(toucheClavier("12,5", "00"), "12,50");
});

test("clavier : quantité entière", () => {
  assert.equal(toucheClavier("3", ",", { decimales: 0 }), "3");
  assert.equal(toucheClavier("999", "9", { decimales: 0, longueurMax: 3 }), "999");
});

test("remise", () => {
  assert.equal(calculerRemise(200, { type: "pourcent", valeur: 10 }), 20);
  assert.equal(calculerRemise(200, { type: "montant", valeur: 50 }), 50);
  assert.equal(calculerRemise(30, { type: "montant", valeur: 50 }), 30);
  assert.equal(calculerRemise(200, null), 0);
});

test("répartition du paiement", () => {
  assert.deepEqual(repartirPaiement(150, 200, "ESPECES"), { paye: 150, monnaie: 50, reste: 0 });
  assert.deepEqual(repartirPaiement(150, 100, "CARTE"), { paye: 100, monnaie: 0, reste: 50 });
  assert.deepEqual(repartirPaiement(150, 500, "CARTE"), { paye: 150, monnaie: 0, reste: 0 });
  assert.deepEqual(repartirPaiement(150, 80, "ARRIVEE"), { paye: 0, monnaie: 0, reste: 150 });
});

test("montants rapides", () => {
  assert.deepEqual(montantsRapides(137.5), [137.5, 140, 150, 200]);
  assert.deepEqual(montantsRapides(0), []);
});

test("initiales", () => {
  assert.equal(initiales("OUEDRAOGO Rasmata"), "OR");
  assert.equal(initiales("Ali"), "A");
  assert.equal(initiales(""), "?");
});
