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
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  FileText,
  Check
} from "lucide-react";
import  PhoneInput  from "./phone-input";

const burkinaCities = [
  "Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", 
  "Pouytenga", "Dédougou", "Fada N'gourma", "Kaya", "Tenkodogo"
];

const frenchCities = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", 
  "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", 
  "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"
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
        <CardTitle className="text-lg">Informations de l'expéditeur</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez les coordonnées de la personne qui envoie le colis
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Section Identité */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Identité</h3>
          </div>
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className={errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Ex: Jean"
                autoComplete="given-name"
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
                placeholder="Ex: Dupont"
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Section Contact */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Coordonnées</h3>
          </div>
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
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
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Ex: jean.dupont@email.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
              <p className="text-xs text-muted-foreground">Pour recevoir les notifications</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section Localisation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Adresse en France</h3>
          </div>
          
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Pays <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.country} onValueChange={(v) => {
                handleChange("country", v);
                if (formData.city) handleChange("city", "");
                if (formData.phone) {
                  handleChange("phone", formData.phone);
                }
              }}>
                <SelectTrigger className={errors.country ? "border-destructive focus:ring-destructive" : ""}>
                  <SelectValue placeholder="Sélectionnez le pays" />
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
                  <SelectValue placeholder={formData.country ? "Sélectionnez la ville" : "Sélectionnez d'abord le pays"} />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Adresse complète <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className={`resize-none ${errors.address ? "border-destructive focus-visible:ring-destructive" : ""}`}
                placeholder="Ex: 123 rue de la République, Appartement 4B"
                autoComplete="street-address"
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium">
                Code postal
              </Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleChange("postalCode", e.target.value)}
                placeholder={formData.country === "France" ? "Ex: 75001" : "Ex: 01 BP 1234"}
                autoComplete="postal-code"
              />
            </div>
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
        <CardTitle className="text-lg">Informations du destinataire</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez les coordonnées du destinataire (France ou Burkina Faso)
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Section Identité */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Identité</h3>
          </div>
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipientFirstName" className="text-sm font-medium">
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recipientFirstName"
                value={formData.recipientFirstName}
                onChange={(e) => handleChange("recipientFirstName", e.target.value)}
                className={errors.recipientFirstName ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Ex: Bouba"
              />
              {errors.recipientFirstName && (
                <p className="text-sm text-destructive">{errors.recipientFirstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipientLastName" className="text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recipientLastName"
                value={formData.recipientLastName}
                onChange={(e) => handleChange("recipientLastName", e.target.value)}
                className={errors.recipientLastName ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder="Ex: Ouédraogo"
              />
              {errors.recipientLastName && (
                <p className="text-sm text-destructive">{errors.recipientLastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientRelation" className="text-sm font-medium">
              Lien avec l'expéditeur
            </Label>
            <Select value={formData.recipientRelation} onValueChange={(v) => handleChange("recipientRelation", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le type de relation" />
              </SelectTrigger>
              <SelectContent>
                {relations.map((relation) => (
                  <SelectItem key={relation} value={relation}>
                    {relation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Optionnel - aide à l'identification</p>
          </div>
        </div>

        <Separator />

        {/* Section Contact */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Coordonnées</h3>
          </div>
          <div className="grid gap-3 xs:gap-4 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2">
            <PhoneInput
              id="recipientPhone"
              label="Téléphone"
              value={formData.recipientPhone}
              onChange={(value) => handleChange("recipientPhone", value)}
              countryIso2={formData.recipientCountry === "France" ? "FR" : "BF"}
              error={errors.recipientPhone}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="recipientEmail" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleChange("recipientEmail", e.target.value)}
                className={errors.recipientEmail ? "border-destructive focus-visible:ring-destructive" : ""}
                placeholder={formData.recipientCountry === "France" ? "Ex: jean@email.fr" : "Ex: bouba@email.bf"}
              />
              {errors.recipientEmail && (
                <p className="text-sm text-destructive">{errors.recipientEmail}</p>
              )}
              <p className="text-xs text-muted-foreground">Pour informer de l'arrivée du colis</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section Adresse */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Adresse de livraison</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientCountry" className="text-sm font-medium">
              Pays <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.recipientCountry} onValueChange={(v) => {
              handleChange("recipientCountry", v);
              // Réinitialiser la ville quand on change de pays
              handleChange("recipientCity", "");
            }}>
              <SelectTrigger className={errors.recipientCountry ? "border-destructive focus:ring-destructive" : ""}>
                <SelectValue placeholder="Sélectionnez le pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                <SelectItem value="France">France</SelectItem>
              </SelectContent>
            </Select>
            {errors.recipientCountry && (
              <p className="text-sm text-destructive">{errors.recipientCountry}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientCity" className="text-sm font-medium">
              Ville <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.recipientCity} onValueChange={(v) => handleChange("recipientCity", v)}>
              <SelectTrigger className={errors.recipientCity ? "border-destructive focus:ring-destructive" : ""}>
                <SelectValue placeholder="Sélectionnez la ville" />
              </SelectTrigger>
              <SelectContent>
                {formData.recipientCountry === "France" ? (
                  frenchCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))
                ) : (
                  burkinaCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.recipientCity && (
              <p className="text-sm text-destructive">{errors.recipientCity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientAddress" className="text-sm font-medium">
              Adresse complète <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="recipientAddress"
              rows={2}
              value={formData.recipientAddress}
              onChange={(e) => handleChange("recipientAddress", e.target.value)}
              className={`resize-none ${errors.recipientAddress ? "border-destructive focus-visible:ring-destructive" : ""}`}
              placeholder={formData.recipientCountry === "France" ? "Ex: 123 Rue de la Paix, 75001 Paris" : "Ex: Secteur 15, Zone du Bois, près du marché"}
            />
            {errors.recipientAddress && (
              <p className="text-sm text-destructive">{errors.recipientAddress}</p>
            )}
            <p className="text-xs text-muted-foreground">Soyez précis pour faciliter la livraison</p>
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
        <CardTitle className="text-lg">Finalisation</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez les informations et ajoutez des notes si nécessaire
        </p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Récapitulatif */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-blue-900">
            <Check className="h-4 w-4" />
            Récapitulatif des informations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <p className="font-medium text-blue-900">Expéditeur</p>
              <div className="space-y-1 text-blue-700">
                <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                <p>{formData.phone}</p>
                {formData.email && <p>{formData.email}</p>}
                <p>{formData.address}</p>
                <p>{formData.city}, {formData.country} {formData.postalCode}</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-blue-900">Destinataire</p>
              <div className="space-y-1 text-blue-700">
                <p className="font-medium">{formData.recipientFirstName} {formData.recipientLastName}</p>
                {formData.recipientRelation && (
                  <p className="text-xs italic">({formData.recipientRelation})</p>
                )}
                <p>{formData.recipientPhone}</p>
                {formData.recipientEmail && <p>{formData.recipientEmail}</p>}
                <p>{formData.recipientAddress}</p>
                <p>{formData.recipientCity}, Burkina Faso</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Options supplémentaires */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Options et notes</h3>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
            <Checkbox
              id="isVip"
              checked={formData.isVip}
              onCheckedChange={(v) => handleChange("isVip", !!v)}
            />
            <div className="flex-1">
              <Label htmlFor="isVip" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                <span className="text-amber-900">Marquer comme client VIP</span>
              </Label>
              <p className="text-xs text-amber-700 mt-0.5">
                Les clients VIP bénéficient d'un suivi prioritaire
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes internes
            </Label>
            <Textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="resize-none"
              placeholder="Ex: Préfère être contacté par WhatsApp, disponible en semaine après 18h..."
            />
            <p className="text-xs text-muted-foreground">
              Ces notes ne seront visibles que par votre équipe
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}