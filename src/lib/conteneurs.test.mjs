// node --test src/lib/conteneurs.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { corpsEtape, estRecul, actionSuivante } from "./conteneurs.js";

test("corps d'une étape", () => {
  assert.deepEqual(corpsEtape("LOADED", { plomb: " PL-123 " }), { status: "LOADED", sealNumber: "PL-123" });
  assert.deepEqual(corpsEtape("CUSTOMS"), { status: "CUSTOMS" });
  assert.equal(corpsEtape("IN_TRANSIT", { date: "2026-11-20" }).actualDeparture, new Date("2026-11-20").toISOString());
  assert.ok(corpsEtape("DELIVERED").actualArrival);
});

test("recul", () => {
  assert.equal(estRecul("CUSTOMS", "LOADED"), true);
  assert.equal(estRecul("LOADED", "IN_TRANSIT"), false);
});

test("action suivante", () => {
  assert.equal(actionSuivante("IN_TRANSIT").statut, "CUSTOMS");
  assert.equal(actionSuivante("DELIVERED"), null);
});
