// node --test src/lib/retraits.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { resteEnvoi, paiementEnEuros, remisePossible } from "./retraits.js";

const ouaga = { devise: "XOF", pariteFixe: true };

test("reste dû", () => {
  assert.equal(resteEnvoi({ totalAmount: 217.24, paidAmount: 100 }), 117.24);
  assert.equal(resteEnvoi({ totalAmount: 100, paidAmount: 120 }), 0);
});

test("paiement en FCFA → euros", () => {
  const envoi = { totalAmount: 217.24, paidAmount: 0 };
  assert.equal(paiementEnEuros(142500, envoi, ouaga), 217.24); // montant exact affiché
  assert.equal(paiementEnEuros(200000, envoi, ouaga), 217.24); // jamais plus que le reste
  assert.equal(paiementEnEuros(65596, envoi, ouaga), 100); // acompte
});

test("remise possible", () => {
  const colis = [{ id: "a" }, { id: "b" }];
  assert.equal(remisePossible({ colis, verifies: ["a", "b"], reste: 0, nom: "Issa" }), true);
  assert.equal(remisePossible({ colis, verifies: ["a"], reste: 0, nom: "Issa" }), false);
  assert.equal(remisePossible({ colis, verifies: ["a", "b"], reste: 10, nom: "Issa" }), false);
  assert.equal(remisePossible({ colis, verifies: ["a", "b"], reste: 0, nom: " " }), false);
});
