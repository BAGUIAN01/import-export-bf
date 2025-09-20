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
import { 
  Loader2, 
  User, 
  MapPin, 
  FileText,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

// Import des composants séparés
import { StepIndicator } from "./stepper-indicator";
import { 
  PersonalInformationStep, 
  RecipientInformationStep, 
  FinalizationStep 
} from "./client-form";
import { validatePhoneNumber } from "@/lib/utils/phone-formatter-utils";

const STEPS = [
  {
    id: 'personal',
    title: 'Informations personnelles',
    description: 'Renseignez vos coordonnées',
    icon: User
  },
  {
    id: 'recipient',
    title: 'Destinataire',
    description: 'Informations du destinataire',
    icon: MapPin
  },
  {
    id: 'additional',
    title: 'Finalisation',
    description: 'Informations complémentaires',
    icon: FileText
  }
];

export function ClientDialog({
  isOpen,
  onClose,
  client = null,
  onSave,
  loading = false,
}) {
  const isEditing = !!client;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
    
    // Destinataire
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    recipientAddress: "",
    recipientCity: "",
    recipientCountry: "Burkina Faso", // Par défaut
    recipientRelation: "",
    
    // Métadonnées
    isVip: false,
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        city: client.city || "",
        country: client.country || "",
        postalCode: client.postalCode || "",
        recipientName: client.recipientName || "",
        recipientPhone: client.recipientPhone || "",
        recipientEmail: client.recipientEmail || "",
        recipientAddress: client.recipientAddress || "",
        recipientCity: client.recipientCity || "",
        recipientCountry: client.recipientCountry || "Burkina Faso",
        recipientRelation: client.recipientRelation || "",
        isVip: !!client.isVip,
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
        country: "",
        postalCode: "",
        recipientName: "",
        recipientPhone: "",
        recipientEmail: "",
        recipientAddress: "",
        recipientCity: "",
        recipientCountry: "Burkina Faso",
        recipientRelation: "",
        isVip: false,
        notes: "",
      });
    }
    setErrors({});
    setCurrentStep(0);
    setCompletedSteps([]);
  }, [client, isOpen]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};
    
    if (stepIndex === 0) {
      // Validation étape 1: Informations personnelles
      if (!formData.firstName) newErrors.firstName = "Le prénom est requis";
      if (!formData.lastName) newErrors.lastName = "Le nom est requis";
      if (!formData.phone) newErrors.phone = "Le téléphone est requis";
      if (!formData.address) newErrors.address = "L'adresse est requise";
      if (!formData.city) newErrors.city = "La ville est requise";
      if (!formData.country) newErrors.country = "Le pays est requis";
      
      // Validation email
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email invalide";
      }
      
      // Validation téléphone avec formatage par pays
      if (formData.phone && formData.country) {
        if (!validatePhoneNumber(formData.phone, formData.country)) {
          newErrors.phone = `Numéro de téléphone invalide pour ${formData.country}`;
        }
      } else if (formData.phone && !/^\+?[0-9\s\-]{8,}$/.test(formData.phone)) {
        newErrors.phone = "Numéro de téléphone invalide";
      }
    }
    
    if (stepIndex === 1) {
      // Validation étape 2: Destinataire
      if (!formData.recipientName) newErrors.recipientName = "Le nom du destinataire est requis";
      if (!formData.recipientPhone) newErrors.recipientPhone = "Le téléphone du destinataire est requis";
      if (!formData.recipientAddress) newErrors.recipientAddress = "L'adresse du destinataire est requise";
      if (!formData.recipientCity) newErrors.recipientCity = "La ville du destinataire est requise";
      if (!formData.recipientCountry) newErrors.recipientCountry = "Le pays du destinataire est requis";
      
      if (formData.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
        newErrors.recipientEmail = "Email du destinataire invalide";
      }
      
      // Validation téléphone destinataire avec formatage par pays
      if (formData.recipientPhone && formData.recipientCountry) {
        if (!validatePhoneNumber(formData.recipientPhone, formData.recipientCountry)) {
          newErrors.recipientPhone = `Numéro de téléphone invalide pour ${formData.recipientCountry}`;
        }
      } else if (formData.recipientPhone && !/^\+?[0-9\s\-]{8,}$/.test(formData.recipientPhone)) {
        newErrors.recipientPhone = "Numéro du destinataire invalide";
      }
    }
    
    // Étape 3 n'a pas de validation obligatoire
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Marquer l'étape actuelle comme complétée
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Valider toutes les étapes avant soumission
    let allValid = true;
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!validateStep(i)) {
        allValid = false;
        break;
      }
    }
    
    if (!allValid) return;

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email || null,
      address: formData.address,
      city: formData.city,
      country: formData.country,
      postalCode: formData.postalCode || null,
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      recipientEmail: formData.recipientEmail || null,
      recipientAddress: formData.recipientAddress,
      recipientCity: formData.recipientCity,
      recipientCountry: formData.recipientCountry,
      recipientRelation: formData.recipientRelation || null,
      isVip: formData.isVip,
      notes: formData.notes || null,
    };

    onSave?.(payload);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonalInformationStep
            formData={formData}
            errors={errors}
            handleChange={handleChange}
          />
        );
      case 1:
        return (
          <RecipientInformationStep
            formData={formData}
            errors={errors}
            handleChange={handleChange}
          />
        );
      case 2:
        return (
          <FinalizationStep
            formData={formData}
            handleChange={handleChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? "Modifier le client" : "Nouveau client"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isEditing 
                  ? "Modifiez les informations du client et de son destinataire." 
                  : "Créez un nouveau client en suivant les étapes ci-dessous."
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6">
          <StepIndicator 
            steps={STEPS} 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {renderStepContent()}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {currentStep === 0 ? (
              "Annuler"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            {currentStep < STEPS.length - 1 ? (
              <Button 
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 min-w-[120px]"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-[120px] flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Sauvegarder" : "Créer le client"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}