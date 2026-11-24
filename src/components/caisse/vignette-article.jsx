import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ARTICLES, TEINTES } from "@/lib/caisse/familles";

/** Image d'un article : dessin de la famille sur fond teinté. */
export function VignetteArticle({ article, code, taille = "size-12", icone = "size-6", className }) {
  const a = article || ARTICLES.find((x) => x.code === code);
  const Icone = a?.icone || Package;
  const teinte = a?.teinte || TEINTES.gris;
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-xl", taille, className)}
      style={{ background: teinte.fond, color: teinte.trait }}
    >
      <Icone className={icone} strokeWidth={1.7} />
    </span>
  );
}
