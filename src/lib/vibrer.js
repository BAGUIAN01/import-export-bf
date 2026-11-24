// lib/vibrer.js : retour tactile court (Android ; sans effet ailleurs).

export const VIBRATIONS = {
  leger: 10, // un geste franchit son seuil (tirer, glisser, appui long)
  succes: [12, 60, 18], // encaissement, remise, envoi enregistré
  erreur: [40, 50, 40],
};

export function vibrer(motif = VIBRATIONS.leger) {
  try {
    navigator.vibrate?.(motif);
  } catch {
    /* non pris en charge */
  }
}
