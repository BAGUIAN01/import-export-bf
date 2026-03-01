"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FloatingLabelInput } from "@/components/ui/floating-label-input"

function DateTimePicker({ value, onChange, label, error, disabled, id, required }) {
  const [open, setOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState("")

  // Parse value: format "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm" or Date object
  const dateTime = React.useMemo(() => {
    if (!value) return null
    try {
      if (typeof value === "string") {
        // Handle "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm"
        const normalized = value.replace(" ", "T")
        return new Date(normalized)
      }
      return new Date(value)
    } catch {
      return null
    }
  }, [value])

  React.useEffect(() => {
    if (dateTime && !isNaN(dateTime.getTime())) {
      const hours = String(dateTime.getHours()).padStart(2, "0")
      const minutes = String(dateTime.getMinutes()).padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
    } else {
      setTimeValue("")
    }
  }, [dateTime])

  const handleDateSelect = (selectedDate) => {
    if (selectedDate) {
      const currentTime = timeValue || "00:00"
      const [hours, minutes] = currentTime.split(":")
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
      const formatted = format(newDate, "yyyy-MM-dd'T'HH:mm")
      onChange(formatted)
    }
    setOpen(false)
  }

  const handleTimeChange = (e) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    
    if (dateTime && !isNaN(dateTime.getTime()) && newTime) {
      const [hours, minutes] = newTime.split(":")
      const newDate = new Date(dateTime)
      newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
      const formatted = format(newDate, "yyyy-MM-dd'T'HH:mm")
      onChange(formatted)
    } else if (!dateTime && newTime) {
      // Si pas de date mais une heure, utiliser aujourd'hui
      const today = new Date()
      const [hours, minutes] = newTime.split(":")
      today.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0)
      const formatted = format(today, "yyyy-MM-dd'T'HH:mm")
      onChange(formatted)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setTimeValue("")
    onChange("")
  }

  const handleNow = () => {
    const now = new Date()
    const formatted = format(now, "yyyy-MM-dd'T'HH:mm")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    setTimeValue(`${hours}:${minutes}`)
    onChange(formatted)
    setOpen(false)
  }

  const hasValue = !!dateTime && !isNaN(dateTime.getTime())
  const isFloating = open || hasValue

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "relative h-14 w-full rounded-md border-2 bg-transparent px-4 text-sm text-left",
              "transition-all duration-300 ease-out",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-red-500 dark:border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-slate-300 dark:border-slate-700 focus-visible:border-black dark:focus-visible:border-white focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]",
              open && !error && "border-black dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]",
              "text-black dark:text-white"
            )}
          >
            <span className={cn(
              "flex items-center gap-2",
              hasValue ? "pt-3" : "pt-0"
            )}>
              <CalendarIcon className="h-4 w-4 shrink-0 text-slate-500" />
              {hasValue ? (
                <span className="text-sm">
                  {format(dateTime, "dd MMMM yyyy à HH:mm", { locale: fr })}
                </span>
              ) : (
                <span className="text-transparent text-sm">.</span>
              )}
            </span>

            {/* Floating label */}
            <span
              className={cn(
                "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-10",
                "text-slate-500 dark:text-slate-400",
                isFloating
                  ? "top-0 -translate-y-1/2 text-xs font-semibold bg-white dark:bg-black px-1.5"
                  : "top-1/2 -translate-y-1/2 text-sm pl-6",
                open && !error && "text-black dark:text-white",
                error && "text-red-500 dark:text-red-500"
              )}
            >
              {label} {required && <span className="text-red-500">*</span>}
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
            selected={dateTime}
            onSelect={handleDateSelect}
            defaultMonth={dateTime || new Date()}
            locale={fr}
            captionLayout="dropdown"
            fromYear={1920}
            toYear={new Date().getFullYear() + 1}
            formatters={{
              formatMonthDropdown: (d) =>
                d.toLocaleString("fr-FR", { month: "long" }),
            }}
          />
          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <input
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleNow}
            >
              Maintenant
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}

export { DateTimePicker }

