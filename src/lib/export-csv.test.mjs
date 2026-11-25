// node --test src/lib/export-csv.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { nomFichierCsv, versCsv } from "./export-csv.js";

test("CSV pour Excel en français", () => {
  const csv = versCsv([
    { "N°": "PKG1", Description: "Carton; fragile", Montant: 40.5 },
    { "N°": "PKG2", Description: 'Valise "cabine"', Montant: 120, Client: "Ouédraogo" },
  ]);
  assert.equal(
    csv,
    ['N°;Description;Montant;Client', 'PKG1;"Carton; fragile";40,5;', 'PKG2;"Valise ""cabine""";120;Ouédraogo'].join("\r\n")
  );
});

test("valeurs vides et nom du fichier", () => {
  assert.equal(versCsv([{ A: null, B: undefined, C: Number.NaN }]), "A;B;C\r\n;;");
  assert.equal(nomFichierCsv("colis", new Date(2026, 10, 5)), "colis-2026-11-05.csv");
});
