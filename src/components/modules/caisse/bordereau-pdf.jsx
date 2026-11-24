import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMontant } from "@/lib/caisse/montants";
import { affichageTelephone } from "@/lib/telephone";

/*
 * Bordereau d'envoi remis au client à la caisse.
 * Pensé pour l'impression : fond blanc, l'encre va au texte. Une seule
 * touche de couleur (le filet sous l'en-tête) ; le sens ne repose jamais
 * sur la couleur, il reste lisible sur une imprimante noir et blanc.
 */

const ENCRE = "#0F1714";
const DOUX = "#5B6B64";
const FILET = "#D5DCD8";
const VERT = "#0E7A55";

// Helvetica (police intégrée du PDF) n'a ni espace fine ni signe moins typographique
const texte = (s) => String(s ?? "").replace(/[  ]/g, " ").replace(/−/g, "-");
const euros = (n) => texte(formatMontant(n || 0));
const tel = (v) => texte(affichageTelephone(v)) || "—";

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9.5, color: ENCRE },

  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  marque: { flexDirection: "row", alignItems: "center", maxWidth: 300 },
  logo: { width: 42, height: 42, marginRight: 10 },
  societe: { fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 0.3, lineHeight: 1.2 },
  slogan: { fontSize: 8.5, color: DOUX, marginTop: 2 },
  contacts: { fontSize: 8, color: DOUX, marginTop: 3 },
  document: { alignItems: "flex-end" },
  typeDoc: { fontSize: 7.5, color: DOUX, letterSpacing: 1.2, textTransform: "uppercase" },
  suivi: { fontSize: 19, fontFamily: "Helvetica-Bold", marginTop: 3, letterSpacing: 0.4, lineHeight: 1.2 },
  dateDoc: { fontSize: 8.5, color: DOUX, marginTop: 3 },
  filetVert: { height: 1.5, backgroundColor: VERT, marginTop: 14 },

  bande: { flexDirection: "row", marginTop: 14, borderWidth: 0.75, borderColor: FILET, borderRadius: 6 },
  cellule: { flex: 1, paddingVertical: 7, paddingHorizontal: 10 },
  celluleSep: { borderLeftWidth: 0.75, borderLeftColor: FILET },
  libelle: { fontSize: 7, color: DOUX, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 },
  valeur: { fontSize: 10, fontFamily: "Helvetica-Bold" },

  parties: { flexDirection: "row", marginTop: 14 },
  partie: { flex: 1, borderWidth: 0.75, borderColor: FILET, borderRadius: 6, padding: 12 },
  nom: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4, lineHeight: 1.2 },
  detail: { fontSize: 9, color: ENCRE, marginTop: 2 },
  detailDoux: { fontSize: 9, color: DOUX, marginTop: 2 },

  tete: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: ENCRE, paddingBottom: 4, marginTop: 20 },
  rang: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: FILET, paddingVertical: 6 },
  enteteCol: { fontSize: 7, color: DOUX, letterSpacing: 0.8, textTransform: "uppercase" },
  cDesignation: { flex: 1, paddingRight: 8 },
  cQte: { width: 44, textAlign: "center" },
  cPu: { width: 84, textAlign: "right" },
  cMontant: { width: 90, textAlign: "right" },
  gras: { fontFamily: "Helvetica-Bold" },

  bas: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 },
  qrBloc: { flexDirection: "row", alignItems: "center", width: 250 },
  qr: { width: 84, height: 84 },
  qrTexte: { marginLeft: 10, flex: 1 },
  qrTitre: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  qrAide: { fontSize: 8, color: DOUX, lineHeight: 1.35 },
  qrLien: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginVertical: 2 },

  totaux: { width: 230 },
  ligneTotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  libelleTotal: { color: DOUX },
  total: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: ENCRE, marginTop: 4, paddingTop: 5, paddingBottom: 3 },
  totalTexte: { fontSize: 12, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  reste: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.25, borderColor: ENCRE, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, marginTop: 6 },
  resteTexte: { fontSize: 12, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },

  conditions: { marginTop: 22 },
  conditionsTexte: { fontSize: 7.5, color: DOUX, lineHeight: 1.45 },

  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  signature: { width: "44%" },
  signatureTitre: { fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  signatureAide: { fontSize: 7.5, color: DOUX, marginTop: 2 },
  signatureLigne: { borderBottomWidth: 0.75, borderBottomColor: DOUX, height: 42 },

  pied: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.5, borderTopColor: FILET, paddingTop: 6, fontSize: 7, color: DOUX },
});

function Cellule({ libelle, valeur, premiere }) {
  return (
    <View style={[s.cellule, premiere ? null : s.celluleSep]}>
      <Text style={s.libelle}>{libelle}</Text>
      <Text style={s.valeur}>{texte(valeur)}</Text>
    </View>
  );
}

function LigneTotal({ libelle, valeur }) {
  return (
    <View style={s.ligneTotal}>
      <Text style={s.libelleTotal}>{texte(libelle)}</Text>
      <Text style={s.gras}>{valeur}</Text>
    </View>
  );
}

export function BordereauPDF({
  selectedClient: client,
  orderItems,
  orderSubtotal,
  orderTotal,
  orderOptions,
  remise,
  paymentInfo,
  bordereauNum,
  shipmentInfo,
  lastContainer,
  dateEdition,
  qrCodeDataUrl,
  lienSuivi,
  logoDataUrl,
}) {
  const numero = shipmentInfo?.shipmentNumber || "—";
  const nbColis = orderItems.reduce((t, i) => t + i.quantity, 0);
  const paye = paymentInfo?.montantRecu ?? 0;
  const reste = Math.max(0, orderTotal - paye);
  const aLArrivee = !!paymentInfo?.aLArrivee;
  const depart = lastContainer?.departureDate ? new Date(lastContainer.departureDate).toLocaleDateString("fr-FR") : "À fixer";
  const adresseClient = [client?.address, client?.city].filter(Boolean).join(", ");
  const adresseDest = [client?.recipientAddress, client?.recipientCity].filter(Boolean).join(", ");
  const site = (lienSuivi || "").replace(/^https?:\/\//, "").replace(/\?.*$/, "");

  return (
    <Document title={`Bordereau ${numero}`} author="NAANGE ENVOI">
      <Page size="A4" style={s.page}>
        {/* En-tête : société à gauche, n° de suivi à droite */}
        <View style={s.entete}>
          <View style={s.marque}>
            {logoDataUrl && <Image src={logoDataUrl} style={s.logo} />}
            <View>
              <Text style={s.societe}>NAANGE ENVOI</Text>
              <Text style={s.slogan}>Envoi de colis France – Burkina Faso</Text>
              <Text style={s.contacts}>+33 6 70 69 98 23 · +226 76 60 19 81 · contact@naange-envoi.fr</Text>
            </View>
          </View>
          <View style={s.document}>
            <Text style={s.typeDoc}>Bordereau d&apos;envoi</Text>
            <Text style={s.suivi}>{numero}</Text>
            <Text style={s.dateDoc}>Édité le {dateEdition}</Text>
          </View>
        </View>
        <View style={s.filetVert} />

        {/* L'essentiel de l'envoi, une seule fois */}
        <View style={s.bande}>
          <Cellule premiere libelle="Conteneur" valeur={lastContainer?.containerNumber || "—"} />
          <Cellule libelle="Départ prévu" valeur={depart} />
          <Cellule libelle="Colis" valeur={String(nbColis)} />
          <Cellule libelle="Réf. bordereau" valeur={bordereauNum || "—"} />
        </View>

        {/* Expéditeur, destinataire */}
        <View style={s.parties}>
          <View style={[s.partie, { marginRight: 12 }]}>
            <Text style={s.libelle}>Expéditeur</Text>
            <Text style={s.nom}>{texte([client?.firstName, client?.lastName].filter(Boolean).join(" ") || "—")}</Text>
            <Text style={s.detail}>{tel(client?.phone)}</Text>
            {adresseClient ? <Text style={s.detail}>{texte(adresseClient)}</Text> : null}
            {client?.clientCode ? <Text style={s.detailDoux}>Code client {client.clientCode}</Text> : null}
          </View>
          <View style={s.partie}>
            <Text style={s.libelle}>Destinataire</Text>
            <Text style={s.nom}>{texte(client?.recipientName || "—")}</Text>
            <Text style={s.detail}>{tel(client?.recipientPhone)}</Text>
            {adresseDest ? <Text style={s.detail}>{texte(adresseDest)}</Text> : null}
          </View>
        </View>

        {/* Détail */}
        <View style={s.tete}>
          <Text style={[s.enteteCol, s.cDesignation]}>Désignation</Text>
          <Text style={[s.enteteCol, s.cQte]}>Qté</Text>
          <Text style={[s.enteteCol, s.cPu]}>Prix unitaire</Text>
          <Text style={[s.enteteCol, s.cMontant]}>Montant</Text>
        </View>
        {orderItems.map((item) => (
          <View key={item.id} style={s.rang} wrap={false}>
            <Text style={s.cDesignation}>{texte(item.name)}</Text>
            <Text style={s.cQte}>{item.quantity}</Text>
            <Text style={s.cPu}>{euros(item.price)}</Text>
            <Text style={[s.cMontant, s.gras]}>{euros(item.total)}</Text>
          </View>
        ))}

        {/* Suivi à gauche, montants à droite */}
        <View style={s.bas} wrap={false}>
          <View style={s.qrBloc}>
            {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={s.qr} />}
            <View style={s.qrTexte}>
              <Text style={s.qrTitre}>Suivez votre envoi</Text>
              <Text style={s.qrAide}>Scannez le code avec votre téléphone{site ? " ou allez sur" : "."}</Text>
              {site ? <Text style={s.qrLien}>{site}</Text> : null}
              <Text style={s.qrAide}>avec le n° {numero}</Text>
            </View>
          </View>

          <View style={s.totaux}>
            {((orderOptions?.discount ?? 0) > 0 || (orderOptions?.additionalFees ?? 0) > 0) && <LigneTotal libelle="Sous-total" valeur={euros(orderSubtotal)} />}
            {(orderOptions?.discount ?? 0) > 0 && (
              <LigneTotal libelle={remise?.motif ? `Remise (${remise.motif})` : "Remise"} valeur={`- ${euros(orderOptions.discount)}`} />
            )}
            {(orderOptions?.additionalFees ?? 0) > 0 && <LigneTotal libelle="Frais supplémentaires" valeur={`+ ${euros(orderOptions.additionalFees)}`} />}
            <View style={s.total}>
              <Text style={s.totalTexte}>Total</Text>
              <Text style={s.totalTexte}>{euros(orderTotal)}</Text>
            </View>
            {paye > 0 && <LigneTotal libelle={`Payé${paymentInfo?.modePaiement ? ` · ${paymentInfo.modePaiement}` : ""}`} valeur={euros(paye)} />}
            {reste > 0.009 ? (
              <View style={s.reste}>
                <Text style={s.resteTexte}>{aLArrivee && paye <= 0 ? "À payer à l'arrivée" : "Reste à payer"}</Text>
                <Text style={s.resteTexte}>{euros(reste)}</Text>
              </View>
            ) : (
              <View style={s.reste}>
                <Text style={s.resteTexte}>Soldé</Text>
                <Text style={s.resteTexte}>{euros(0)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Conditions */}
        <View style={s.conditions} wrap={false}>
          <Text style={s.libelle}>Conditions</Text>
          <Text style={s.conditionsTexte}>
            Marchandises non précisées ne pourront être réclamées · Valeurs justifiées par facture · Livraison optionnelle déterminée avant départ · Sous
            réserve des procédures douanières.
          </Text>
        </View>

        {/* Signatures */}
        <View style={s.signatures} wrap={false}>
          <View style={s.signature}>
            <Text style={s.signatureTitre}>Le client</Text>
            <Text style={s.signatureAide}>Lu et approuvé</Text>
            <View style={s.signatureLigne} />
          </View>
          <View style={s.signature}>
            <Text style={s.signatureTitre}>Pour NAANGE ENVOI</Text>
            <Text style={s.signatureAide}>Nom et signature de l&apos;agent</Text>
            <View style={s.signatureLigne} />
          </View>
        </View>

        <View style={s.pied} fixed>
          <Text>NAANGE ENVOI · Envoi de colis France – Burkina Faso</Text>
          <Text render={({ pageNumber, totalPages }) => `${numero} · page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
