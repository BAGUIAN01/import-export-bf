"use client";

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDevise } from "@/lib/devises";
import { libelleMode } from "@/lib/caisse/paiement";
import { nomAffiche } from "@/lib/caisse/clients";

const VERT = "#0E7A55";
// Helvetica (police intégrée du PDF) n'a pas les espaces fines : espace normale
const texte = (s) => String(s ?? "").replace(/[  ]/g, " ");
const montant = (euros, agence) => texte(formatDevise(euros, agence));
const date = (d) =>
  new Date(d || Date.now()).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const s = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica", fontSize: 10, color: "#0F1714" },
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: VERT },
  marque: { flexDirection: "row", alignItems: "center" },
  logo: { width: 36, height: 36, borderRadius: 6, marginRight: 10 },
  nom: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  sous: { fontSize: 8, color: "#5B6B64", marginTop: 2 },
  titre: { fontSize: 13, fontFamily: "Helvetica-Bold", color: VERT, textAlign: "right" },
  numero: { fontSize: 8, color: "#5B6B64", marginTop: 2, textAlign: "right" },
  colonnes: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 14 },
  colonne: { width: "48%" },
  rubrique: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#5B6B64", textTransform: "uppercase", marginBottom: 5 },
  ligne: { flexDirection: "row", marginBottom: 3 },
  libelle: { width: 72, color: "#5B6B64" },
  valeur: { flex: 1, fontFamily: "Helvetica-Bold" },
  tableau: { borderWidth: 1, borderColor: "#E3E8E5", borderRadius: 6, marginBottom: 14 },
  tete: { flexDirection: "row", backgroundColor: "#F5F7F6", paddingVertical: 6, paddingHorizontal: 10, fontFamily: "Helvetica-Bold", fontSize: 8, color: "#5B6B64" },
  rang: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: "#EEF1EF" },
  cDesc: { flex: 1 },
  cNum: { width: 110 },
  cQte: { width: 40, textAlign: "right" },
  totaux: { borderWidth: 1, borderColor: "#E3E8E5", borderRadius: 6, marginBottom: 18 },
  total: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: "#EEF1EF" },
  encaisse: { backgroundColor: "#E7F4EE" },
  fort: { fontFamily: "Helvetica-Bold" },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  signature: { width: "45%", borderTopWidth: 1, borderTopColor: "#9AA5A0", paddingTop: 4, fontSize: 8, color: "#5B6B64" },
  pied: { position: "absolute", bottom: 22, left: 32, right: 32, textAlign: "center", fontSize: 7, color: "#9AA5A0" },
});

/**
 * Bon de remise d'un retrait : qui a retiré quels colis, ce qui a été
 * encaissé (dans la devise de l'agence), signatures.
 */
export function BonRemisePDF({ envoi, agence, conteneur, montantDevise, mode, agent, logoDataUrl }) {
  const colis = envoi.packages || [];
  const nbColis = colis.reduce((t, c) => t + (c.totalQuantity || 1), 0);
  const symbole = agence?.devise === "XOF" ? "FCFA" : agence?.devise || "EUR";
  const encaisse = montantDevise > 0 ? `${texte(new Intl.NumberFormat("fr-FR").format(montantDevise))} ${symbole}` : null;
  const reste = Math.max(0, (envoi.totalAmount || 0) - (envoi.paidAmount || 0));

  return (
    <Document title={`Bon de remise ${envoi.shipmentNumber}`}>
      <Page size="A5" style={s.page}>
        <View style={s.entete}>
          <View style={s.marque}>
            {logoDataUrl && <Image src={logoDataUrl} style={s.logo} />}
            <View>
              <Text style={s.nom}>Import Export BF</Text>
              <Text style={s.sous}>{texte([agence?.nom, agence?.ville].filter(Boolean).join(" · "))}</Text>
            </View>
          </View>
          <View>
            <Text style={s.titre}>Bon de remise</Text>
            <Text style={s.numero}>{envoi.shipmentNumber}</Text>
            <Text style={s.numero}>{date(envoi.deliveredAt)}</Text>
          </View>
        </View>

        <View style={s.colonnes}>
          <View style={s.colonne}>
            <Text style={s.rubrique}>Remis à</Text>
            <View style={s.ligne}>
              <Text style={s.libelle}>Nom</Text>
              <Text style={s.valeur}>{texte(envoi.receivedBy)}</Text>
            </View>
            <View style={s.ligne}>
              <Text style={s.libelle}>Pièce</Text>
              <Text style={s.valeur}>{texte(envoi.receivedIdNumber || "—")}</Text>
            </View>
            <View style={s.ligne}>
              <Text style={s.libelle}>Destinataire</Text>
              <Text style={s.valeur}>{texte(envoi.client?.recipientName || "—")}</Text>
            </View>
          </View>
          <View style={s.colonne}>
            <Text style={s.rubrique}>Envoi</Text>
            <View style={s.ligne}>
              <Text style={s.libelle}>Expéditeur</Text>
              <Text style={s.valeur}>{texte(nomAffiche(envoi.client))}</Text>
            </View>
            <View style={s.ligne}>
              <Text style={s.libelle}>Conteneur</Text>
              <Text style={s.valeur}>{texte(conteneur?.containerNumber || "—")}</Text>
            </View>
            <View style={s.ligne}>
              <Text style={s.libelle}>Agent</Text>
              <Text style={s.valeur}>{texte(agent || "—")}</Text>
            </View>
          </View>
        </View>

        <View style={s.tableau}>
          <View style={s.tete}>
            <Text style={s.cDesc}>Colis</Text>
            <Text style={s.cNum}>N°</Text>
            <Text style={s.cQte}>Qté</Text>
          </View>
          {colis.map((c) => (
            <View key={c.id} style={s.rang} wrap={false}>
              <Text style={s.cDesc}>{texte(c.description)}</Text>
              <Text style={s.cNum}>{c.packageNumber}</Text>
              <Text style={s.cQte}>{c.totalQuantity}</Text>
            </View>
          ))}
        </View>

        <View style={s.totaux}>
          <View style={[s.total, { borderTopWidth: 0 }]}>
            <Text>Montant de l&apos;envoi</Text>
            <Text style={s.fort}>{montant(envoi.totalAmount, agence)}</Text>
          </View>
          {encaisse && (
            <View style={[s.total, s.encaisse]}>
              <Text>Encaissé au retrait · {libelleMode(mode)}</Text>
              <Text style={s.fort}>{encaisse}</Text>
            </View>
          )}
          <View style={s.total}>
            <Text>{reste > 0.009 ? "Reste dû" : "Statut"}</Text>
            <Text style={s.fort}>{reste > 0.009 ? montant(reste, agence) : "Soldé"}</Text>
          </View>
        </View>

        <View style={s.signatures}>
          <Text style={s.signature}>Signature de l&apos;agent</Text>
          <Text style={s.signature}>Signature de la personne qui retire</Text>
        </View>

        <Text style={s.pied} fixed>
          {texte(`${nbColis} colis remis en bon état. Document à conserver.`)}
        </Text>
      </Page>
    </Document>
  );
}
