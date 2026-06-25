"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative bg-[#0E7A34] text-white pt-10 pb-20 sm:pt-16 sm:pb-28">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-8 text-sm font-medium text-white/90">
          Transport France → Burkina Faso
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Envoyez vos colis<br />
          <span className="text-amber-400">en toute sécurité</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Collecte partout en France, livraison partout au Burkina Faso.
          Service fiable depuis 8 ans.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="#tarifs"
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
          >
            Voir les tarifs
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/tracking"
            className="inline-flex items-center justify-center gap-2 border border-white/25 hover:bg-white/10 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors"
          >
            Suivre mon colis
          </Link>
        </div>
      </div>
    </section>
  );
}
