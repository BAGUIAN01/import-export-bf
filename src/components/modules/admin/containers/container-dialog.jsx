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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <div className="space-y-2">
              <Label htmlFor="name">Nom du conteneur *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
                placeholder="Ex: Conteneur Janvier 2025"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {containerStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureDate">Date de départ prévue</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) => handleChange("departureDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalDate">Date d'arrivée prévue</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => handleChange("arrivalDate", e.target.value)}
              />
            </div>
          </div>

          {/* Capacité et poids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité (nombre de colis)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWeight">Poids maximum autorisé (kg)</Label>
              <Input
                id="maxWeight"
                type="number"
                step="0.1"
                value={formData.maxWeight}
                onChange={(e) => handleChange("maxWeight", e.target.value)}
                className={errors.maxWeight ? "border-red-500" : ""}
              />
              {errors.maxWeight && <p className="text-sm text-red-500">{errors.maxWeight}</p>}
            </div>
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origine</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => handleChange("origin", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => handleChange("destination", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLocation">Localisation actuelle</Label>
              <Input
                id="currentLocation"
                value={formData.currentLocation}
                onChange={(e) => handleChange("currentLocation", e.target.value)}
                placeholder="Ex: Port de Marseille"
              />
            </div>
          </div>

          {/* Transport */}
          <div className="space-y-4">
            <h4 className="font-medium">Informations de transport</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transportCompany">Compagnie de transport</Label>
                <Input
                  id="transportCompany"
                  value={formData.transportCompany}
                  onChange={(e) => handleChange("transportCompany", e.target.value)}
                  placeholder="Ex: TransAfrica Logistics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName">Nom du chauffeur</Label>
                <Input
                  id="driverName"
                  value={formData.driverName}
                  onChange={(e) => handleChange("driverName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPhone">Téléphone du chauffeur</Label>
                <Input
                  id="driverPhone"
                  value={formData.driverPhone}
                  onChange={(e) => handleChange("driverPhone", e.target.value)}
                  placeholder="+22670123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plateNumber">Numéro de plaque</Label>
                <Input
                  id="plateNumber"
                  value={formData.plateNumber}
                  onChange={(e) => handleChange("plateNumber", e.target.value)}
                  placeholder="BF-1234-AA"
                />
              </div>
            </div>
          </div>

          {/* Coûts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transportCost">Coût de transport (€)</Label>
              <Input
                id="transportCost"
                type="number"
                step="0.01"
                value={formData.transportCost}
                onChange={(e) => handleChange("transportCost", e.target.value)}
                className={errors.transportCost ? "border-red-500" : ""}
              />
              {errors.transportCost && <p className="text-sm text-red-500">{errors.transportCost}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customsCost">Coût des douanes (€)</Label>
              <Input
                id="customsCost"
                type="number"
                step="0.01"
                value={formData.customsCost}
                onChange={(e) => handleChange("customsCost", e.target.value)}
                className={errors.customsCost ? "border-red-500" : ""}
              />
              {errors.customsCost && <p className="text-sm text-red-500">{errors.customsCost}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="resize-none"
              placeholder="Informations complémentaires..."
            />
          </div>

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