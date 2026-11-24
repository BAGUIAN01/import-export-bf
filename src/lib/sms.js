// lib/sms.js : SMS automatiques aux clients (Twilio).
//
// Désactivés tant que le compte Twilio est en essai (trial) : il n'envoie
// qu'aux numéros vérifiés. Pour les réactiver : variable d'environnement
// NEXT_PUBLIC_SMS_CLIENTS=true (Vercel), puis redéployer.
// Les codes de connexion et de vérification par SMS ne dépendent pas de ce réglage.

export const SMS_CLIENTS_ACTIFS = process.env.NEXT_PUBLIC_SMS_CLIENTS === "true";
