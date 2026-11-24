"use client";

import { FournisseursModule } from "@/components/gestion/layout-module";
import { RetraitsProvider } from "@/contexts/retraits-context";
import { BarreRetraits } from "@/components/retraits/barre-retraits";

/**
 * Retraits à l'arrivée, comme une caisse : barre de 72 px avec les étapes
 * Destinataire · Colis · Paiement, puis l'écran de l'étape.
 */
export default function RetraitsLayout({ children }) {
  return (
    <FournisseursModule>
      <RetraitsProvider>
        <div className="caisse flex h-[100dvh] flex-col overflow-hidden bg-surface-page font-caisse text-[15px] text-ink antialiased" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <BarreRetraits />
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </RetraitsProvider>
    </FournisseursModule>
  );
}
