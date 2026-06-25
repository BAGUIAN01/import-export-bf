"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Cartes "à jouer" : images éventaillées (pivot en bas, comme une main de cartes)
const cards = [
  { src: "/images/image1.jpg", alt: "Colis prêt à l'envoi", rot: -18, z: 10 },
  { src: "/images/image2.jpg", alt: "Chargement du conteneur", rot: -6, z: 20 },
  { src: "/images/image3.jpg", alt: "Transport vers le Burkina Faso", rot: 6, z: 30 },
  { src: "/images/image4.jpg", alt: "Livraison au Burkina Faso", rot: 18, z: 40 },
];

export default function Hero() {
  return (
    <section className="relative bg-white text-gray-900 overflow-hidden border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">

          {/* ── Texte (gauche) ── */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-[#0E7A34]">
              Transport France → Burkina Faso
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Envoyez vos colis<br />
              <span className="text-[#0E7A34]">en toute sécurité</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
              Collecte partout en France, livraison partout au Burkina Faso.
              Service fiable depuis 8 ans.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="#tarifs"
                className="inline-flex items-center justify-center gap-2 bg-[#0E7A34] hover:bg-[#0B5C28] text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
              >
                Voir les tarifs
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tracking"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-800 px-7 py-3.5 rounded-xl font-semibold transition-colors"
              >
                Suivre mon colis
              </Link>
            </div>
          </div>

          {/* ── Cartes à jouer (droite) ── */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative h-[360px] sm:h-[440px] w-full max-w-md">
              {cards.map((card) => (
                <div
                  key={card.src}
                  className="group absolute left-1/2 bottom-4 w-40 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-1 ring-gray-200 transition-transform duration-300 ease-out hover:-translate-y-6 hover:!z-50 hover:!rotate-0"
                  style={{
                    transform: `translateX(-50%) rotate(${card.rot}deg)`,
                    transformOrigin: "bottom center",
                    zIndex: card.z,
                  }}
                >
                  <Image
                    src={card.src}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 640px) 10rem, 13rem"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
