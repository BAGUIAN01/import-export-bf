// lib/caisse/partage.js : envoyer le suivi au client (WhatsApp, SMS, partage).
// Fonctions pures. Vérifiables avec : node --test src/lib/caisse/partage.test.mjs

import { chiffres, normaliserTelephone } from "../telephone.js";

/** Lien public de suivi d'un envoi. */
export function lienSuivi(origine, numero) {
  return `${String(origine || "").replace(/\/$/, "")}/tracking?q=${encodeURIComponent(numero)}`;
}

const euros = (n) =>
  `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0).replace(/\s/g, " ")} €`;

/**
 * Message de suivi, pour l'expéditeur (qui vient d'envoyer) ou pour le
 * destinataire (qui va recevoir) : n° de suivi, colis, montant, reste, lien.
 * Le prénom et le pluriel se lisent comme un message écrit à la main.
 */
export function messageSuivi({ pour = "expediteur", prenom, numero, nbColis, total, reste = 0, lien, ajout = false }) {
  const bonjour = prenom ? `Bonjour ${prenom},` : "Bonjour,";
  const colis = `${nbColis} colis`;
  // `ajout` : colis ajoutés à un envoi déjà en cours (même client, même conteneur)
  const corps =
    pour === "destinataire"
      ? ajout
        ? `${colis} de plus sont en route pour vous avec Naange Envoi (envoi n° ${numero}).`
        : `un envoi de ${colis} est en route pour vous avec Naange Envoi (n° ${numero}).`
      : ajout
        ? `${colis} ont été ajoutés à votre envoi chez Naange Envoi : n° de suivi ${numero}, montant de l'ajout ${euros(total)}.`
        : `votre envoi de ${colis} est enregistré chez Naange Envoi : n° de suivi ${numero}, montant ${euros(total)}.`;
  const resteTexte = reste > 0.009 ? ` Reste à payer : ${euros(reste)}${pour === "destinataire" ? " au retrait" : ""}.` : "";
  return `${bonjour} ${corps}${resteTexte} Suivez-le ici : ${lien}`;
}

/**
 * Numéro pour WhatsApp (chiffres de l'international, sans « + ») ;
 * `isoParDefaut` sert aux numéros saisis sans indicatif. null si inutilisable.
 */
export function numeroInternational(telephone, isoParDefaut = "FR") {
  const v = String(telephone ?? "").trim();
  if (!v) return null;
  const d = chiffres(normaliserTelephone(v, isoParDefaut));
  return d.length >= 8 ? d : null;
}

/** Lien WhatsApp vers un numéro (ou au choix du contact si pas de numéro). */
export function lienWhatsApp(telephone, texte, isoParDefaut = "FR") {
  const n = numeroInternational(telephone, isoParDefaut);
  return `https://wa.me/${n || ""}?text=${encodeURIComponent(texte)}`;
}

/** Lien SMS (« ?&body= » est compris par Android et iPhone). */
export function lienSms(telephone, texte, isoParDefaut = "FR") {
  const n = numeroInternational(telephone, isoParDefaut);
  return `sms:${n ? `+${n}` : ""}?&body=${encodeURIComponent(texte)}`;
}
