// lib/data/packages.js
import { Package as PackageIcon, Truck, Shield, Euro } from "lucide-react";

export const PACKAGE_TYPES = [
  { value: "CARTON", label: "Carton", price: 50, icon: PackageIcon, desc: "Colis standard" },
  { value: "BARRIQUE", label: "Barrique", price: 80, icon: PackageIcon, desc: "Conteneur cylindrique" },
  { value: "VEHICLE", label: "Véhicule", price: 500, icon: Truck, desc: "Voiture ou camion" },
  { value: "MOTORCYCLE", label: "Moto", price: 300, icon: PackageIcon, desc: "Deux roues" },
  { value: "ELECTRONICS", label: "Électronique", price: 60, icon: PackageIcon, desc: "Appareils électroniques" },
  { value: "CLOTHING", label: "Vêtements", price: 40, icon: PackageIcon, desc: "Textiles et accessoires" },
  { value: "FOOD", label: "Alimentation", price: 45, icon: PackageIcon, desc: "Produits alimentaires" },
  { value: "DOCUMENTS", label: "Documents", price: 25, icon: PackageIcon, desc: "Papiers et courrier" },
  { value: "OTHER", label: "Autre", price: 50, icon: PackageIcon, desc: "Autre type de colis" },
];

export const PRIORITIES = [
  { value: "LOW", label: "Faible", className: "bg-gray-100 text-gray-800 border-gray-200" },
  { value: "NORMAL", label: "Normal", className: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "HIGH", label: "Élevé", className: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "URGENT", label: "Urgent", className: "bg-red-100 text-red-800 border-red-200" },
];

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces", icon: Euro, desc: "Paiement en liquide" },
  { value: "CARD", label: "Carte", icon: PackageIcon, desc: "Carte bancaire" },
  { value: "TRANSFER", label: "Virement", icon: PackageIcon, desc: "Virement bancaire" },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: PackageIcon, desc: "Paiement mobile" },
  { value: "CHEQUE", label: "Chèque", icon: PackageIcon, desc: "Paiement par chèque" },
];
