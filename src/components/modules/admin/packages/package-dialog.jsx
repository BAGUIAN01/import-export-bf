"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const packageTypes = [
  { value: "CARTON", label: "Carton" },
  { value: "BARRIQUE", label: "Barrique" },
  { value: "VEHICLE", label: "Véhicule" },
  { value: "MOTORCYCLE", label: "Moto" },
  { value: "ELECTRONICS", label: "Électronique" },
  { value: "CLOTHING", label: "Vêtements" },
  { value: "FOOD", label: "Alimentation" },
  { value: "DOCUMENTS", label: "Documents" },
  { value: "OTHER", label: "Autre" },
];

const priorities = [
  { value: "LOW", label: "Faible" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Élevé" },
  { value: "URGENT", label: "Urgent" },
];

const NONE_CONTAINER = "__none__";

export function PackageDialog({
  isOpen,
  onClose,
  package: pkg = null,
  clients = [],
  containers = [],
  onSave,
  loading = false,
}) {
  
  const isEditing = !!pkg;

  const clientsIndex = useMemo(() => {
    const map = new Map();
    for (const c of clients) map.set(String(c.id), c);
    return map;
  }, [clients]);

  const [formData, setFormData] = useState({
    clientId: "",
    containerId: "",
    type: "CARTON",
    description: "",
    quantity: 1,
    weight: "",
    dimensions: "",
    value: "",
    priority: "NORMAL",
    isFragile: false,
    isInsured: false,
    pickupAddress: "",
    pickupDate: "",
    pickupTime: "",
    deliveryAddress: "",
    specialInstructions: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (pkg) {
      setFormData({
        clientId: pkg.clientId ? String(pkg.clientId) : "",
        containerId: pkg.containerId ? String(pkg.containerId) : "",
        type: pkg.type || "CARTON",
        description: pkg.description || "",
        quantity: Number.isFinite(pkg.quantity) ? pkg.quantity : 1,
        weight: pkg.weight != null ? String(pkg.weight) : "",
        dimensions: pkg.dimensions || "",
        value: pkg.value != null ? String(pkg.value) : "",
        priority: pkg.priority || "NORMAL",
        isFragile: !!pkg.isFragile,
        isInsured: !!pkg.isInsured,
        pickupAddress: pkg.pickupAddress || "",
        pickupDate: pkg.pickupDate
          ? new Date(pkg.pickupDate).toISOString().split("T")[0]
          : "",
        pickupTime: pkg.pickupTime || "",
        deliveryAddress: pkg.deliveryAddress || "",
        specialInstructions: pkg.specialInstructions || "",
        notes: pkg.notes || "",
      });
    } else {
      setFormData({
        clientId: "",
        containerId: "",
        type: "CARTON",
        description: "",
        quantity: 1,
        weight: "",
        dimensions: "",
        value: "",
        priority: "NORMAL",
        isFragile: false,
        isInsured: false,
        pickupAddress: "",
        pickupDate: "",
        pickupTime: "",
        deliveryAddress: "",
        specialInstructions: "",
        notes: "",
      });
    }
    setErrors({});
  }, [pkg, isOpen]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    const trimmedClientId = String(formData.clientId || "").trim();

    if (!trimmedClientId) newErrors.clientId = "Le client est requis";
    else if (!clientsIndex.has(trimmedClientId))
      newErrors.clientId = "Client invalide";

    if (!formData.description) newErrors.description = "La description est requise";
    if (!formData.deliveryAddress)
      newErrors.deliveryAddress = "L'adresse de livraison est requise";

    if (formData.weight !== "" && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = "Le poids doit être un nombre";
    }
    if (formData.value !== "" && isNaN(parseFloat(formData.value))) {
      newErrors.value = "La valeur doit être un nombre";
    }

    // Type de colis obligatoire
    if (!packageTypes.some((t) => t.value === formData.type)) {
      newErrors.type = "Type de colis invalide";
    }

    // Quantité minimale
    const q = Number(formData.quantity);
    if (!Number.isFinite(q) || q < 1) {
      newErrors.quantity = "Quantité minimale: 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    // Nettoyage des IDs
    const clientIdClean = String(formData.clientId).trim();
    const containerIdClean =
      formData.containerId && formData.containerId !== NONE_CONTAINER
        ? String(formData.containerId).trim()
        : null;

    const payload = {
      clientId: clientIdClean,
      containerId: containerIdClean || null,
      type: formData.type,
      description: formData.description,
      quantity: Number.parseInt(formData.quantity, 10),
      weight: formData.weight !== "" ? Number.parseFloat(formData.weight) : null,
      dimensions: formData.dimensions || null,
      value: formData.value !== "" ? Number.parseFloat(formData.value) : null,
      priority: formData.priority,
      isFragile: !!formData.isFragile,
      isInsured: !!formData.isInsured,
      pickupAddress: formData.pickupAddress || null,
      pickupDate: formData.pickupDate || null, // le backend fait new Date() si fourni
      pickupTime: formData.pickupTime || null,
      deliveryAddress: formData.deliveryAddress,
      specialInstructions: formData.specialInstructions || null,
      notes: formData.notes || null,
    };

    onSave?.(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le colis" : "Créer un nouveau colis"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du colis."
              : "Renseignez les détails du nouveau colis."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client et Conteneur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(v) => handleChange("clientId", v)}
              >
                <SelectTrigger className={errors.clientId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.firstName} {client.lastName} ({client.clientCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500">{errors.clientId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Conteneur (optionnel)</Label>
              <Select
                value={formData.containerId || NONE_CONTAINER}
                onValueChange={(v) =>
                  handleChange("containerId", v === NONE_CONTAINER ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un conteneur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CONTAINER}>Aucun</SelectItem>
                  {containers.map((container) => (
                    <SelectItem key={container.id} value={String(container.id)}>
                      {container.name || container.containerNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type et Priorité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type de colis *</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => handleChange("type", v)}
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => handleChange("priority", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une priorité" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`resize-none ${errors.description ? "border-red-500" : ""}`}
              placeholder="Décrivez le contenu du colis..."
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Détails physiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className={errors.weight ? "border-red-500" : ""}
              />
              {errors.weight && (
                <p className="text-sm text-red-500">{errors.weight}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valeur déclarée (€)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleChange("value", e.target.value)}
                className={errors.value ? "border-red-500" : ""}
              />
              {errors.value && (
                <p className="text-sm text-red-500">{errors.value}</p>
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions (LxlxH en cm)</Label>
            <Input
              id="dimensions"
              value={formData.dimensions}
              onChange={(e) => handleChange("dimensions", e.target.value)}
              placeholder="Ex: 50x30x20"
            />
          </div>

          {/* Options */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFragile"
                checked={formData.isFragile}
                onCheckedChange={(v) => handleChange("isFragile", !!v)}
              />
              <Label htmlFor="isFragile">Fragile</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isInsured"
                checked={formData.isInsured}
                onCheckedChange={(v) => handleChange("isInsured", !!v)}
              />
              <Label htmlFor="isInsured">Assuré</Label>
            </div>
          </div>

          {/* Adresses */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickupAddress">Adresse de ramassage (optionnel)</Label>
              <Input
                id="pickupAddress"
                value={formData.pickupAddress}
                onChange={(e) => handleChange("pickupAddress", e.target.value)}
                placeholder="Adresse de collecte du colis"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupDate">Date de ramassage</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={formData.pickupDate}
                  onChange={(e) => handleChange("pickupDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupTime">Créneau horaire</Label>
                <Select
                  value={formData.pickupTime}
                  onValueChange={(v) => handleChange("pickupTime", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un créneau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9h-12h">9h-12h</SelectItem>
                    <SelectItem value="14h-17h">14h-17h</SelectItem>
                    <SelectItem value="18h-20h">18h-20h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Adresse de livraison *</Label>
              <Textarea
                id="deliveryAddress"
                rows={2}
                value={formData.deliveryAddress}
                onChange={(e) => handleChange("deliveryAddress", e.target.value)}
                className={`resize-none ${
                  errors.deliveryAddress ? "border-red-500" : ""
                }`}
                placeholder="Adresse complète de livraison au Burkina Faso"
              />
              {errors.deliveryAddress && (
                <p className="text-sm text-red-500">{errors.deliveryAddress}</p>
              )}
            </div>
          </div>

          {/* Instructions spéciales */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Instructions spéciales</Label>
            <Textarea
              id="specialInstructions"
              rows={2}
              value={formData.specialInstructions}
              onChange={(e) => handleChange("specialInstructions", e.target.value)}
              className="resize-none"
              placeholder="Instructions particulières pour la livraison..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="resize-none"
              placeholder="Notes pour usage interne..."
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
