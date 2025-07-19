
"use client";
import Hero from "@/src/components/modules/home/hero";
import Services from "@/src/components/modules/home/services";
import Stats from "@/src/components/modules/home/stats";
import About from "@/src/components/modules/home/about";
import Testimonials from "@/src/components/modules/home/testimonials";
import CTA from "@/src/components/modules/home/cta";
import ContactSection from "@/src/components/modules/home/contact-section";
import Phototeque from "../components/modules/home/phototeque";

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <Hero />
      <Stats />
      <Services />
      <About />
      <Testimonials />
      <CTA />
      <Phototeque />
      <ContactSection />

    </main>
  );
}