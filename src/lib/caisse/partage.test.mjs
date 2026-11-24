// node --test src/lib/caisse/partage.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { lienSms, lienSuivi, lienWhatsApp, messageSuivi, numeroInternational } from "./partage.js";

test("lien de suivi", () => {
  assert.equal(lienSuivi("https://naange.fr/", "SHP202600032"), "https://naange.fr/tracking?q=SHP202600032");
});

test("message pour l'expéditeur et pour le destinataire", () => {
  const base = { prenom: "Ali", numero: "SHP1", nbColis: 3, total: 170, lien: "https://x/t" };
  const exp = messageSuivi(base);
  assert.match(exp, /^Bonjour Ali, votre envoi de 3 colis est enregistré/);
  assert.match(exp, /170,00 €/);
  assert.doesNotMatch(exp, /Reste/);
  assert.match(exp, /https:\/\/x\/t$/);
  const dest = messageSuivi({ ...base, pour: "destinataire", prenom: "Moussa", reste: 50.5 });
  assert.match(dest, /^Bonjour Moussa, un envoi de 3 colis est en route pour vous/);
  assert.match(dest, /Reste à payer : 50,50 € au retrait\./);
});

test("colis ajoutés à un envoi en cours", () => {
  const base = { prenom: "Sophie", numero: "SHP33", nbColis: 2, total: 130, lien: "L", ajout: true };
  assert.match(messageSuivi(base), /^Bonjour Sophie, 2 colis ont été ajoutés à votre envoi chez Naange Envoi : n° de suivi SHP33, montant de l'ajout 130,00 €\./);
  assert.match(messageSuivi({ ...base, pour: "destinataire", prenom: "Aminata" }), /^Bonjour Aminata, 2 colis de plus sont en route pour vous avec Naange Envoi \(envoi n° SHP33\)\./);
});

test("numéros pour WhatsApp et SMS", () => {
  assert.equal(numeroInternational("+33612345678"), "33612345678");
  assert.equal(numeroInternational("06 12 34 56 78"), "33612345678");
  assert.equal(numeroInternational("70 96 61 35", "BF"), "22670966135");
  assert.equal(numeroInternational("+226 70 96 61 35"), "22670966135");
  assert.equal(numeroInternational(""), null);
  assert.equal(lienWhatsApp("+22670966135", "Bonjour à vous"), "https://wa.me/22670966135?text=Bonjour%20%C3%A0%20vous");
  assert.equal(lienWhatsApp(null, "x"), "https://wa.me/?text=x");
  assert.equal(lienSms("0612345678", "a b"), "sms:+33612345678?&body=a%20b");
});
