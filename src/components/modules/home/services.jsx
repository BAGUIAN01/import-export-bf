"use client";

import {
  Package,
  Box,
  Wine,
  Snowflake,
  Sofa,
  Tv,
  Briefcase,
  Car,
} from "lucide-react";
import Link from "next/link";

const categories = [
  {
    id: "futs",
    title: "Fûts",
    subtitle: "Région Parisienne / Province",
    icon: Package,
    items: [
      { name: "Fût bleu — 220 L", price: "120 € / 160 €" },
      { name: "Fût noir — 270 L", price: "120 € / 170 €" },
    ],
  },
  {
    id: "cartons",
    title: "Cartons",
    subtitle: "Région Parisienne / Province",
    icon: Box,
    highlighted: true,
    items: [
      { name: "80 × 60 × 60 cm", price: "100 € / 160 €" },
      { name: "80 × 50 × 50 cm", price: "90 € / 170 €" },
      { name: "40 × 40 × 35 cm", price: "40 € / 40 €" },
    ],
  },
  {
    id: "boissons",
    title: "Boissons",
    subtitle: "Vins & Champagnes",
    icon: Wine,
    items: [
      { name: "Carton 6 bouteilles Vin", price: "15 €" },
      { name: "Carton 12 bouteilles Vin", price: "25 €" },
      { name: "Carton 6 bouteilles Champagne", price: "15 €" },
      { name: "Carton 12 bouteilles Champagne", price: "30 €" },
    ],
  },
  {
    id: "refrigeration",
    title: "Réfrigération",
    subtitle: "Frigos & congélateurs",
    icon: Snowflake,
    items: [
      { name: "Petit Frigo", price: "100 €" },
      { name: "Frigo standard", price: "dès 160 €" },
      { name: "Grand Frigo", price: "dès 200 €" },
      { name: "Frigo Américain", price: "dès 300 €" },
      { name: "Tout-petit Congélateur", price: "140 €" },
      { name: "Congélateur moyen", price: "dès 300 €" },
      { name: "Grand Congélateur", price: "dès 380 €" },
      { name: "Très grand Congélateur", price: "Sur devis" },
    ],
  },
  {
    id: "mobilier",
    title: "Mobilier & Équipement",
    subtitle: "Meubles & électroménager",
    icon: Sofa,
    items: [
      { name: "Chaise empilable", price: "10 €" },
      { name: "Chaise non empilable", price: "30 €" },
      { name: "Chaise de bureau", price: "40 €" },
      { name: "Fauteuil", price: "120 €" },
      { name: "Canapé (par assise)", price: "100 €" },
      { name: "Gazinière", price: "120 €" },
      { name: "Lave-linge", price: "120 €" },
      { name: "Vélo", price: "dès 30 €" },
      { name: "Groupe électrogène", price: "dès 30 €" },
      { name: "Matelas (par place)", price: "60 €" },
      { name: "Micro-onde", price: "30 €" },
      { name: "Matériel industriel", price: "Sur devis" },
    ],
  },
  {
    id: "ecrans",
    title: "Écrans TV",
    subtitle: "Toutes tailles",
    icon: Tv,
    items: [
      { name: 'Écran 32" (86 cm)', price: "90 €" },
      { name: 'Écran 40" (100 cm)', price: "130 €" },
      { name: 'Écran 49" (123 cm)', price: "150 €" },
      { name: 'Écran 55" (140 cm)', price: "180 €" },
      { name: 'Écran 65" (163 cm)', price: "200 €" },
      { name: 'Écran 75" (189 cm)', price: "270 €" },
      { name: 'Écran 80" (203 cm)', price: "300 €" },
      { name: "Autre taille", price: "Sur devis" },
    ],
  },
  {
    id: "cantines",
    title: "Cantines & Bagages",
    subtitle: "Sacs, valises, cantines",
    icon: Briefcase,
    items: [
      { name: "Petite Cantine", price: "180 €" },
      { name: "Moyenne Cantine", price: "100 €" },
      { name: "Grande Cantine", price: "100 €" },
      { name: "Très grande Cantine", price: "100 €" },
      { name: "Sac moyen", price: "60 €" },
      { name: "Grand Sac dounier lada", price: "70 €" },
      { name: "Très grand Sac", price: "100 €" },
      { name: "Petite Valise", price: "30 €" },
      { name: "Valise Moyenne", price: "50 €" },
      { name: "Grande Valise", price: "70 €" },
      { name: "Très grande Valise", price: "100 €" },
    ],
  },
  {
    id: "vehicules",
    title: "Véhicules",
    subtitle: "Voitures & utilitaires",
    icon: Car,
    items: [
      { name: "Petite Voiture Chargée", price: "1 500 €" },
      { name: "SUV 4×4 Chargé", price: "dès 2 000 €" },
      { name: "Autre véhicule", price: "Sur devis" },
      { name: "Tout autre article", price: "Sur devis" },
    ],
  },
];

export default function Tarifs() {
  return (
    <section id="tarifs" className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0E7A34] mb-4">
            Grille tarifaire
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tarifs clairs et transparents pour tous vos envois France → Burkina Faso.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className={`relative rounded-2xl p-7 border transition-all flex flex-col ${
                  cat.highlighted
                    ? "bg-[#0E7A34] text-white border-[#0E7A34] shadow-xl"
                    : "bg-white text-gray-900 border-gray-200 hover:border-[#0E7A34]/30 hover:shadow-lg"
                }`}
              >
                {cat.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Populaire
                  </div>
                )}

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                    cat.highlighted ? "bg-white/10" : "bg-[#0E7A34]/5"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      cat.highlighted ? "text-amber-400" : "text-[#0E7A34]"
                    }`}
                  />
                </div>

                <h3 className="text-xl font-bold mb-1">{cat.title}</h3>
                <p
                  className={`text-sm mb-5 ${
                    cat.highlighted ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {cat.subtitle}
                </p>

                <ul className="space-y-2.5 flex-1">
                  {cat.items.map((item) => (
                    <li
                      key={item.name}
                      className={`flex items-center justify-between gap-3 text-sm pb-2 border-b last:border-b-0 ${
                        cat.highlighted ? "border-white/10" : "border-gray-100"
                      }`}
                    >
                      <span
                        className={
                          cat.highlighted ? "text-white/90" : "text-gray-700"
                        }
                      >
                        {item.name}
                      </span>
                      <span
                        className={`font-bold whitespace-nowrap ${
                          item.price === "Sur devis"
                            ? cat.highlighted
                              ? "text-amber-300 italic font-semibold"
                              : "text-amber-600 italic font-semibold"
                            : cat.highlighted
                            ? "text-amber-400"
                            : "text-[#0E7A34]"
                        }`}
                      >
                        {item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-14">
          <p className="text-gray-600 mb-5">
            Pour toute demande spécifique ou article non listé :
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+33670699823"
              className="inline-flex items-center justify-center gap-2 bg-[#0E7A34] hover:bg-[#0B5C28] text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
            >
              🇫🇷 +33 670 699 823
            </a>
            <a
              href="tel:+22676601981"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
            >
              🇧🇫 +226 76 60 19 81
            </a>
            <Link
              href="/tracking"
              className="inline-flex items-center justify-center gap-2 border border-[#0E7A34]/20 hover:bg-[#0E7A34]/5 text-[#0E7A34] px-7 py-3.5 rounded-xl font-semibold transition-colors"
            >
              Suivre un colis
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
