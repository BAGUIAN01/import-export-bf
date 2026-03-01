"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function DatePicker({ value, onChange, label, error, disabled, id }) {
  const [open, setOpen] = React.useState(false)

  const date = value ? new Date(value) : undefined

  const handleSelect = (selectedDate) => {
    if (selectedDate) {
      const formatted = format(selectedDate, "yyyy-MM-dd")
      onChange(formatted)
    }
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onChange("")
  }

  const handleToday = () => {
    const today = new Date()
    const formatted = format(today, "yyyy-MM-dd")
    onChange(formatted)
    setOpen(false)
  }

  const hasValue = !!date
  const isFloating = open || hasValue

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "relative h-14 w-full rounded-md border-2 bg-white dark:bg-zinc-950 px-4 text-sm text-left",
            "transition-all duration-300 ease-out",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-red-500 dark:border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
              : "border-zinc-300 dark:border-zinc-700 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]",
            open && !error && "border-zinc-900 dark:border-zinc-100 shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]"
          )}
        >
          <span className={cn(
            "flex items-center gap-2 w-full relative z-10",
            hasValue ? "pt-3" : "pt-0"
          )}>
            <CalendarIcon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {hasValue ? (
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex-1">{format(date, "dd MMMM yyyy", { locale: fr })}</span>
            ) : (
              <span className="text-transparent text-sm">.</span>
            )}
          </span>

          {/* Floating label */}
          <span
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-20",
              "text-slate-500 dark:text-slate-400",
              isFloating
                ? "top-0 -translate-y-1/2 text-xs font-semibold bg-white dark:bg-black px-1.5"
                : "top-1/2 -translate-y-1/2 text-sm pl-6",
              open && !error && "text-black dark:text-white",
              error && "text-red-500 dark:text-red-500"
            )}
          >
            {label}
          </span>

          {/* Clear button */}
          {hasValue && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              onKeyDown={(e) => { if (e.key === "Enter") handleClear(e) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date || new Date()}
          locale={fr}
          captionLayout="dropdown"
          fromYear={1920}
          toYear={new Date().getFullYear()}
          formatters={{
            formatMonthDropdown: (d) =>
              d.toLocaleString("fr-FR", { month: "long" }),
          }}
        />
        <div className="px-3 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleToday}
          >
            Aujourd&apos;hui
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
