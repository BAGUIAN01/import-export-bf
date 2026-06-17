"use client";
import Hero from "@/components/modules/home/hero";
import Tarifs from "@/components/modules/home/services";
import Mediatheque from "@/components/modules/home/phototeque";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Tarifs />
      <Mediatheque />
    </main>
  );
}
