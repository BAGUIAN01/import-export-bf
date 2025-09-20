import { useState, useEffect } from "react";
import { normalizeDateInput, getTotal, derivePaymentStatus } from "@/lib/utils/package-helpers";
import { PACKAGE_TYPES } from "@/lib/data/packages";

export const usePackageForm = (editingPackage, isOpen) => {
  const [form, setForm] = useState({
    clientId: "",
    type: "CARTON",
    description: "",
    quantity: 1,
    weight: 1,
    value: "",
    priority: "NORMAL",
    isFragile: false,
    isInsured: false,
    pickupAddress: "",
    pickupDate: "",
    pickupTime: "",
    deliveryAddress: "",
    specialInstructions: "",
    basePrice: 50,
    pickupFee: 20,
    insuranceFee: 0,
    customsFee: 0,
    discount: 0,
    paymentMethod: "",
    paidAmount: 0,
    paidAt: "",
    paymentStatus: "PENDING",
    totalAmount: 50,
  });

  const [errors, setErrors] = useState({});

  // Calcul automatique des prix
  useEffect(() => {
    const typePrice = PACKAGE_TYPES.find((t) => t.value === form.type)?.price || 50;
    const insuranceFee = form.isInsured ? Math.max(10, (Number(form.value) || 0) * 0.02) : 0;

    const nextLike = { ...form, basePrice: typePrice, insuranceFee };
    const total = getTotal(nextLike);

    setForm((prev) => ({
      ...prev,
      basePrice: typePrice,
      insuranceFee,
      totalAmount: total,
      paymentStatus: derivePaymentStatus(total, Number(prev.paidAmount || 0)),
    }));
  }, [form.type, form.pickupFee, form.customsFee, form.discount, form.isInsured, form.value]);

  // Initialisation du formulaire
  useEffect(() => {
    if (editingPackage) {
      setForm({
        clientId: editingPackage.clientId || "",
        type: editingPackage.type || "CARTON",
        description: editingPackage.description || "",
        quantity: editingPackage.quantity ?? 1,
        weight: Number(editingPackage.weight ?? 1),
        value: Number(editingPackage.value ?? 0),
        priority: editingPackage.priority || "NORMAL",
        isFragile: !!editingPackage.isFragile,
        isInsured: !!editingPackage.isInsured,
        pickupAddress: editingPackage.pickupAddress || "",
        pickupDate: normalizeDateInput(editingPackage.pickupDate),
        pickupTime: editingPackage.pickupTime || "",
        deliveryAddress: editingPackage.deliveryAddress || "",
        specialInstructions: editingPackage.specialInstructions || "",
        basePrice: Number(editingPackage.basePrice ?? 50),
        pickupFee: Number(editingPackage.pickupFee ?? 0),
        insuranceFee: Number(editingPackage.insuranceFee ?? 0),
        customsFee: Number(editingPackage.customsFee ?? 0),
        discount: Number(editingPackage.discount ?? 0),
        paymentMethod: editingPackage.paymentMethod || "",
        paidAmount: Number(editingPackage.paidAmount ?? 0),
        paidAt: normalizeDateInput(editingPackage.paidAt),
        paymentStatus: editingPackage.paymentStatus || "PENDING",
        totalAmount: Number(editingPackage.totalAmount ?? 0),
      });
    } else {
      setForm({
        clientId: "",
        type: "CARTON",
        description: "",
        quantity: 1,
        weight: 1,
        value: "",
        priority: "NORMAL",
        isFragile: false,
        isInsured: false,
        pickupAddress: "",
        pickupDate: "",
        pickupTime: "",
        deliveryAddress: "",
        specialInstructions: "",
        basePrice: 50,
        pickupFee: 20,
        insuranceFee: 0,
        customsFee: 0,
        discount: 0,
        paymentMethod: "",
        paidAmount: 0,
        paidAt: "",
        paymentStatus: "PENDING",
        totalAmount: 50,
      });
    }
    setErrors({});
  }, [editingPackage, isOpen]);

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!form.clientId) newErrors.clientId = "Client requis";
      if (!form.type) newErrors.type = "Type de colis requis";
    }
    if (step === 2) {
      if (!form.description.trim()) newErrors.description = "Description requise";
      if (form.quantity < 1) newErrors.quantity = "Quantité invalide";
    }
    if (step === 3) {
      if (!form.deliveryAddress.trim()) newErrors.deliveryAddress = "Adresse de livraison requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { form, setForm, errors, setErrors, validateStep };
};