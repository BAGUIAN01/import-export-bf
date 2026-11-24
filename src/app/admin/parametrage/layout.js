"use client";

import { Building2, ShieldCheck, Users } from "lucide-react";
import { FournisseursModule } from "@/components/gestion/layout-module";
import { BarreModule, CoquilleModule } from "@/components/gestion/barre-module";
import { OngletsBas } from "@/components/gestion/onglets-bas";

const ONGLETS = [
  { href: "/admin/parametrage/utilisateurs", libelle: "Utilisateurs", icone: Users },
  { href: "/admin/parametrage/profils", libelle: "Profils et droits", icone: ShieldCheck },
  { href: "/admin/parametrage/agences", libelle: "Agences et devises", icone: Building2 },
];

/** Paramétrage (administrateur) : utilisateurs, profils et droits, agences et devises. */
export default function ParametrageLayout({ children }) {
  return (
    <FournisseursModule>
      <CoquilleModule barre={<BarreModule titre="Paramétrage" onglets={ONGLETS} />} bas={<OngletsBas onglets={ONGLETS} />}>
        {children}
      </CoquilleModule>
    </FournisseursModule>
  );
}
