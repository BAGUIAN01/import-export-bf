import { useId } from "react";
import { cn } from "@/lib/utils";

/** Champ de saisie de la caisse : libellé au-dessus, 52 px de haut, texte 16 px (pas de zoom iOS). */
export function Champ({ libelle, erreur, aide, className, requis, ...props }) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-muted">
        {libelle}
        {requis && <span className="text-danger"> *</span>}
      </label>
      <input
        id={id}
        required={requis}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur || aide ? `${id}-aide` : undefined}
        className={cn(
          "h-[52px] w-full rounded-xl border bg-white px-3.5 text-base text-ink outline-none",
          "placeholder:text-ink-subtle/70 focus:border-brand focus:ring-2 focus:ring-brand/20",
          erreur ? "border-danger" : "border-line-strong"
        )}
        {...props}
      />
      {(erreur || aide) && (
        <span id={`${id}-aide`} className={cn("text-[13px]", erreur ? "text-danger" : "text-ink-subtle")}>
          {erreur || aide}
        </span>
      )}
    </div>
  );
}
