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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function ClientDialog({
  isOpen,
  onClose,
  client = null,
  onSave,
  loading = false,
}) {
  const isEditing = !!client;

  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "France",
    postalCode: "",
    
    // Informations professionnelles
    company: "",
    siret: "",
    
    // Destinataire au Burkina Faso
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
    recipientCity: "",
    recipientRelation: "",
    
    // Métadonnées
    isVip: false,
    creditLimit: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  const frenchCities = [
    "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", 
    "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims"
  ];

  const burkinaCities = [
    "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", 
    "Pouytenga", "Dédougou", "Fada N'gourma", "Kaya", "Tenkodogo"
  ];

  const relations = [
    "Famille", "Ami(e)", "Conjoint(e)", "Parent", "Enfant", "Frère/Sœur", 
    "Cousin(e)", "Associé(e)", "Autre"
  ];

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        city: client.city || "",
        country: client.country || "France",
        postalCode: client.postalCode || "",
        company: client.company || "",
        siret: client.siret || "",
        recipientName: client.recipientName || "",
        recipientPhone: client.recipientPhone || "",
        recipientEmail: client.recipientEmail || "",
        recipientAddress: client.recipientAddress || "",
        recipientCity: client.recipientCity || "",
        recipientRelation: client.recipientRelation || "",
        isVip: !!client.isVip,
        creditLimit: client.creditLimit?.toString() || "",
        notes: client.notes || "",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        country: "France",
        postalCode: "",
        company: "",
        siret: "",
        recipientName: "",
        recipientPhone: "",
        recipientEmail: "",
        recipientAddress: "",
        recipientCity: "",
        recipientRelation: "",
        isVip: false,
        creditLimit: "",
        notes: "",
      });
    }
    setErrors({});
  }, [client, isOpen]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    
    // Champs obligatoires
    if (!formData.firstName) newErrors.firstName = "Le prénom est requis";
    if (!formData.lastName) newErrors.lastName = "Le nom est requis";
    if (!formData.phone) newErrors.phone = "Le téléphone est requis";
    if (!formData.address) newErrors.address = "L'adresse est requise";
    if (!formData.city) newErrors.city = "La ville est requise";
    
    // Destinataire obligatoire
    if (!formData.recipientName) newErrors.recipientName = "Le nom du destinataire est requis";
    if (!formData.recipientPhone) newErrors.recipientPhone = "Le téléphone du destinataire est requis";
    if (!formData.recipientAddress) newErrors.recipientAddress = "L'adresse du destinataire est requise";
    if (!formData.recipientCity) newErrors.recipientCity = "La ville du destinataire est requise";
    
    // Validation email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (formData.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = "Email du destinataire invalide";
    }
    
    // Validation téléphone
    if (formData.phone && !/^\+?[0-9\s\-]{8,}$/.test(formData.phone)) {
      newErrors.phone = "Numéro de téléphone invalide";
    }
    if (formData.recipientPhone && !/^\+?[0-9\s\-]{8,}$/.test(formData.recipientPhone)) {
      newErrors.recipientPhone = "Numéro du destinataire invalide";
    }
    
    // Validation crédit
    if (formData.creditLimit && (isNaN(parseFloat(formData.creditLimit)) || parseFloat(formData.creditLimit) < 0)) {
      newErrors.creditLimit = "La limite de crédit doit être un nombre positif";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email || null,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      postalCode: formData.postalCode || null,
      company: formData.company || null,
      siret: formData.siret || null,
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      recipientEmail: formData.recipientEmail || null,
      recipientAddress: formData.recipientAddress,
      recipientCity: formData.recipientCity,
      recipientRelation: formData.recipientRelation || null,
      isVip: formData.isVip,
      creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : 0,
      notes: formData.notes || null,
    };

    onSave?.(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le client" : "Créer un nouveau client"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifiez les informations du client." : "Renseignez les informations du nouveau client et de son destinataire au Burkina Faso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">Informations personnelles</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={errors.phone ? "border-red-500" : ""}
                  placeholder="+33123456789"
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="client@email.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse *</Label>
              <Textarea
                id="address"
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={`resize-none ${errors.address ? "border-red-500" : ""}`}
                placeholder="Adresse complète..."
              />
              {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Select value={formData.city} onValueChange={(v) => handleChange("city", v)}>
                  <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {frenchCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="75001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Informations professionnelles */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">Informations professionnelles (optionnel)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siret">SIRET</Label>
                <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleChange("siret", e.target.value)}
                  placeholder="12345678901234"
                />
              </div>
            </div>
          </div>

          {/* Destinataire au Burkina Faso */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">Destinataire au Burkina Faso</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nom du destinataire *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => handleChange("recipientName", e.target.value)}
                  className={errors.recipientName ? "border-red-500" : ""}
                  placeholder="Prénom Nom"
                />
                {errors.recipientName && <p className="text-sm text-red-500">{errors.recipientName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Téléphone du destinataire *</Label>
                <Input
                  id="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={(e) => handleChange("recipientPhone", e.target.value)}
                  className={errors.recipientPhone ? "border-red-500" : ""}
                  placeholder="+22670123456"
                />
                {errors.recipientPhone && <p className="text-sm text-red-500">{errors.recipientPhone}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientEmail">Email du destinataire</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleChange("recipientEmail", e.target.value)}
                className={errors.recipientEmail ? "border-red-500" : ""}
                placeholder="destinataire@email.bf"
              />
              {errors.recipientEmail && <p className="text-sm text-red-500">{errors.recipientEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Adresse du destinataire *</Label>
              <Textarea
                id="recipientAddress"
                rows={2}
                value={formData.recipientAddress}
                onChange={(e) => handleChange("recipientAddress", e.target.value)}
                className={`resize-none ${errors.recipientAddress ? "border-red-500" : ""}`}
                placeholder="Secteur 15, Zone du Bois, Ouagadougou"
              />
              {errors.recipientAddress && <p className="text-sm text-red-500">{errors.recipientAddress}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientCity">Ville du destinataire *</Label>
                <Select value={formData.recipientCity} onValueChange={(v) => handleChange("recipientCity", v)}>
                  <SelectTrigger className={errors.recipientCity ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {burkinaCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.recipientCity && <p className="text-sm text-red-500">{errors.recipientCity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientRelation">Relation avec le destinataire</Label>
                <Select value={formData.recipientRelation} onValueChange={(v) => handleChange("recipientRelation", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une relation" />
                  </SelectTrigger>
                  <SelectContent>
                    {relations.map((relation) => (
                      <SelectItem key={relation} value={relation}>
                        {relation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg border-b pb-2">Informations complémentaires</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isVip"
                checked={formData.isVip}
                onCheckedChange={(v) => handleChange("isVip", !!v)}
              />
              <Label htmlFor="isVip">Client VIP</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditLimit">Limite de crédit (€)</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                min="0"
                value={formData.creditLimit}
                onChange={(e) => handleChange("creditLimit", e.target.value)}
                className={errors.creditLimit ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.creditLimit && <p className="text-sm text-red-500">{errors.creditLimit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="resize-none"
                placeholder="Notes internes sur le client..."
              />
            </div>
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