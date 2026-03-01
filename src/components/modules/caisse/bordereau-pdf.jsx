import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import QRCodeLib from "qrcode";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    backgroundColor: "#010066",
    color: "white",
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    padding: 3,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  companySub: {
    fontSize: 8,
    color: "#d1d5db",
  },
  contact: {
    fontSize: 8,
    color: "#d1d5db",
    marginTop: 5,
  },
  trackingInfo: {
    alignItems: "flex-end",
  },
  trackingLabel: {
    fontSize: 8,
    color: "#d1d5db",
    marginBottom: 3,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },
  date: {
    fontSize: 8,
    color: "#d1d5db",
  },
  qrCode: {
    width: 50,
    height: 50,
    backgroundColor: "white",
    padding: 5,
  },
  containerBar: {
    backgroundColor: "white",
    borderBottom: "1 solid #d1d5db",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  twoColumns: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  column: {
    flex: 1,
    border: "1 solid #d1d5db",
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 9,
  },
  infoLabel: {
    width: 50,
    color: "#6b7280",
  },
  infoValue: {
    fontWeight: "bold",
    flex: 1,
  },
  table: {
    border: "1 solid #d1d5db",
    marginTop: 8,
  },
  tableHeader: {
    backgroundColor: "#010066",
    color: "white",
    flexDirection: "row",
    padding: 8,
    fontSize: 9,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    fontSize: 9,
    borderBottom: "1 solid #e5e7eb",
  },
  tableRowEven: {
    backgroundColor: "#f9fafb",
  },
  colDesignation: {
    width: "50%",
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colPrice: {
    width: "17.5%",
    textAlign: "right",
  },
  colTotal: {
    width: "17.5%",
    textAlign: "right",
    fontWeight: "bold",
  },
  totals: {
    marginTop: 15,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 4,
    fontSize: 9,
  },
  totalLabel: {
    color: "#6b7280",
    textTransform: "uppercase",
    fontSize: 8,
  },
  totalValue: {
    fontWeight: "bold",
  },
  totalFinal: {
    borderTop: "1 solid #d1d5db",
    paddingTop: 4,
    marginTop: 4,
    fontSize: 12,
  },
  paymentInfo: {
    backgroundColor: "#f9fafb",
    border: "1 solid #d1d5db",
    padding: 10,
    fontSize: 8,
    marginTop: 15,
  },
  conditions: {
    backgroundColor: "#f9fafb",
    border: "1 solid #d1d5db",
    padding: 10,
    marginTop: 15,
  },
  conditionsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  conditionsText: {
    fontSize: 8,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: "1 solid #d1d5db",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#6b7280",
  },
  signature: {
    alignItems: "center",
  },
  signatureLabel: {
    marginBottom: 5,
  },
  signatureLine: {
    width: 120,
    borderBottom: "1 solid #9ca3af",
    height: 20,
  },
});

function formatPrice(amount) {
  return Math.round(amount || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

function formatPhone(tel) {
  if (!tel) return "";
  if (tel.startsWith("+")) {
    return tel.replace(/[^+\d]/g, "").replace(
      /^(\+\d{1,3})(\d{1,3})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?$/,
      (_m, a, b, c, d, e, f) => [a, b, c, d, e, f].filter(Boolean).join(" ")
    );
  }
  return tel.replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function BordereauPDF({
  selectedClient,
  orderItems,
  orderSubtotal,
  orderTotal,
  orderOptions,
  paymentInfo,
  bordereauNum,
  shipmentInfo,
  lastContainer,
  dateEdition,
  qrCodeDataUrl,
  logoDataUrl,
}) {
  const montantPaye = paymentInfo?.montantRecu ?? 0;
  const resteAPayer = Math.max(0, orderTotal - montantPaye);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête bleu */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.logoContainer}>
              {logoDataUrl && (
                <Image src={logoDataUrl} style={styles.logo} />
              )}
              <View>
                <Text style={styles.companySub}>IMPORT-EXPORT BF</Text>
                <Text style={styles.companyName}>IMPORT EXPORT BF</Text>
              </View>
            </View>
            <View style={styles.trackingInfo}>
              <Text style={styles.trackingLabel}>N° de suivi</Text>
              <Text style={styles.trackingNumber}>
                {shipmentInfo?.shipmentNumber || "—"}
              </Text>
              <Text style={styles.date}>Date: {dateEdition}</Text>
            </View>
          </View>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.contact}>+33 6 70 69 98 23</Text>
              <Text style={styles.contact}>+226 76 60 19 81</Text>
              <Text style={styles.contact}>contact@ieBF.fr</Text>
            </View>
            {qrCodeDataUrl && (
              <View style={styles.qrCode}>
                <Image src={qrCodeDataUrl} style={{ width: 50, height: 50 }} />
              </View>
            )}
          </View>
        </View>

        {/* Bandeau conteneur */}
        {lastContainer && (
          <View style={styles.containerBar}>
            <View style={{ flexDirection: "row", gap: 15 }}>
              <Text>Conteneur: {lastContainer.containerNumber}</Text>
              <Text>
                Départ:{" "}
                {lastContainer.departureDate
                  ? new Date(lastContainer.departureDate).toLocaleDateString("fr-FR")
                  : "À déterminer"}
              </Text>
              <Text>
                {orderItems.reduce((s, i) => s + i.quantity, 0)} colis
              </Text>
            </View>
            <Text>N° de suivi: {shipmentInfo?.shipmentNumber || "—"}</Text>
          </View>
        )}

        {/* Contenu */}
        <View style={styles.content}>
          {/* Expéditeur / Destinataire */}
          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Expéditeur</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Code:</Text>
                <Text style={styles.infoValue}>
                  {selectedClient?.clientCode || "—"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom:</Text>
                <Text style={styles.infoValue}>
                  {selectedClient?.firstName || ""} {selectedClient?.lastName || ""}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tél:</Text>
                <Text style={styles.infoValue}>
                  {formatPhone(selectedClient?.phone)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Adresse:</Text>
                <Text style={styles.infoValue}>
                  {selectedClient?.address || ""}
                  {selectedClient?.city ? `, ${selectedClient.city}` : ""}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Destinataire</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom:</Text>
                <Text style={styles.infoValue}>
                  {selectedClient?.recipientName || "Non renseigné"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tél:</Text>
                <Text style={styles.infoValue}>
                  {formatPhone(selectedClient?.recipientPhone)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Adresse:</Text>
                <Text style={styles.infoValue}>
                  {selectedClient?.recipientAddress || "Non renseignée"}
                  {selectedClient?.recipientCity ? `, ${selectedClient.recipientCity}` : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Tableau commande */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Détail de la commande ({orderItems.reduce((s, i) => s + i.quantity, 0)} colis)
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colDesignation}>Désignation</Text>
                <Text style={styles.colQty}>Qté</Text>
                <Text style={styles.colPrice}>P.U.</Text>
                <Text style={styles.colTotal}>Total</Text>
              </View>
              {orderItems.map((item, idx) => (
                <View
                  key={item.id}
                  style={[styles.tableRow, idx % 2 === 0 ? {} : styles.tableRowEven]}
                >
                  <Text style={styles.colDesignation}>{item.name}</Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{formatPrice(item.price)} €</Text>
                  <Text style={styles.colTotal}>{formatPrice(item.total)} €</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Totaux */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>{formatPrice(orderSubtotal)} €</Text>
            </View>
            {(orderOptions?.discount ?? 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: "#059669" }]}>Remise</Text>
                <Text style={[styles.totalValue, { color: "#059669" }]}>
                  −{formatPrice(orderOptions.discount)} €
                </Text>
              </View>
            )}
            {(orderOptions?.additionalFees ?? 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Frais supplémentaires</Text>
                <Text style={styles.totalValue}>
                  +{formatPrice(orderOptions.additionalFees)} €
                </Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalLabel}>Total général</Text>
              <Text style={styles.totalValue}>{formatPrice(orderTotal)} €</Text>
            </View>
            {montantPaye > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: "#059669" }]}>Montant payé</Text>
                <Text style={[styles.totalValue, { color: "#059669" }]}>
                  {formatPrice(montantPaye)} €
                </Text>
              </View>
            )}
            {resteAPayer > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: "#2563eb" }]}>Reste à payer</Text>
                <Text style={[styles.totalValue, { color: "#2563eb" }]}>
                  {formatPrice(resteAPayer)} €
                </Text>
              </View>
            )}
          </View>

          {/* Mode de paiement */}
          {paymentInfo?.modePaiement && (
            <View style={styles.paymentInfo}>
              <Text>
                <Text style={{ fontWeight: "bold" }}>Mode de paiement : </Text>
                {paymentInfo.modePaiement}
              </Text>
            </View>
          )}

          {/* Conditions */}
          <View style={styles.conditions}>
            <Text style={styles.conditionsTitle}>Conditions</Text>
            <Text style={styles.conditionsText}>
              • Marchandises non précisées ne pourront être réclamées • Valeurs justifiées par facture
            </Text>
            <Text style={styles.conditionsText}>
              • Livraison optionnelle déterminée avant départ • Sous réserve procédures douanières
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View>
              <Text>
                Document généré le {dateEdition} — Réf. bordereau : {bordereauNum}
              </Text>
              <Text>IMPORT EXPORT BF - Service d'envoi de colis France-Burkina Faso</Text>
            </View>
            <View style={styles.signature}>
              <Text style={styles.signatureLabel}>Signature</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

