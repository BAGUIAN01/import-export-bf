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
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

const todayISO = () => new Date().toISOString().split("T")[0];

/**
 * Dialog de remise : enregistre la personne qui a récupéré l'expédition,
 * la date de remise et une note optionnelle.
 */
export function ShipmentRemitDialog({ shipment, isOpen, onClose, onSubmit, loading }) {
  const [receivedBy, setReceivedBy] = useState("");
  const [deliveredAt, setDeliveredAt] = useState(todayISO());
  const [deliveryNote, setDeliveryNote] = useState("");

  useEffect(() => {
    if (isOpen && shipment) {
      setReceivedBy(shipment.receivedBy || "");
      setDeliveredAt(
        shipment.deliveredAt
          ? new Date(shipment.deliveredAt).toISOString().split("T")[0]
          : todayISO()
      );
      setDeliveryNote(shipment.deliveryNote || "");
    }
  }, [isOpen, shipment]);

  const handleSubmit = () => {
    if (!receivedBy.trim()) {
      toast.error("Indiquez le nom de la personne qui a récupéré");
      return;
    }
    onSubmit?.({
      receivedBy: receivedBy.trim(),
      deliveredAt: deliveredAt || todayISO(),
      deliveryNote: deliveryNote.trim() || null,
    });
  };

  const alreadyRemis = Boolean(shipment?.deliveredAt);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-[#0E7A34]" />
            Remettre — {shipment?.shipmentNumber}
          </DialogTitle>
          <DialogDescription>
            {alreadyRemis
              ? "Cette expédition a déjà été remise. Vous pouvez corriger les informations."
              : "Enregistrez la remise de l'expédition au destinataire."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FloatingLabelInput
            id="remit-receivedBy"
            label="Nom de la personne qui a récupéré *"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            disabled={loading}
          />

          <FloatingLabelInput
            id="remit-date"
            type="date"
            label="Date de remise"
            value={deliveredAt}
            onChange={(e) => setDeliveredAt(e.target.value)}
            disabled={loading}
          />

          <FloatingLabelTextarea
            id="remit-note"
            label="Note (optionnelle)"
            rows={3}
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            disabled={loading}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !receivedBy.trim()}
            className="bg-[#0E7A34] hover:bg-[#0B5C28] text-white"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {alreadyRemis ? "Mettre à jour" : "Confirmer la remise"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShipmentRemitDialog;
