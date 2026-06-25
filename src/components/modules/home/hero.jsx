"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Cartes "à jouer" : images éventaillées (pivot en bas, comme une main de cartes)
const cards = [
  { src: "/images/image1.jpg", alt: "Colis prêt à l'envoi", rot: -18 },
  { src: "/images/image2.jpg", alt: "Chargement du conteneur", rot: -6 },
  { src: "/images/image3.jpg", alt: "Transport vers le Burkina Faso", rot: 6 },
  { src: "/images/image4.jpg", alt: "Livraison au Burkina Faso", rot: 18 },
];

export default function Hero() {
  // Défilement auto : la carte "active" se relève et passe devant, en boucle
  const [active, setActive] = useState(cards.length - 1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % cards.length),
      2600
    );
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section className="relative bg-white text-gray-900 overflow-hidden border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">

          {/* ── Texte (gauche) ── */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-[#0E7A34]">
              Transport France → Burkina Faso
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.18] mb-6">
              Envoyez vos{" "}
              <span className="relative inline-block text-[#0E7A34]">
                colis
                <svg
                  className="absolute left-0 -bottom-1 w-full"
                  height="10"
                  viewBox="0 0 200 10"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7 C 55 1, 150 1, 197 6"
                    stroke="#E0A500"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              en toute <span className="text-amber-500">sécurité</span>
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

          {/* ── Cartes à jouer (droite) — défilement auto ── */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="relative h-[380px] sm:h-[480px] lg:h-[540px] w-full max-w-sm sm:max-w-md lg:max-w-lg"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {cards.map((card, i) => {
                const isActive = active === i;
                return (
                  <div
                    key={card.src}
                    onMouseEnter={() => setActive(i)}
                    className="absolute left-1/2 bottom-4 w-48 sm:w-60 lg:w-72 aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white shadow-xl ring-1 ring-gray-200 transition-all duration-500 ease-out cursor-pointer select-none"
                    style={{
                      transform: `translateX(-50%) rotate(${
                        isActive ? 0 : card.rot
                      }deg) translateY(${isActive ? -28 : 0}px) scale(${
                        isActive ? 1.06 : 1
                      })`,
                      transformOrigin: "bottom center",
                      zIndex: isActive ? 30 : 10 + i,
                    }}
                  >
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      sizes="(max-width: 640px) 12rem, (max-width: 1024px) 15rem, 18rem"
                      className="object-cover"
                      priority={i === cards.length - 1}
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
