// node --test src/lib/telephone.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formaterNational,
  versInternational,
  lireTelephone,
  normaliserTelephone,
  telephoneValide,
  affichageTelephone,
  rechercheTelephone,
} from "./telephone.js";

test("format national par pays", () => {
  assert.equal(formaterNational("0612345678", "FR"), "06 12 34 56 78");
  assert.equal(formaterNational("70123456", "BF"), "70 12 34 56");
  // coupé à la longueur du pays
  assert.equal(formaterNational("7012345699", "BF"), "70 12 34 56");
});

test("vers le format international", () => {
  assert.equal(versInternational("06 12 34 56 78", "FR"), "+33612345678");
  assert.equal(versInternational("70 12 34 56", "BF"), "+22670123456");
  assert.equal(versInternational("", "BF"), "");
});

test("lecture d'une valeur stockée", () => {
  assert.deepEqual(lireTelephone("+22670123456"), { iso2: "BF", national: "70 12 34 56" });
  assert.deepEqual(lireTelephone("+33612345678"), { iso2: "FR", national: "06 12 34 56 78" });
  assert.deepEqual(lireTelephone("0612345678", "FR"), { iso2: "FR", national: "06 12 34 56 78" });
  assert.deepEqual(lireTelephone("", "BF"), { iso2: "BF", national: "" });
  assert.equal(lireTelephone("+2257").iso2, "CI");
});

test("normalisation d'une saisie libre", () => {
  assert.equal(normaliserTelephone("06 12 34 56 78", "FR"), "+33612345678");
  assert.equal(normaliserTelephone("0022670123456", "FR"), "+22670123456");
});

test("validité", () => {
  assert.equal(telephoneValide("+33612345678"), true);
  assert.equal(telephoneValide("+22670123456"), true);
  assert.equal(telephoneValide("+3361234"), false);
});

test("affichage", () => {
  assert.equal(affichageTelephone("+22670123456"), "+226 70 12 34 56");
  assert.equal(affichageTelephone("+33612345678"), "+33 6 12 34 56 78");
  assert.equal(affichageTelephone("n'importe quoi"), "n'importe quoi");
});

test("recherche par téléphone", () => {
  assert.equal(rechercheTelephone("06 12 34 56 78"), "612345678");
  assert.equal(rechercheTelephone("+226 70 12"), "2267012");
  assert.equal(rechercheTelephone("Ouedraogo"), null);
  assert.equal(rechercheTelephone("06"), null);
});
