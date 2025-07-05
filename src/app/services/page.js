// app/services/page.tsx

import Hero from '@/src/components/modules/services/hero';
import ServicesList from '@/src/components/modules/services/services-list';
import FAQ from '@/src/components/modules/services/faq';
// import CallToAction from '@/components/modules/services/call-to-action';

export const metadata = {
  title: 'Services - IE BF | Envoi de Colis France-Burkina Faso',
  description: 'Découvrez nos services d\'envoi de colis vers le Burkina Faso : colis standard, barrique, ramassage à domicile. Tarifs transparents depuis 8 ans.',
  keywords: 'envoi colis, Burkina Faso, France, transport, ramassage, barrique',
  openGraph: {
    title: 'Services d\'Envoi de Colis - IE BF',
    description: 'Envoyez vos colis vers le Burkina Faso en toute sécurité. Service familial depuis 8 ans.',
    type: 'website',
  }
};

export default function ServicesPage() {
  return (
    <main className="overflow-hidden">
      <Hero />
      <ServicesList />
      <FAQ />
 
    </main>
  );
}