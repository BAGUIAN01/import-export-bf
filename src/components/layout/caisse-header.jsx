"use client";

import { useEffect, useState } from "react";
import { Container as ContainerIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCaisse } from "@/contexts/caisse-context";

/**
 * Header de la caisse — barre fine en haut du contenu, visible à toutes les
 * étapes. Permet de choisir le conteneur de destination des colis (utilisé
 * lors de la création de l'expédition sur la page Impression).
 */
export function CaisseHeader() {
  const { selectedContainer, setSelectedContainer } = useCaisse();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/containers?limit=50&sort=createdAt&order=desc")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const list = d.containers || [];
        setContainers(list);
        // Pré-sélection : conteneur le plus récent si aucun choisi
        if (!selectedContainer && list.length) {
          setSelectedContainer(list[0]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (id) => {
    const c = containers.find((x) => x.id === id);
    if (c) setSelectedContainer(c);
  };

  return (
    <header className="sticky top-0 z-30 h-12 shrink-0 flex items-center gap-2 bg-white/95 backdrop-blur border-b border-zinc-200 px-3 sm:px-4">
      <ContainerIcon className="h-4 w-4 text-orange-600 shrink-0" />
      <span className="text-xs font-medium text-zinc-500 hidden sm:inline">
        Conteneur de destination
      </span>

      <div className="ml-auto">
        <Select
          value={selectedContainer?.id || ""}
          onValueChange={handleChange}
          disabled={loading || containers.length === 0}
        >
          <SelectTrigger className="h-9 w-[190px] sm:w-[260px]">
            <SelectValue
              placeholder={
                loading
                  ? "Chargement…"
                  : containers.length === 0
                  ? "Aucun conteneur"
                  : "Choisir un conteneur"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {containers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.containerNumber}
                {c.name ? ` — ${c.name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}

export default CaisseHeader;
