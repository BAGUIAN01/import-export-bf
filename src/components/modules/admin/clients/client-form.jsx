import React from "react";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  FileText,
  Check
} from "lucide-react";
import { PhoneInput } from "./phone-input";

const frenchCities = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", 
  "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims"
];

const burkinaCities = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", 
  "Pouytenga", "Dédougou", "Fada N'gourma", "Kaya", "Tenkodogo"
];

const countries = ["France", "Burkina Faso"];

const getCitiesForCountry = (country) => {
  if (country === "France") return frenchCities;
  if (country === "Burkina Faso") return burkinaCities;
  return [];
};

const relations = [
  "Famille", "Ami(e)", "Conjoint(e)", "Parent", "Enfant", "Frère/Sœur", 
  "Cousin(e)", "Associé(e)", "Autre"
];

export function PersonalInformationStep({ formData, errors, handleChange }) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Vos informations personnelles
          {formData.isVip && <Badge variant="secondary" className="ml-2"><Star className="h-3 w-3 mr-1" />VIP</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className={errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
              placeholder="Jean"
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className={errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
              placeholder="Dupont"
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhoneInput
            id="phone"
            label="Téléphone"
            value={formData.phone}
            onChange={(value) => handleChange("phone", value)}
            country={formData.country}
            error={errors.phone}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-3 w-3" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              placeholder="client@email.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            Adresse <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="address"
            rows={2}
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={`resize-none ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
            placeholder="123 rue de la République"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Pays <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.country} onValueChange={(v) => {
              handleChange("country", v);
              if (formData.city) handleChange("city", "");
              // Reformater le numéro de téléphone selon le nouveau pays
              if (formData.phone) {
                handleChange("phone", formData.phone);
              }
            }}>
              <SelectTrigger className={errors.country ? "border-destructive focus:ring-destructive" : ""}>
                <SelectValue placeholder="Choisir un pays" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              Ville <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.city} 
              onValueChange={(v) => handleChange("city", v)}
              disabled={!formData.country}
            >
              <SelectTrigger className={errors.city ? "border-destructive focus:ring-destructive" : ""}>
                <SelectValue placeholder={formData.country ? "Choisir une ville" : "Sélectionner d'abord un pays"} />
              </SelectTrigger>
              <SelectContent>
                {getCitiesForCountry(formData.country).map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-sm font-medium">Code postal</Label>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              placeholder={formData.country === "France" ? "75001" : "01 BP 1234"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecipientInformationStep({ formData, errors, handleChange }) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Informations du destinataire
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-medium">
              Nom complet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipientName"
              value={formData.recipientName}
              onChange={(e) => handleChange("recipientName", e.target.value)}
              className={errors.recipientName ? "border-destructive focus-visible:ring-destructive" : ""}
              placeholder="Prénom Nom"
            />
            {errors.recipientName && (
              <p className="text-sm text-destructive">{errors.recipientName}</p>
            )}
          </div>

          <PhoneInput
            id="recipientPhone"
            label="Téléphone"
            value={formData.recipientPhone}
            onChange={(value) => handleChange("recipientPhone", value)}
            country={formData.recipientCountry}
            error={errors.recipientPhone}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientEmail" className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-3 w-3" />
            Email
          </Label>
          <Input
            id="recipientEmail"
            type="email"
            value={formData.recipientEmail}
            onChange={(e) => handleChange("recipientEmail", e.target.value)}
            className={errors.recipientEmail ? "border-destructive focus-visible:ring-destructive" : ""}
            placeholder="destinataire@email.bf"
          />
          {errors.recipientEmail && (
            <p className="text-sm text-destructive">{errors.recipientEmail}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientAddress" className="text-sm font-medium">
            Adresse <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="recipientAddress"
            rows={2}
            value={formData.recipientAddress}
            onChange={(e) => handleChange("recipientAddress", e.target.value)}
            className={`resize-none ${errors.recipientAddress ? "border-destructive focus-visible:ring-destructive" : ""}`}
            placeholder="Secteur 15, Zone du Bois"
          />
          {errors.recipientAddress && (
            <p className="text-sm text-destructive">{errors.recipientAddress}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipientCity" className="text-sm font-medium">
              Ville <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.recipientCity} onValueChange={(v) => handleChange("recipientCity", v)}>
              <SelectTrigger className={errors.recipientCity ? "border-destructive focus:ring-destructive" : ""}>
                <SelectValue placeholder="Choisir une ville" />
              </SelectTrigger>
              <SelectContent>
                {burkinaCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.recipientCity && (
              <p className="text-sm text-destructive">{errors.recipientCity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientRelation" className="text-sm font-medium">Relation</Label>
            <Select value={formData.recipientRelation} onValueChange={(v) => handleChange("recipientRelation", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Type de relation" />
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
      </CardContent>
    </Card>
  );
}

export function FinalizationStep({ formData, handleChange }) {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Finalisation
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50 border-2 border-dashed">
          <Checkbox
            id="isVip"
            checked={formData.isVip}
            onCheckedChange={(v) => handleChange("isVip", !!v)}
          />
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <Label htmlFor="isVip" className="text-sm font-medium cursor-pointer">
              Client VIP
            </Label>
            <Badge variant="outline" className="ml-2 text-xs">
              Optionnel
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">Notes internes</Label>
          <Textarea
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="resize-none"
            placeholder="Informations complémentaires sur le client, préférences d'envoi, instructions spéciales..."
          />
          <p className="text-xs text-muted-foreground">
            Ces informations ne seront visibles que par votre équipe
          </p>
        </div>

        {/* Récapitulatif */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            Récapitulatif
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Expéditeur</p>
              <p>{formData.firstName} {formData.lastName}</p>
              <p className="text-muted-foreground">{formData.phone}</p>
              <p className="text-muted-foreground">{formData.city}, {formData.country}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Destinataire</p>
              <p>{formData.recipientName}</p>
              <p className="text-muted-foreground">{formData.recipientPhone}</p>
              <p className="text-muted-foreground">{formData.recipientCity}, Burkina Faso</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}