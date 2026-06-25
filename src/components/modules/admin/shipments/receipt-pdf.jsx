"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const GREEN = "#0E7A34";
const GOLD = "#E0A500";

const fmt = (n) => `${Number(n || 0).toFixed(2)} €`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const PAYMENT_METHOD_LABELS = {
  CASH: "Espèces",
  CARD: "Carte bancaire",
  TRANSFER: "Virement",
  MOBILE_MONEY: "Mobile Money",
  CHEQUE: "Chèque",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: GREEN,
    color: "#ffffff",
    borderRadius: 8,
    padding: 16,
  },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    padding: 2,
    marginRight: 10,
  },
  brandName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  brandTag: { fontSize: 8, color: "#d1fae5", marginTop: 2 },
  docTitleBox: { alignItems: "flex-end" },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  docNum: { fontSize: 8, color: "#d1fae5", marginTop: 3 },

  goldBar: {
    height: 3,
    backgroundColor: GOLD,
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 16,
  },

  twoCols: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  col: { width: "48%" },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 70, color: "#6b7280" },
  value: { flex: 1, fontFamily: "Helvetica-Bold" },

  statement: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    lineHeight: 1.5,
  },

  totals: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 18,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  totalLabel: { color: "#374151" },
  totalValue: { fontFamily: "Helvetica-Bold" },
  paidRow: { backgroundColor: "#ecfdf5" },
  paidValue: { fontFamily: "Helvetica-Bold", color: GREEN },
  remainRow: { backgroundColor: "#fffbeb" },
  remainValue: { fontFamily: "Helvetica-Bold", color: "#b45309" },
  statusPaid: { fontFamily: "Helvetica-Bold", color: GREEN },
  statusPartial: { fontFamily: "Helvetica-Bold", color: "#b45309" },

  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  signBox: { width: "45%" },
  signLabel: { fontSize: 8, color: "#6b7280", marginBottom: 26 },
  signLine: { borderTopWidth: 1, borderTopColor: "#9ca3af", paddingTop: 3, fontSize: 8, color: "#6b7280" },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
});

/**
 * Quittance de paiement pour une expédition.
 */
export function ReceiptPDF({ shipment, logoDataUrl, qrCodeDataUrl, dateEdition }) {
  const client = shipment?.client || {};
  const total = Number(shipment?.totalAmount || 0);
  const paid = Number(shipment?.paidAmount || 0);
  const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);
  const isPaid = remaining <= 0 && total > 0;
  const clientName = `${client.firstName || ""} ${client.lastName || ""}`.trim() || "—";
  const methodLabel = PAYMENT_METHOD_LABELS[shipment?.paymentMethod] || "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : null}
            <View>
              <Text style={styles.brandName}>NAANGE ENVOI</Text>
              <Text style={styles.brandTag}>Groupage & Transport de colis</Text>
            </View>
          </View>
          <View style={styles.docTitleBox}>
            {qrCodeDataUrl ? (
              <Image src={qrCodeDataUrl} style={{ width: 46, height: 46, marginBottom: 4 }} />
            ) : null}
            <Text style={styles.docTitle}>QUITTANCE DE PAIEMENT</Text>
            <Text style={styles.docNum}>N° QUIT-{shipment?.shipmentNumber}</Text>
            <Text style={styles.docNum}>Éditée le {fmtDate(dateEdition || new Date())}</Text>
          </View>
        </View>
        <View style={styles.goldBar} />

        {/* Client + Expédition */}
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Code</Text>
              <Text style={styles.value}>{client.clientCode || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nom</Text>
              <Text style={styles.value}>{clientName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone</Text>
              <Text style={styles.value}>{client.phone || "—"}</Text>
            </View>
            {client.recipientName ? (
              <View style={styles.row}>
                <Text style={styles.label}>Destinataire</Text>
                <Text style={styles.value}>
                  {client.recipientName}
                  {client.recipientCity ? ` (${client.recipientCity})` : ""}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Expédition</Text>
            <View style={styles.row}>
              <Text style={styles.label}>N°</Text>
              <Text style={styles.value}>{shipment?.shipmentNumber || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Conteneur</Text>
              <Text style={styles.value}>
                {shipment?.container?.name || shipment?.container?.containerNumber || "—"}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Colis</Text>
              <Text style={styles.value}>{shipment?.packagesCount ?? 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{fmtDate(shipment?.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Énoncé */}
        <View style={styles.statement}>
          <Text>
            Reçu de {clientName} la somme de{" "}
            <Text style={{ fontFamily: "Helvetica-Bold", color: GREEN }}>{fmt(paid)}</Text> au titre du
            règlement de l'expédition{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{shipment?.shipmentNumber}</Text>
            {shipment?.paymentMethod ? `, réglée par ${methodLabel.toLowerCase()}` : ""}
            {shipment?.paidAt ? ` le ${fmtDate(shipment.paidAt)}` : ""}.
          </Text>
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant total de l'expédition</Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
          <View style={[styles.totalRow, styles.paidRow]}>
            <Text style={styles.totalLabel}>Montant payé</Text>
            <Text style={styles.paidValue}>{fmt(paid)}</Text>
          </View>
          {remaining > 0 ? (
            <View style={[styles.totalRow, styles.remainRow]}>
              <Text style={styles.totalLabel}>Reste à payer</Text>
              <Text style={styles.remainValue}>{fmt(remaining)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.totalLabel}>Mode de paiement</Text>
            <Text style={styles.totalValue}>{methodLabel}</Text>
          </View>
          <View style={[styles.totalRow, { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: "#e5e7eb" }]}>
            <Text style={styles.totalLabel}>Statut</Text>
            <Text style={isPaid ? styles.statusPaid : styles.statusPartial}>
              {isPaid ? "SOLDÉ" : "PAIEMENT PARTIEL"}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signRow}>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Le client</Text>
            <Text style={styles.signLine}>Signature</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLabel}>Naange Envoi</Text>
            <Text style={styles.signLine}>Cachet & signature</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          NAANGE ENVOI — Groupage & Transport de colis France ↔ Burkina Faso · Document non contractuel valant
          reçu de paiement.
        </Text>
      </Page>
    </Document>
  );
}

export default ReceiptPDF;
