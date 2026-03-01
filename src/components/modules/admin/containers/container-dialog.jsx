"use client";

import React, { useEffect, useState } from "react";
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
import { FloatingLabelSelect } from "@/components/ui/floating-label-select";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const containerStatuses = [
  { value: "PREPARATION", label: "Préparation" },
  { value: "LOADED", label: "Chargé" },
  { value: "IN_TRANSIT", label: "En transit" },
  { value: "CUSTOMS", label: "Douanes" },
  { value: "DELIVERED", label: "Livré" },
  { value: "CANCELLED", label: "Annulé" },
];

export function ContainerDialog({
  isOpen,
  onClose,
  container = null,
  onSave,
  loading = false,
}) {
  const isEditing = !!container;

  const [formData, setFormData] = useState({
    name: "",
    departureDate: "",
    arrivalDate: "",
    status: "PREPARATION",
    capacity: 100,
    maxWeight: "",
    origin: "France",
    destination: "Burkina Faso",
    currentLocation: "",
    transportCompany: "",
    driverName: "",
    driverPhone: "",
    plateNumber: "",
    transportCost: "",
    customsCost: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (container) {
      setFormData({
        name: container.name || "",
        departureDate: container.departureDate ? new Date(container.departureDate).toISOString().split("T")[0] : "",
        arrivalDate: container.arrivalDate ? new Date(container.arrivalDate).toISOString().split("T")[0] : "",
        status: container.status || "PREPARATION",
        capacity: container.capacity || 100,
        maxWeight: container.maxWeight?.toString() || "",
        origin: container.origin || "France",
        destination: container.destination || "Burkina Faso",
        currentLocation: container.currentLocation || "",
        transportCompany: container.transportCompany || "",
        driverName: container.driverName || "",
        driverPhone: container.driverPhone || "",
        plateNumber: container.plateNumber || "",
        transportCost: container.transportCost?.toString() || "",
        customsCost: container.customsCost?.toString() || "",
        notes: container.notes || "",
      });
    } else {
      setFormData({
        name: "",
        departureDate: "",
        arrivalDate: "",
        status: "PREPARATION",
        capacity: 100,
        maxWeight: "",
        origin: "France",
        destination: "Burkina Faso",
        currentLocation: "",
        transportCompany: "",
        driverName: "",
        driverPhone: "",
        plateNumber: "",
        transportCost: "",
        customsCost: "",
        notes: "",
      });
    }
    setErrors({});
  }, [container, isOpen]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Le nom du conteneur est requis";
    if (formData.capacity && (isNaN(parseInt(formData.capacity)) || parseInt(formData.capacity) <= 0)) {
      newErrors.capacity = "La capacité doit être un nombre positif";
    }
    if (formData.maxWeight && isNaN(parseFloat(formData.maxWeight))) {
      newErrors.maxWeight = "Le poids maximum doit être un nombre";
    }
    if (formData.transportCost && isNaN(parseFloat(formData.transportCost))) {
      newErrors.transportCost = "Le coût de transport doit être un nombre";
    }
    if (formData.customsCost && isNaN(parseFloat(formData.customsCost))) {
      newErrors.customsCost = "Le coût des douanes doit être un nombre";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name,
      departureDate: formData.departureDate || null,
      arrivalDate: formData.arrivalDate || null,
      status: formData.status,
      capacity: parseInt(formData.capacity),
      maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : null,
      origin: formData.origin,
      destination: formData.destination,
      currentLocation: formData.currentLocation || null,
      transportCompany: formData.transportCompany || null,
      driverName: formData.driverName || null,
      driverPhone: formData.driverPhone || null,
      plateNumber: formData.plateNumber || null,
      transportCost: formData.transportCost ? parseFloat(formData.transportCost) : null,
      customsCost: formData.customsCost ? parseFloat(formData.customsCost) : null,
      notes: formData.notes || null,
    };

    onSave?.(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le conteneur" : "Créer un nouveau conteneur"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifiez les informations du conteneur." : "Renseignez les détails du nouveau conteneur."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="name"
              label="Nom du conteneur *"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
              disabled={loading}
              placeholder="Ex: Conteneur Janvier 2025"
            />

            <FloatingLabelSelect
              id="status"
              label="Statut"
              value={formData.status}
              onValueChange={(v) => handleChange("status", v)}
              disabled={loading}
            >
              {containerStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </FloatingLabelSelect>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              id="departureDate"
              label="Date de départ prévue"
              value={formData.departureDate}
              onChange={(value) => handleChange("departureDate", value)}
              disabled={loading}
            />

            <DatePicker
              id="arrivalDate"
              label="Date d'arrivée prévue"
              value={formData.arrivalDate}
              onChange={(value) => handleChange("arrivalDate", value)}
              disabled={loading}
            />
          </div>

          {/* Capacité et poids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="capacity"
              label="Capacité (nombre de colis)"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              error={errors.capacity}
              disabled={loading}
            />

            <FloatingLabelInput
              id="maxWeight"
              label="Poids maximum autorisé (kg)"
              type="number"
              step="0.1"
              value={formData.maxWeight}
              onChange={(e) => handleChange("maxWeight", e.target.value)}
              error={errors.maxWeight}
              disabled={loading}
            />
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FloatingCombobox
              id="origin"
              label="Origine"
              value={formData.origin}
              onValueChange={(v) => handleChange("origin", v)}
              disabled={loading}
              placeholder="Sélectionnez ou saisissez l'origine"
              options={[
                { value: "France", label: "France" },
                { value: "Burkina Faso", label: "Burkina Faso" },
              ]}
            />

            <FloatingCombobox
              id="destination"
              label="Destination"
              value={formData.destination}
              onValueChange={(v) => handleChange("destination", v)}
              disabled={loading}
              placeholder="Sélectionnez ou saisissez la destination"
              options={[
                { value: "Burkina Faso", label: "Burkina Faso" },
                { value: "France", label: "France" },
              ]}
            />

            <FloatingLabelInput
              id="currentLocation"
              label="Localisation actuelle"
              value={formData.currentLocation}
              onChange={(e) => handleChange("currentLocation", e.target.value)}
              disabled={loading}
              placeholder="Ex: Port de Marseille"
            />
          </div>

          {/* Transport */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations de transport</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingLabelInput
                id="transportCompany"
                label="Compagnie de transport"
                value={formData.transportCompany}
                onChange={(e) => handleChange("transportCompany", e.target.value)}
                disabled={loading}
                placeholder="Ex: TransAfrica Logistics"
              />

              <FloatingLabelInput
                id="driverName"
                label="Nom du chauffeur"
                value={formData.driverName}
                onChange={(e) => handleChange("driverName", e.target.value)}
                disabled={loading}
              />

              <FloatingLabelInput
                id="driverPhone"
                label="Téléphone du chauffeur"
                value={formData.driverPhone}
                onChange={(e) => handleChange("driverPhone", e.target.value)}
                disabled={loading}
                placeholder="+22670123456"
              />

              <FloatingLabelInput
                id="plateNumber"
                label="Numéro de plaque"
                value={formData.plateNumber}
                onChange={(e) => handleChange("plateNumber", e.target.value)}
                disabled={loading}
                placeholder="BF-1234-AA"
              />
            </div>
          </div>

          {/* Coûts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="transportCost"
              label="Coût de transport (€)"
              type="number"
              step="0.01"
              value={formData.transportCost}
              onChange={(e) => handleChange("transportCost", e.target.value)}
              error={errors.transportCost}
              disabled={loading}
            />

            <FloatingLabelInput
              id="customsCost"
              label="Coût des douanes (€)"
              type="number"
              step="0.01"
              value={formData.customsCost}
              onChange={(e) => handleChange("customsCost", e.target.value)}
              error={errors.customsCost}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <FloatingLabelTextarea
            id="notes"
            label="Notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            disabled={loading}
            placeholder="Informations complémentaires..."
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}