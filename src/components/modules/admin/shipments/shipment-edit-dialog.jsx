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
    pickupAddress: "",
    pickupDate: null,
    pickupTime: "",
    deliveryAddress: "",
    specialInstructions: "",
    notes: "",
    paymentStatus: "PENDING",
    paymentMethod: null,
    paidAmount: 0,
    paidAt: null,
  });

  useEffect(() => {
    if (shipment && isOpen) {
      setFormData({
        pickupAddress: shipment.pickupAddress || "",
        pickupDate: shipment.pickupDate ? new Date(shipment.pickupDate) : null,
        pickupTime: shipment.pickupTime || "",
        deliveryAddress: shipment.deliveryAddress || "",
        specialInstructions: shipment.specialInstructions || "",
        notes: shipment.notes || "",
        paymentStatus: shipment.paymentStatus || "PENDING",
        paymentMethod: shipment.paymentMethod || null,
        paidAmount: shipment.paidAmount || 0,
        paidAt: shipment.paidAt ? new Date(shipment.paidAt) : null,
      });
    }
  }, [shipment, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({
      ...formData,
      pickupDate: formData.pickupDate ? formData.pickupDate.toISOString() : null,
      paidAt: formData.paidAt ? formData.paidAt.toISOString() : null,
    });
  };

  if (!shipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'expédition</DialogTitle>
          <DialogDescription>
            Expédition <span className="font-bold">{shipment.shipmentNumber}</span> - Client:{" "}
            <span className="font-bold">
              {shipment.client?.firstName} {shipment.client?.lastName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de ramassage */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Ramassage</h3>
            
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Adresse de ramassage</Label>
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => handleChange("pickupAddress", e.target.value)}
                placeholder="Ex: 123 rue de Paris, 75001 Paris"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de ramassage</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.pickupDate ? (
                        format(formData.pickupDate, "PPP", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.pickupDate}
                      onSelect={(date) => handleChange("pickupDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupTime">Heure de ramassage</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={formData.pickupTime}
                  onChange={(e) => handleChange("pickupTime", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Informations de livraison */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Livraison</h3>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Adresse de livraison</Label>
              <Input
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) => handleChange("deliveryAddress", e.target.value)}
                placeholder="Adresse au Burkina Faso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Instructions spéciales</Label>
              <Textarea
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => handleChange("specialInstructions", e.target.value)}
                placeholder="Instructions de livraison particulières..."
                rows={3}
              />
            </div>
          </div>

          {/* Paiement */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Paiement</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Statut de paiement</Label>
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) => handleChange("paymentStatus", value)}
                >
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Moyen de paiement</Label>
                <Select
                  value={formData.paymentMethod || ""}
                  onValueChange={(value) => handleChange("paymentMethod", value || null)}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paidAmount">
                  Montant payé (Total: {shipment.totalAmount?.toFixed(2) || 0}€)
                </Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={shipment.totalAmount || 0}
                  value={formData.paidAmount}
                  onChange={(e) => handleChange("paidAmount", parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date de paiement</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.paidAt ? (
                        format(formData.paidAt, "PPP", { locale: fr })
                      ) : (
                        <span>Choisir une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.paidAt}
                      onSelect={(date) => handleChange("paidAt", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notes internes (non visibles par le client)..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

