"use client";
import React, { useEffect, useState, useCallback } from "react";
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
  ChevronRight,
  ChevronLeft
} from "lucide-react";

// Import des composants séparés
import { 
  PersonalInformationStep, 
  RecipientInformationStep, 
  FinalizationStep 
} from "./client-form";
import { validatePhoneNumber } from "@/lib/utils/phone-formatter-utils";

const STEPS = [
  { id: 'personal', title: 'Informations personnelles' },
  { id: 'recipient', title: 'Destinataire' },
  { id: 'finalization', title: 'Finalisation' }
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
    recipientFirstName: "",
    recipientLastName: "",
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
    if (isOpen) {
      if (client) {
        // Si l'ancien client a recipientName, le séparer en prénom/nom
        let recipientFirstName = client.recipientFirstName || "";
        let recipientLastName = client.recipientLastName || "";
        
        if (!recipientFirstName && !recipientLastName && client.recipientName) {
          const parts = client.recipientName.trim().split(" ");
          recipientFirstName = parts[0] || "";
          recipientLastName = parts.slice(1).join(" ") || "";
        }
        
        setFormData({
          firstName: client.firstName || "",
          lastName: client.lastName || "",
          phone: client.phone || "",
          email: client.email || "",
          address: client.address || "",
          city: client.city || "",
          country: client.country || "",
          postalCode: client.postalCode || "",
          recipientFirstName,
          recipientLastName,
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
          recipientFirstName: "",
          recipientLastName: "",
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
    }
  }, [client, isOpen]);

  const handleChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const validateStep = useCallback((stepIndex) => {
    const newErrors = {};
    
    if (stepIndex === 0) {
      if (!formData.firstName?.trim()) newErrors.firstName = "Le prénom est requis";
      if (!formData.lastName?.trim()) newErrors.lastName = "Le nom est requis";
      if (!formData.phone?.trim()) newErrors.phone = "Le téléphone est requis";
      if (!formData.address?.trim()) newErrors.address = "L'adresse est requise";
      if (!formData.city?.trim()) newErrors.city = "La ville est requise";
      if (!formData.country?.trim()) newErrors.country = "Le pays est requis";
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email invalide";
      }
      
      if (formData.phone && formData.country) {
        if (!validatePhoneNumber(formData.phone, formData.country)) {
          newErrors.phone = `Numéro de téléphone invalide pour ${formData.country}`;
        }
      }
    }
    
    if (stepIndex === 1) {
      if (!formData.recipientFirstName?.trim()) newErrors.recipientFirstName = "Le prénom du destinataire est requis";
      if (!formData.recipientLastName?.trim()) newErrors.recipientLastName = "Le nom du destinataire est requis";
      if (!formData.recipientPhone?.trim()) newErrors.recipientPhone = "Le téléphone du destinataire est requis";
      if (!formData.recipientAddress?.trim()) newErrors.recipientAddress = "L'adresse du destinataire est requise";
      if (!formData.recipientCity?.trim()) newErrors.recipientCity = "La ville du destinataire est requise";
      
      if (formData.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.recipientEmail)) {
        newErrors.recipientEmail = "Email du destinataire invalide";
      }
      
      if (formData.recipientPhone && formData.recipientCountry) {
        if (!validatePhoneNumber(formData.recipientPhone, formData.recipientCountry)) {
          newErrors.recipientPhone = `Numéro de téléphone invalide pour ${formData.recipientCountry}`;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setErrors({});
  }, []);

  const handleSubmit = useCallback(() => {
    // Valider les deux premières étapes
    if (!validateStep(0) || !validateStep(1)) {
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || null,
      address: formData.address.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      postalCode: formData.postalCode?.trim() || null,
      recipientFirstName: formData.recipientFirstName.trim(),
      recipientLastName: formData.recipientLastName.trim(),
      recipientName: `${formData.recipientFirstName.trim()} ${formData.recipientLastName.trim()}`, // Pour compatibilité
      recipientPhone: formData.recipientPhone.trim(),
      recipientEmail: formData.recipientEmail?.trim() || null,
      recipientAddress: formData.recipientAddress.trim(),
      recipientCity: formData.recipientCity.trim(),
      recipientCountry: formData.recipientCountry,
      recipientRelation: formData.recipientRelation?.trim() || null,
      isVip: formData.isVip,
      notes: formData.notes?.trim() || null,
    };

    onSave?.(payload);
  }, [formData, onSave, validateStep]);

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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
          <DialogDescription>
            Étape {currentStep + 1} sur {STEPS.length} : {STEPS[currentStep].title}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] px-1">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={currentStep === 0 ? onClose : handlePrevious}
            disabled={loading}
          >
            {currentStep === 0 ? (
              "Annuler"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </>
            )}
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button 
              type="button"
              onClick={handleNext}
              disabled={loading}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Sauvegarder" : "Créer le client"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}