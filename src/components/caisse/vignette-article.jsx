/* eslint-disable @next/next/no-img-element -- photos servies par l'API, déjà réduites */
import { iconeDe } from "@/lib/caisse/icones";
import { vignetteParCode } from "@/lib/caisse/familles";
import { cn } from "@/lib/utils";

/**
 * Image d'un article : sa photo, sinon son dessin sur la teinte de la famille.
 * `article` (catalogue) ou `vignette` ({ icone, teinte, image } gardée sur la
 * ligne du ticket) ; `code` sert de repli pour une ligne ancienne.
 */
export function VignetteArticle({ article, vignette, code, taille = "size-12", icone = "size-6", className }) {
  const v = article ? { icone: article.icone, teinte: article.teinte, image: article.image } : vignette || vignetteParCode(code);
  if (v.image) {
    return <img src={v.image} alt="" aria-hidden="true" className={cn("shrink-0 rounded-xl object-cover", taille, className)} />;
  }
  const Icone = iconeDe(v.icone);
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-xl", taille, className)} style={{ background: v.teinte.fond, color: v.teinte.trait }}>
      <Icone className={icone} strokeWidth={1.7} />
    </span>
  );
}
