import Hero from "@/components/modules/home/hero";
import Tarifs from "@/components/modules/home/services";
import Mediatheque from "@/components/modules/home/phototeque";
import { getPublicPricing } from "@/lib/pricing-public";

// La grille est régénérée à chaque modification dans Gestion → Tarifs
// (revalidatePath("/")), et au plus tard toutes les heures.
export const revalidate = 3600;

export default async function HomePage() {
  const pricing = await getPublicPricing();
  return (
    <main>
      <Hero />
      <Tarifs pricing={pricing} />
      <Mediatheque />
    </main>
  );
}
