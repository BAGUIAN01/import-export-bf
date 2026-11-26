"use client"

import * as React from "react"
import { Check, ChevronDown, CircleCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { INDICATIFS } from "@/lib/data/indicatifs"
import {
  chiffres,
  formaterNational,
  lireTelephone,
  paysTelephone,
  telephoneValide,
  versInternational,
} from "@/lib/telephone"

/**
 * Téléphone avec choix du pays (France, Burkina Faso, Côte d'Ivoire…),
 * même allure que FloatingLabelInput.
 *
 * - `value` : numéro au format international (« +22670123456 ») ou vide.
 * - `onChange(e)` : `e.target.value` est le numéro international sans espaces.
 * - `defaultCountry` : pays proposé quand le champ est vide (« FR », « BF »…).
 *   Il suit la prop tant que rien n'est tapé (ex. pays de l'adresse).
 * - `onCountryChange(iso2)` : appelé quand on change de pays.
 */
const FloatingLabelPhoneInput = React.forwardRef(
  (
    { className, label, id, value, error, onChange, onBlur, onCountryChange, disabled, defaultCountry = "BF", ...props },
    ref
  ) => {
    const [etat, setEtat] = React.useState(() => lireTelephone(value, defaultCountry))
    const [ouvert, setOuvert] = React.useState(false)
    const [focus, setFocus] = React.useState(false)
    const inputRef = React.useRef(null)
    const dernierEmis = React.useRef(value ?? "")
    React.useImperativeHandle(ref, () => inputRef.current)

    // Valeur changée par le parent (préremplissage, remise à zéro…)
    React.useEffect(() => {
      const v = value ?? ""
      if (v !== dernierEmis.current) {
        dernierEmis.current = v
        setEtat((e) => lireTelephone(v, e.iso2))
      }
    }, [value])

    // Pays par défaut qui change (ex. pays de l'expéditeur) : suivi tant que le champ est vide
    React.useEffect(() => {
      setEtat((e) => (chiffres(e.national) || e.iso2 === defaultCountry ? e : { ...e, iso2: defaultCountry }))
    }, [defaultCountry])

    const pays = paysTelephone(etat.iso2)
    const international = versInternational(etat.national, etat.iso2)
    const valide = international !== "" && telephoneValide(international)

    function emettre(national, iso2, evenement) {
      const v = versInternational(national, iso2)
      dernierEmis.current = v
      onChange?.({ ...(evenement || {}), target: { ...(evenement?.target || {}), id, value: v } })
    }

    function saisir(e) {
      const brut = e.target.value
      // « +33… » tapé ou collé : le pays suit l'indicatif
      if (brut.trim().startsWith("+") || brut.trim().startsWith("00")) {
        const lu = lireTelephone(brut, etat.iso2)
        setEtat(lu)
        if (lu.iso2 !== etat.iso2) onCountryChange?.(lu.iso2)
        emettre(lu.national, lu.iso2, e)
        return
      }
      let d = chiffres(brut)
      // Effacement d'une espace : on efface le chiffre qui la précède
      if (d === chiffres(etat.national) && brut.length < etat.national.length) d = d.slice(0, -1)
      const national = formaterNational(d, etat.iso2)
      setEtat((s) => ({ ...s, national }))
      emettre(national, etat.iso2, e)
    }

    function choisirPays(iso2) {
      const national = formaterNational(etat.national, iso2)
      setEtat({ iso2, national })
      setOuvert(false)
      onCountryChange?.(iso2)
      emettre(national, iso2)
      setTimeout(() => inputRef.current?.focus(), 0)
    }

    const actif = focus || ouvert

    return (
      <div className="relative group">
        <div
          className={cn(
            "flex h-14 w-full rounded-md border-2 bg-transparent transition-all duration-300 ease-out",
            disabled && "cursor-not-allowed opacity-50",
            error
              ? "border-red-500"
              : actif
                ? "border-zinc-900 shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
                : "border-zinc-300"
          )}
        >
          <Popover open={ouvert} onOpenChange={setOuvert}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Pays du numéro : ${pays.name}. Changer`}
                className="flex shrink-0 items-center gap-1.5 rounded-l-md border-r border-zinc-200 pt-4 pb-1.5 pl-3 pr-2 text-zinc-700 focus-visible:outline-none focus-visible:bg-zinc-50"
              >
                <span className="text-lg leading-none" aria-hidden="true">{pays.flag}</span>
                <span className="text-sm font-medium tabular-nums">{pays.dial}</span>
                <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform", ouvert && "rotate-180")} aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher un pays" />
                <CommandList>
                  <CommandEmpty>Aucun pays</CommandEmpty>
                  <CommandGroup>
                    {INDICATIFS.map((c) => (
                      <CommandItem key={c.iso2} value={`${c.name} ${c.dial}`} onSelect={() => choisirPays(c.iso2)} className="min-h-11">
                        <Check className={cn("mr-2 h-4 w-4", c.iso2 === etat.iso2 ? "opacity-100" : "opacity-0")} />
                        <span className="mr-2 text-lg" aria-hidden="true">{c.flag}</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-sm text-zinc-500 tabular-nums">{c.dial}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <input
            id={id}
            ref={inputRef}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={etat.national}
            onChange={saisir}
            onFocus={() => setFocus(true)}
            onBlur={(e) => {
              setFocus(false)
              onBlur?.(e)
            }}
            disabled={disabled}
            placeholder={pays.sample}
            aria-invalid={error ? true : undefined}
            className={cn(
              "min-w-0 flex-1 bg-transparent pt-5 pb-2 pl-3 pr-10 text-base sm:text-sm text-zinc-900 outline-none",
              "placeholder:text-zinc-400 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
          {valide && (
            <CircleCheck className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" aria-label="Numéro valide" />
          )}
        </div>

        {/* Libellé toujours au-dessus : le pays occupe la gauche du champ */}
        <label
          htmlFor={id}
          className={cn(
            "absolute left-4 top-0 -translate-y-1/2 z-10 pointer-events-none bg-white px-1.5 text-xs font-semibold transition-colors",
            error ? "text-red-500" : actif ? "text-zinc-900" : "text-zinc-600"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)

FloatingLabelPhoneInput.displayName = "FloatingLabelPhoneInput"

export { FloatingLabelPhoneInput }
