"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export function ShipmentEditDialog({ shipment, isOpen, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    paidAmount: 0,
    paymentMethod: null,
    paidAt: null,
    paymentStatus: "PENDING",
    notes: "",
  });

  useEffect(() => {
    if (shipment) {
      setFormData({
        paidAmount: shipment.paidAmount || 0,
        paymentMethod: shipment.paymentMethod || null,
        paidAt: shipment.paidAt ? new Date(shipment.paidAt) : null,
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
    // Ne pas envoyer paymentStatus car il sera recalculé automatiquement côté serveur
    const { paymentStatus, ...dataToSave } = formData;
    await onSave({
      ...dataToSave,
      paidAt: formData.paidAt ? formData.paidAt.toISOString() : null,
    });
  };

  if (!shipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gérer le paiement</DialogTitle>
          <DialogDescription>
            Expédition <span className="font-semibold">{shipment.shipmentNumber}</span> - 
            <span className="font-semibold ml-1">
              {shipment.client?.firstName} {shipment.client?.lastName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Paiement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Paiement</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paidAmount">Montant payé</Label>
                  <div className="relative">
                    <Input
                      id="paidAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={shipment.totalAmount || 0}
                      value={formData.paidAmount}
                      onChange={(e) => handleChange("paidAmount", parseFloat(e.target.value) || 0)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {shipment.totalAmount?.toFixed(2) || 0}€
                  </p>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Mode de paiement</Label>
                  <Select
                    value={formData.paymentMethod || "NONE"}
                    onValueChange={(value) => handleChange("paymentMethod", value === "NONE" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Aucun</SelectItem>
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Date de paiement</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.paidAt ? format(formData.paidAt, "dd/MM/yyyy") : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.paidAt}
                      onSelect={(date) => handleChange("paidAt", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Statut automatique */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut</span>
                  <span className="text-sm text-muted-foreground">
                    {PAYMENT_STATUS_OPTIONS.find(opt => opt.value === formData.paymentStatus)?.label || "En attente"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculé automatiquement
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <div>
              <Label htmlFor="notes">Notes internes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Notes internes (non visibles par le client)..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}