"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { FloatingLabelTextarea } from "@/components/ui/floating-label-textarea";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import { UserCircle, Package } from "lucide-react";
import PhoneInput from "@/components/modules/admin/clients/phone-input";

const burkinaCities = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", 
  "Pouytenga", "Dédougou", "Fada N'gourma", "Kaya", "Tenkodogo"
];

const frenchCities = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", 
  "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", 
  "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"
];

const getCitiesForCountry = (country) => {
  if (country === "France") return frenchCities;
  if (country === "Burkina Faso") return burkinaCities;
  return [];
};

export function ClientForm({ initial = {}, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    address: initial.address ?? "",
    city: initial.city ?? "",
    country: initial.country ?? "France",
    postalCode: initial.postalCode ?? "",
    recipientFirstName: initial.recipientFirstName ?? "",
    recipientLastName: initial.recipientLastName ?? "",
    recipientPhone: initial.recipientPhone ?? "",
    recipientEmail: initial.recipientEmail ?? "",
    recipientAddress: initial.recipientAddress ?? "",
    recipientCity: initial.recipientCity ?? "",
    recipientCountry: initial.recipientCountry ?? "Burkina Faso",
    recipientRelation: initial.recipientRelation ?? "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const newErrors = { ...e };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName?.trim()) newErrors.firstName = "Le prénom est requis";
    if (!form.lastName?.trim()) newErrors.lastName = "Le nom est requis";
    if (!form.phone?.trim()) newErrors.phone = "Le téléphone est requis";
    if (!form.address?.trim()) newErrors.address = "L'adresse est requise";
    if (!form.city?.trim()) newErrors.city = "La ville est requise";
    if (!form.country?.trim()) newErrors.country = "Le pays est requis";
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email invalide";
    }
    if (form.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipientEmail)) {
      newErrors.recipientEmail = "Email invalide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const apiData = {
        ...form,
        recipientName: `${form.recipientFirstName} ${form.recipientLastName}`.trim(),
      };
      onSubmit(apiData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Tabs defaultValue="expediteur" className="w-full">
        <TabsList className="inline-flex h-10 bg-zinc-100 rounded-md p-1 border border-zinc-200 w-fit">
          <TabsTrigger 
            value="expediteur"
            className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=inactive]:text-zinc-600 hover:text-zinc-900 transition-all duration-200 font-medium rounded text-xs sm:text-sm flex items-center justify-center gap-1.5 px-3 sm:px-4"
          >
            <UserCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Expéditeur</span>
          </TabsTrigger>
          <TabsTrigger 
            value="destinataire"
            className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=inactive]:text-zinc-600 hover:text-zinc-900 transition-all duration-200 font-medium rounded text-xs sm:text-sm flex items-center justify-center gap-1.5 px-3 sm:px-4"
          >
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Destinataire</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expediteur" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="firstName"
              label="Prénom *"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              error={errors.firstName}
              disabled={saving}
            />
            <FloatingLabelInput
              id="lastName"
              label="Nom *"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              error={errors.lastName}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                id="phone"
                value={form.phone}
                onChange={(value) => handleChange("phone", value)}
                countryIso2={form.country === "France" ? "FR" : "BF"}
                error={errors.phone}
                disabled={saving}
              />
            </div>
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingCombobox
              id="country"
              label="Pays *"
              value={form.country}
              onValueChange={(v) => {
                handleChange("country", v);
                handleChange("city", "");
              }}
              error={errors.country}
              disabled={saving}
              placeholder="Sélectionnez le pays"
              options={[
                { value: "France", label: "France" },
                { value: "Burkina Faso", label: "Burkina Faso" },
              ]}
            />
            <FloatingCombobox
              id="city"
              label="Ville *"
              value={form.city}
              onValueChange={(v) => handleChange("city", v)}
              error={errors.city}
              disabled={!form.country || saving}
              placeholder={form.country ? "Sélectionnez la ville" : "Sélectionnez d'abord le pays"}
              options={getCitiesForCountry(form.country).map((city) => ({
                value: city,
                label: city,
              }))}
            />
          </div>

          <FloatingLabelTextarea
            id="address"
            label="Adresse *"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            error={errors.address}
            rows={2}
            disabled={saving}
          />
        </TabsContent>

        <TabsContent value="destinataire" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingLabelInput
              id="recipientFirstName"
              label="Prénom"
              value={form.recipientFirstName}
              onChange={(e) => handleChange("recipientFirstName", e.target.value)}
              error={errors.recipientFirstName}
              disabled={saving}
            />
            <FloatingLabelInput
              id="recipientLastName"
              label="Nom"
              value={form.recipientLastName}
              onChange={(e) => handleChange("recipientLastName", e.target.value)}
              error={errors.recipientLastName}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                id="recipientPhone"
                value={form.recipientPhone}
                onChange={(value) => handleChange("recipientPhone", value)}
                countryIso2={form.recipientCountry === "France" ? "FR" : "BF"}
                error={errors.recipientPhone}
                disabled={saving}
              />
            </div>
            <FloatingLabelInput
              id="recipientEmail"
              type="email"
              label="Email"
              value={form.recipientEmail}
              onChange={(e) => handleChange("recipientEmail", e.target.value)}
              error={errors.recipientEmail}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingCombobox
              id="recipientCountry"
              label="Pays"
              value={form.recipientCountry}
              onValueChange={(v) => {
                handleChange("recipientCountry", v);
                handleChange("recipientCity", "");
              }}
              error={errors.recipientCountry}
              disabled={saving}
              placeholder="Sélectionnez le pays"
              options={[
                { value: "Burkina Faso", label: "Burkina Faso" },
                { value: "France", label: "France" },
              ]}
            />
            <FloatingCombobox
              id="recipientCity"
              label="Ville"
              value={form.recipientCity}
              onValueChange={(v) => handleChange("recipientCity", v)}
              error={errors.recipientCity}
              disabled={!form.recipientCountry || saving}
              placeholder={form.recipientCountry ? "Sélectionnez la ville" : "Sélectionnez d'abord le pays"}
              options={getCitiesForCountry(form.recipientCountry).map((city) => ({
                value: city,
                label: city,
              }))}
            />
          </div>

          <FloatingLabelTextarea
            id="recipientAddress"
            label="Adresse"
            value={form.recipientAddress}
            onChange={(e) => handleChange("recipientAddress", e.target.value)}
            error={errors.recipientAddress}
            rows={2}
            disabled={saving}
          />
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button 
          type="submit" 
          disabled={saving} 
          className="bg-orange-500 hover:bg-orange-600 text-white flex-1 sm:flex-initial"
        >
          {saving ? "Enregistrement…" : initial.id ? "Mettre à jour" : "Créer"}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          disabled={saving}
          className="flex-1 sm:flex-initial text-zinc-600 hover:text-zinc-900"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

export default ClientForm;
