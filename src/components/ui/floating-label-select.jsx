"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SelectContent } from "@/components/ui/select"

const FloatingLabelSelect = React.forwardRef(
  ({ className, label, id, value, error, children, onValueChange, disabled, placeholder, required, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    const hasValue = Boolean(value) && value !== "select" && value !== "none"
    const isFloating = isOpen || hasValue

    return (
      <div className="relative group">
        <div className="relative">
          <SelectPrimitive.Root
            value={value}
            onValueChange={onValueChange}
            disabled={disabled}
            onOpenChange={setIsOpen}
            {...props}
          >
            {/* Trigger direct Radix — aucun style shadcn qui écrase */}
            <SelectPrimitive.Trigger
              id={id}
              ref={ref}
              className={cn(
                // Identique à FloatingLabelInput
                "h-14 w-full rounded-md border-2 bg-transparent pt-5 pb-2 px-4 pr-10 text-sm",
                "flex items-end text-left",
                "transition-all duration-300 ease-out",
                "outline-none focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                // Bordures
                error
                  ? "border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                  : "border-zinc-300 focus-visible:border-zinc-900 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]",
                isOpen && !error && "border-zinc-900 shadow-[0_0_0_3px_rgba(0,0,0,0.05)]",
                className
              )}
            >
              <SelectPrimitive.Value
                placeholder={isFloating ? (placeholder || " ") : ""}
                className="text-zinc-900 font-medium flex-1 text-left leading-none"
              />
            </SelectPrimitive.Trigger>

            <SelectContent position="popper">
              {children}
            </SelectContent>
          </SelectPrimitive.Root>

          {/* Chevron animée */}
          <div
            aria-hidden
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-20",
              "transition-all duration-200",
              isOpen && "rotate-180",
              error ? "text-red-500" : isOpen ? "text-zinc-900" : "text-zinc-500"
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </div>

          {/* Label flottant — animation identique à FloatingLabelInput */}
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-10",
              isFloating
                ? "top-0 -translate-y-1/2 text-xs font-semibold bg-white px-1.5"
                : "top-1/2 -translate-y-1/2 text-sm",
              error
                ? "text-red-500"
                : isOpen
                  ? "text-zinc-900"
                  : "text-zinc-500"
            )}
          >
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="mt-1 text-xs text-red-500 px-1 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  }
)
FloatingLabelSelect.displayName = "FloatingLabelSelect"

export { FloatingLabelSelect }
