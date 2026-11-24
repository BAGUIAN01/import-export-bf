// lib/caisse/icones.js : dessins (icônes lucide) des familles et des articles,
// enregistrés en base par leur nom (FamilleArticle.icone, Article.icone).
import {
  Apple,
  Archive,
  Armchair,
  Baby,
  Bed,
  Bike,
  Car,
  ChefHat,
  Cylinder,
  Euro,
  FileText,
  Gift,
  Hammer,
  Laptop,
  Luggage,
  MapPin,
  Microwave,
  Package,
  Refrigerator,
  Shield,
  Shirt,
  ShoppingBag,
  Truck,
  Tv,
  WashingMachine,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";

export const ICONES = {
  package: Package,
  cylinder: Cylinder,
  luggage: Luggage,
  "shopping-bag": ShoppingBag,
  archive: Archive,
  refrigerator: Refrigerator,
  "washing-machine": WashingMachine,
  microwave: Microwave,
  "chef-hat": ChefHat,
  tv: Tv,
  armchair: Armchair,
  bed: Bed,
  wine: Wine,
  car: Car,
  bike: Bike,
  truck: Truck,
  zap: Zap,
  "map-pin": MapPin,
  "file-text": FileText,
  wrench: Wrench,
  hammer: Hammer,
  shirt: Shirt,
  apple: Apple,
  laptop: Laptop,
  baby: Baby,
  gift: Gift,
  shield: Shield,
  euro: Euro,
};

/** Icônes proposées à la création d'une famille. */
export const ICONES_FAMILLES = ["package", "cylinder", "luggage", "archive", "refrigerator", "tv", "armchair", "wine", "car", "map-pin", "file-text", "wrench", "shirt", "apple", "laptop"];

export function iconeDe(nom) {
  return ICONES[nom] || Package;
}

/** Nom d'une icône à partir du composant (pour reprendre lib/data/packages.js). */
export function nomIcone(composant) {
  return Object.entries(ICONES).find(([, c]) => c === composant)?.[0] || "package";
}
