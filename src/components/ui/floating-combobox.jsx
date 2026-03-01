"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Combobox avec floating label, sélection depuis une liste OU saisie libre.
 *
 * Props:
 * - options: [{ value: string, label: string }]
 * - value: string (la valeur sélectionnée - ID ou texte libre)
 * - onValueChange: (value: string, isCustom: boolean) => void
 * - label, id, error, disabled
 */
function FloatingCombobox({
  options = [],
  value,
  onValueChange,
  label,
  id,
  error,
  disabled,
  placeholder = "Rechercher...",
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Trouver le label affiché : soit le label de l'option, soit la valeur brute (saisie libre)
  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption?.label || value || ""

  const hasValue = !!value
  const isFloating = true // Always show label above

  const handleSelect = (optionValue) => {
    onValueChange(optionValue, false)
    setSearch("")
    setOpen(false)
  }

  const handleUseCustom = () => {
    if (search.trim()) {
      onValueChange(search.trim(), true)
      setSearch("")
      setOpen(false)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onValueChange("", false)
    setSearch("")
  }

  // Filtrer : cmdk gère le filtre automatiquement, mais on veut aussi proposer la saisie libre
  const searchTrimmed = search.trim()
  const exactMatch = options.some(
    (o) => o.label.toLowerCase() === searchTrimmed.toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "relative h-14 w-full rounded-md border-2 bg-transparent pt-5 pb-2 px-4 pr-10 text-sm text-left",
            "transition-all duration-300 ease-out",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
              : "border-zinc-300 focus-visible:border-zinc-900 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]",
            open && !error && "border-zinc-900 shadow-[0_0_0_3px_rgba(0,0,0,0.05)]",
            "text-zinc-900"
          )}
        >
          <span className={cn(
            "block truncate leading-[1.5rem]",
            hasValue ? "text-zinc-900" : "text-zinc-400"
          )}>
            {displayLabel || placeholder || "\u00A0"}
          </span>

          {/* Floating label */}
          <span
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-10",
              isFloating
                ? "top-0 -translate-y-1/2 text-xs font-semibold bg-white px-1.5"
                : "top-1/2 -translate-y-1/2 text-sm",
              error
                ? "text-red-500"
                : open
                  ? "text-zinc-900"
                  : "text-zinc-600"
            )}
          >
            {label}
          </span>

          {/* Chevron */}
          <svg
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-transform duration-200 pointer-events-none",
              open && "rotate-180",
              error ? "text-red-500" : open ? "text-zinc-900" : "text-zinc-500"
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-2">
              {searchTrimmed ? (
                <button
                  type="button"
                  onClick={handleUseCustom}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent rounded-sm"
                >
                  Utiliser &quot;{searchTrimmed}&quot;
                </button>
              ) : (
                <span className="text-muted-foreground text-sm">Aucun résultat</span>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Option saisie libre si le texte ne correspond pas exactement */}
            {searchTrimmed && !exactMatch && (
              <CommandGroup>
                <CommandItem
                  value={`__custom__${searchTrimmed}`}
                  onSelect={handleUseCustom}
                  className="text-muted-foreground"
                >
                  <span className="mr-2 text-xs">+</span>
                  Utiliser &quot;{searchTrimmed}&quot;
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { FloatingCombobox }
