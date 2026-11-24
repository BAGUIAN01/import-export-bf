import { cn } from "@/lib/utils";

/** Interrupteur tactile (52 × 32) avec son libellé et une aide facultative. */
export function Interrupteur({ libelle, aide, actif, onChange, disabled }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex min-w-0 flex-1 flex-col leading-snug">
        <span className="font-medium">{libelle}</span>
        {aide && <span className="text-[13px] text-ink-muted">{aide}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!!actif}
        aria-label={libelle}
        disabled={disabled}
        onClick={() => onChange(!actif)}
        className={cn(
          "flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-50",
          actif ? "justify-end bg-brand" : "justify-start bg-line-strong"
        )}
      >
        <span className="size-[26px] rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,20,.2)]" />
      </button>
    </div>
  );
}
