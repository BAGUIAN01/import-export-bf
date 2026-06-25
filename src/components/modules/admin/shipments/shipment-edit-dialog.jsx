"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectItem } from "@/components/ui/select";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { Loader2 } from "lucide-react";

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "PARTIAL", label: "Partiel" },
  { value: "PAID", label: "Payé" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "REFUNDED", label: "Remboursé" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Espèces" },
  { value: "CARD", label: "Carte bancaire" },
  { value: "TRANSFER", label: "Virement" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHEQUE", label: "Chèque" },
];

const toDateInput = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
};

export function ShipmentEditDialog({ shipment, isOpen, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    paidAmount: 0,
    paymentMethod: "NONE",
    paidAt: null,
    paymentStatus: "PENDING",
    notes: "",
  });

  useEffect(() => {
    if (shipment) {
      const total = Number(shipment.totalAmount || 0);
      const alreadyPaid = Number(shipment.paidAmount || 0);
      // Pré-remplit avec le reste à payer (différence total − déjà payé)
      const remaining = Math.max(0, Math.round((total - alreadyPaid) * 100) / 100);
      setFormData({
        paidAmount: remaining,
        paymentMethod: shipment.paymentMethod || "NONE",
        paidAt: shipment.paidAt ? new Date(shipment.paidAt) : new Date(),
        paymentStatus: shipment.paymentStatus || "PENDING",
        notes: shipment.notes || "",
      });
    }
  }, [shipment]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // paymentStatus est recalculé côté serveur — on ne l'envoie pas.
    // Le champ contient le montant encaissé maintenant → on l'ajoute au cumul déjà payé.
    const { paymentStatus, paymentMethod, paidAmount, ...rest } = formData;
    const alreadyPaid = Number(shipment.paidAmount || 0);
    const total = Number(shipment.totalAmount || 0);
    const cumulative = Math.min(
      total,
      Math.round((alreadyPaid + Number(paidAmount || 0)) * 100) / 100
    );
    await onSave({
      ...rest,
      paidAmount: cumulative,
      paymentMethod: paymentMethod === "NONE" ? null : paymentMethod,
      paidAt: formData.paidAt ? formData.paidAt.toISOString() : null,
    });
  };

  if (!shipment) return null;

  const total = Number(shipment.totalAmount || 0);
  const alreadyPaid = Number(shipment.paidAmount || 0);
  const remaining = Math.max(0, Math.round((total - alreadyPaid) * 100) / 100);

  const statusLabel =
    PAYMENT_STATUS_OPTIONS.find((o) => o.value === formData.paymentStatus)?.label ||
    "En attente";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Gérer le paiement</DialogTitle>
          <DialogDescription>
            Expédition <span className="font-semibold">{shipment.shipmentNumber}</span> —{" "}
            <span className="font-semibold">
              {shipment.client?.firstName} {shipment.client?.lastName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FloatingLabelInput
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                max={remaining}
                label="Montant à encaisser (€)"
                value={formData.paidAmount}
                onChange={(e) => handleChange("paidAmount", parseFloat(e.target.value) || 0)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1 px-1">
                Reste à payer : {remaining.toFixed(2)}€ • Total : {total.toFixed(2)}€
              </p>
            </div>

            <FloatingLabelSelect
              id="paymentMethod"
              label="Mode de paiement"
              value={formData.paymentMethod}
              onValueChange={(v) => handleChange("paymentMethod", v)}
              disabled={loading}
            >
              <SelectItem value="NONE">Aucun</SelectItem>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </FloatingLabelSelect>
          </div>

          <FloatingLabelInput
            id="paidAt"
            type="date"
            label="Date de paiement"
            value={toDateInput(formData.paidAt)}
            onChange={(e) =>
              handleChange("paidAt", e.target.value ? new Date(`${e.target.value}T00:00:00`) : null)
            }
            disabled={loading}
          />

          {/* Statut calculé automatiquement */}
          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">Statut (calculé automatiquement)</span>
            <span className="text-sm text-muted-foreground">{statusLabel}</span>
          </div>

          <FloatingLabelTextarea
            id="notes"
            label="Notes internes (non visibles par le client)"
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            disabled={loading}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0E7A34] hover:bg-[#0B5C28] text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
