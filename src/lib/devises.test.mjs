// node --test src/lib/devises.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { tauxAgence, versDevise, versReference, formatDevise, libelleTaux } from "./devises.js";

const paris = { devise: "EUR" };
const ouaga = { devise: "XOF", pariteFixe: true, taux: 1 };
const usd = { devise: "USD", pariteFixe: false, taux: 1.08 };

test("taux", () => {
  assert.equal(tauxAgence(paris), 1);
  assert.equal(tauxAgence(ouaga), 655.957);
  assert.equal(tauxAgence(usd), 1.08);
  assert.equal(tauxAgence({ devise: "XOF", pariteFixe: false, taux: 650 }), 650);
});

test("conversions", () => {
  assert.equal(versDevise(217.24, ouaga), 142500);
  assert.equal(versDevise(100, paris), 100);
  assert.equal(versReference(142500, ouaga), 217.24);
  assert.equal(versReference(108, usd), 100);
});

test("affichage", () => {
  assert.equal(formatDevise(100, ouaga), "65 596 FCFA");
  assert.equal(formatDevise(12.5, paris), "12,50 €");
  assert.equal(libelleTaux(ouaga), "1 € = 655,957 FCFA");
  assert.equal(libelleTaux(paris), "Devise de référence");
});
