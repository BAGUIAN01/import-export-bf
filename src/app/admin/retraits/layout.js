"use client";

import { FournisseursModule } from "@/components/gestion/layout-module";

/** Retraits à l'arrivée : écran plein, tablette d'abord (barre posée par la page). */
export default function RetraitsLayout({ children }) {
  return <FournisseursModule>{children}</FournisseursModule>;
}
