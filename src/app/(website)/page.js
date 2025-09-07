
"use client";
import Hero from "@/components/modules/home/hero";
import Services from "@/components/modules/home/services";
import Stats from "@/components/modules/home/stats";
import About from "@/components/modules/home/about";
import Testimonials from "@/components/modules/home/testimonials";
import CTA from "@/components/modules/home/cta";
import ContactSection from "@/components/modules/home/contact-section";
import Phototeque from "../../components/modules/home/phototeque";

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