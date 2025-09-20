// lib/data/packages.js
import { 
  Package as PackageIcon, 
  Truck, 
  Shield, 
  Euro,
  Car, 
  Tv, 
  Wine, 
  Armchair, 
  Refrigerator, 
  ChefHat, 
  Bike, 
  WashingMachine, 
  Zap, 
  Bed, 
  Microwave,
  Luggage,
  ShoppingBag,
  Archive,
  Cylinder
} from "lucide-react";

export const PACKAGE_TYPES = [
  // === CARTONS ===
  {
    value: "CARTON",
    label: "Carton Standard",
    desc: "40×40×35 cm",
    price: 40,
    icon: PackageIcon,
    category: "cartons"
  },
  {
    value: "CARTON_MEDIUM",
    label: "Carton Moyen",
    desc: "80×50×50 cm - RP: 90€ / Province: 140€",
    price: 90,
    priceProvince: 140,
    icon: PackageIcon,
    category: "cartons"
  },
  {
    value: "CARTON_LARGE",
    label: "Carton Grand",
    desc: "80×60×60 cm - RP: 100€ / Province: 140€",
    price: 100,
    priceProvince: 140,
    icon: PackageIcon,
    category: "cartons"
  },

  // === FÛTS / BARRIQUES ===
  {
    value: "BARRIQUE",
    label: "Fût Bleu 220L",
    desc: "RP: 120€ / Province: 160€",
    price: 120,
    priceProvince: 160,
    icon: Cylinder,
    category: "futs"
  },
  {
    value: "FUT_BLACK_270L",
    label: "Fût Noir 270L",
    desc: "RP: 120€ / Province: 170€",
    price: 120,
    priceProvince: 170,
    icon: Cylinder,
    category: "futs"
  },

  // === BAGAGES ===
  {
    value: "VALISE_SMALL",
    label: "Petite Valise",
    desc: "Valise cabine",
    price: 30,
    icon: Luggage,
    category: "bagages"
  },
  {
    value: "VALISE_MEDIUM",
    label: "Valise Moyenne",
    desc: "Valise standard",
    price: 50,
    icon: Luggage,
    category: "bagages"
  },
  {
    value: "VALISE_LARGE",
    label: "Grande Valise",
    desc: "Valise voyage",
    price: 70,
    icon: Luggage,
    category: "bagages"
  },
  {
    value: "VALISE_XLARGE",
    label: "Très Grande Valise",
    desc: "Valise XXL",
    price: 100,
    icon: Luggage,
    category: "bagages"
  },
  {
    value: "SAC_MEDIUM",
    label: "Sac Moyen",
    desc: "Sac de taille moyenne",
    price: 60,
    icon: ShoppingBag,
    category: "bagages"
  },
  {
    value: "SAC_LARGE",
    label: "Grand Sac",
    desc: "Sac de voyage / sac boudin",
    price: 70,
    icon: ShoppingBag,
    category: "bagages"
  },
  {
    value: "SAC_XLARGE",
    label: "Très Grand Sac",
    desc: "Sac XXL",
    price: 100,
    icon: ShoppingBag,
    category: "bagages"
  },

  // === CANTINES ===
  {
    value: "CANTINE_SMALL",
    label: "Petite Cantine",
    desc: "Cantine de petite taille",
    price: 70,
    icon: Archive,
    category: "cantines"
  },
  {
    value: "CANTINE_MEDIUM",
    label: "Cantine Moyenne",
    desc: "Cantine standard",
    price: 120,
    icon: Archive,
    category: "cantines"
  },
  {
    value: "CANTINE_LARGE",
    label: "Grande Cantine",
    desc: "Grande cantine",
    price: 160,
    icon: Archive,
    category: "cantines"
  },
  {
    value: "CANTINE_XLARGE",
    label: "Très Grande Cantine",
    desc: "Cantine XXL",
    price: 180,
    icon: Archive,
    category: "cantines"
  },

  // === ÉLECTROMÉNAGER ===
  {
    value: "ELECTRONICS",
    label: "Micro-ondes",
    desc: "Four micro-ondes",
    price: 30,
    icon: Microwave,
    category: "electromenager"
  },
  {
    value: "FRIDGE_SMALL",
    label: "Petit Frigo",
    desc: "Frigo compact",
    price: 100,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "FRIDGE_STANDARD",
    label: "Frigo Standard",
    desc: "À partir de 160€",
    price: 160,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "FRIDGE_LARGE",
    label: "Grand Frigo",
    desc: "À partir de 200€",
    price: 200,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "FRIDGE_AMERICAN",
    label: "Frigo Américain",
    desc: "Réfrigérateur américain",
    price: 300,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "FREEZER_SMALL",
    label: "Petit Congélateur",
    desc: "Congélateur compact",
    price: 140,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "FREEZER_MEDIUM",
    label: "Congélateur Moyen",
    desc: "À partir de 300€",
    price: 300,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "FREEZER_LARGE",
    label: "Grand Congélateur",
    desc: "À partir de 380€",
    price: 380,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "WASHING_MACHINE",
    label: "Lave-linge",
    desc: "Machine à laver",
    price: 120,
    icon: WashingMachine,
    category: "electromenager"
  },
  {
    value: "STOVE",
    label: "Gazinière",
    desc: "Cuisinière à gaz",
    price: 120,
    icon: ChefHat,
    category: "electromenager"
  },

  // === TÉLÉVISEURS ===
  {
    value: "TV_32",
    label: "TV 32\" (80 cm)",
    desc: "Téléviseur 32 pouces",
    price: 90,
    icon: Tv,
    category: "tv"
  },
  {
    value: "TV_40",
    label: "TV 40\" (100 cm)",
    desc: "Téléviseur 40 pouces",
    price: 130,
    icon: Tv,
    category: "tv"
  },
  {
    value: "TV_48",
    label: "TV 48\" (123 cm)",
    desc: "Téléviseur 48 pouces",
    price: 150,
    icon: Tv,
    category: "tv"
  },
  {
    value: "TV_55",
    label: "TV 55\" (140 cm)",
    desc: "Téléviseur 55 pouces",
    price: 180,
    icon: Tv,
    category: "tv"
  },
  {
    value: "TV_65",
    label: "TV 65\" (163 cm)",
    desc: "Téléviseur 65 pouces",
    price: 200,
    icon: Tv,
    category: "tv"
  },
  {
    value: "TV_75",
    label: "TV 75\" (189 cm)",
    desc: "Téléviseur 75 pouces",
    price: 270,
    icon: Tv,
    category: "tv"
  },
  {
    value: "TV_80",
    label: "TV 80\" (203 cm)",
    desc: "Téléviseur 80 pouces",
    price: 300,
    icon: Tv,
    category: "tv"
  },

  // === MOBILIER ===
  {
    value: "CHAIR_STACKABLE",
    label: "Chaise Empilable",
    desc: "Chaise qui s'empile",
    price: 10,
    icon: Armchair,
    category: "mobilier"
  },
  {
    value: "CHAIR_STANDARD",
    label: "Chaise Standard",
    desc: "Chaise non empilable",
    price: 30,
    icon: Armchair,
    category: "mobilier"
  },
  {
    value: "OFFICE_CHAIR",
    label: "Chaise de Bureau",
    desc: "Fauteuil de bureau",
    price: 40,
    icon: Armchair,
    category: "mobilier"
  },
  {
    value: "ARMCHAIR",
    label: "Fauteuil",
    desc: "Fauteuil standard",
    price: 120,
    icon: Armchair,
    category: "mobilier"
  },
  {
    value: "SOFA_SEAT",
    label: "Canapé (par place)",
    desc: "100€ par place assise",
    price: 100,
    icon: Armchair,
    category: "mobilier"
  },
  {
    value: "MATTRESS_SEAT",
    label: "Matelas (par place)",
    desc: "60€ par place",
    price: 60,
    icon: Bed,
    category: "mobilier"
  },

  // === VINS & CHAMPAGNES ===
  {
    value: "WINE_6_BOTTLES",
    label: "Carton 6 Vins",
    desc: "À partir de 10€",
    price: 10,
    icon: Wine,
    category: "vins"
  },
  {
    value: "WINE_12_BOTTLES",
    label: "Carton 12 Vins",
    desc: "Carton de 12 bouteilles",
    price: 18,
    icon: Wine,
    category: "vins"
  },
  {
    value: "CHAMPAGNE_6_BOTTLES",
    label: "Carton 6 Champagnes",
    desc: "Carton de 6 bouteilles",
    price: 28,
    icon: Wine,
    category: "vins"
  },
  {
    value: "CHAMPAGNE_12_BOTTLES",
    label: "Carton 12 Champagnes",
    desc: "Carton de 12 bouteilles",
    price: 32,
    icon: Wine,
    category: "vins"
  },

  // === VÉHICULES ===
  {
    value: "VEHICLE",
    label: "Petite Voiture",
    desc: "Voiture chargée",
    price: 1500,
    icon: Car,
    category: "vehicules"
  },
  {
    value: "SUV_4X4",
    label: "SUV 4x4",
    desc: "À partir de 2000€",
    price: 2000,
    icon: Car,
    category: "vehicules"
  },
  {
    value: "MOTORCYCLE",
    label: "Vélo",
    desc: "À partir de 30€",
    price: 30,
    icon: Bike,
    category: "vehicules"
  },

  // === DIVERS ===
  {
    value: "GENERATOR_SMALL",
    label: "Groupe Électrogène",
    desc: "À partir de 280€",
    price: 280,
    icon: Zap,
    category: "divers"
  },
  {
    value: "FOOD",
    label: "Alimentation",
    desc: "Produits alimentaires",
    price: 45,
    icon: PackageIcon,
    category: "divers"
  },
  {
    value: "CLOTHING",
    label: "Vêtements",
    desc: "Textiles et accessoires",
    price: 40,
    icon: PackageIcon,
    category: "divers"
  },
  {
    value: "DOCUMENTS",
    label: "Documents",
    desc: "Papiers et courrier",
    price: 25,
    icon: PackageIcon,
    category: "divers"
  },

  // === SUR DEVIS ===
  {
    value: "OTHER",
    label: "Autre Véhicule",
    desc: "Sur devis",
    price: 0,
    isQuoteOnly: true,
    icon: Car,
    category: "vehicules"
  },
  {
    value: "FREEZER_XLARGE",
    label: "Très Grand Congélateur",
    desc: "Sur devis",
    price: 0,
    isQuoteOnly: true,
    icon: Refrigerator,
    category: "electromenager"
  },
  {
    value: "TV_OTHER",
    label: "TV Autre Taille",
    desc: "Sur devis",
    price: 0,
    isQuoteOnly: true,
    icon: Tv,
    category: "tv"
  },
  {
    value: "INDUSTRIAL",
    label: "Matériel Industriel",
    desc: "Sur devis",
    price: 0,
    isQuoteOnly: true,
    icon: PackageIcon,
    category: "divers"
  }
];

// Catégories pour organiser l'affichage
export const PACKAGE_CATEGORIES = [
  {
    key: "cartons",
    label: "Cartons",
    color: "bg-blue-50 border-blue-200 text-blue-800"
  },
  {
    key: "futs",
    label: "Fûts / Barriques",
    color: "bg-purple-50 border-purple-200 text-purple-800"
  },
  {
    key: "bagages",
    label: "Bagages & Sacs",
    color: "bg-green-50 border-green-200 text-green-800"
  },
  {
    key: "cantines",
    label: "Cantines",
    color: "bg-yellow-50 border-yellow-200 text-yellow-800"
  },
  {
    key: "electromenager",
    label: "Électroménager",
    color: "bg-red-50 border-red-200 text-red-800"
  },
  {
    key: "tv",
    label: "Téléviseurs",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800"
  },
  {
    key: "mobilier",
    label: "Mobilier",
    color: "bg-orange-50 border-orange-200 text-orange-800"
  },
  {
    key: "vins",
    label: "Vins & Champagnes",
    color: "bg-pink-50 border-pink-200 text-pink-800"
  },
  {
    key: "vehicules",
    label: "Véhicules",
    color: "bg-gray-50 border-gray-200 text-gray-800"
  },
  {
    key: "divers",
    label: "Divers",
    color: "bg-teal-50 border-teal-200 text-teal-800"
  }
];

// Fonction pour obtenir le prix selon la région
export const getPriceByRegion = (packageType, isParisRegion = true) => {
  if (packageType.isQuoteOnly) return "Sur devis";
  
  if (packageType.priceProvince && !isParisRegion) {
    return packageType.priceProvince;
  }
  
  return packageType.price;
};

// Fonction pour grouper les types par catégorie
export const getPackageTypesByCategory = () => {
  return PACKAGE_CATEGORIES.map(category => ({
    ...category,
    types: PACKAGE_TYPES.filter(type => type.category === category.key)
  }));
};

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