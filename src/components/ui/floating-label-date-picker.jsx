"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FloatingLabelDatePicker = React.forwardRef(
  ({ className, label, id, value, error, onChange, disabled, showTime = false, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState(value ? new Date(value) : null);
    const [timeValue, setTimeValue] = React.useState(
      value && showTime ? new Date(value).toTimeString().slice(0, 5) : "00:00"
    );

    const hasValue = !!value && value.toString().length > 0;
    const isFloating = isFocused || hasValue || open;

    React.useEffect(() => {
      if (value && value.toString().length > 0) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
            if (showTime) {
              setTimeValue(date.toTimeString().slice(0, 5));
            }
          }
        } catch (e) {
          console.error("Invalid date value:", value);
        }
      } else {
        setSelectedDate(null);
        setTimeValue("00:00");
      }
    }, [value, showTime]);

    const handleDateSelect = (date) => {
      if (date) {
        const newDate = new Date(date);
        setSelectedDate(newDate);
        if (showTime) {
          // Combiner la date avec l'heure
          const [hours, minutes] = timeValue.split(":");
          newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
        }
        // Formater pour datetime-local (YYYY-MM-DDTHH:mm)
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        const hours = String(newDate.getHours()).padStart(2, '0');
        const minutes = String(newDate.getMinutes()).padStart(2, '0');
        
        const dateString = showTime 
          ? `${year}-${month}-${day}T${hours}:${minutes}` // Format datetime-local
          : `${year}-${month}-${day}`; // Format date
        onChange?.(dateString);
      } else {
        setSelectedDate(null);
        onChange?.("");
      }
    };

    const handleTimeChange = (e) => {
      const newTime = e.target.value;
      setTimeValue(newTime);
      if (selectedDate) {
        const newDate = new Date(selectedDate);
        const [hours, minutes] = newTime.split(":");
        newDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
        
        // Formater pour datetime-local
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}T${hours}:${minutes}`;
        onChange?.(dateString);
      }
    };

    const displayValue = selectedDate
      ? showTime
        ? format(selectedDate, "dd/MM/yyyy 'à' HH:mm")
        : format(selectedDate, "dd/MM/yyyy")
      : "";

    return (
      <div className="relative group">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              id={id}
              ref={ref}
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                "h-14 w-full rounded-md border-2 bg-transparent pt-5 pb-2 px-4 text-sm text-left",
                "transition-all duration-300 ease-out",
                "focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error
                  ? "border-red-500 dark:border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                  : "border-slate-300 dark:border-slate-700 focus-visible:border-black dark:focus-visible:border-white focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]",
                open && !error && "border-black dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.1)]",
                "text-black dark:text-white",
                !displayValue && "text-transparent",
                className
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("truncate", !displayValue && "opacity-0")}>
                  {displayValue || "Sélectionner une date"}
                </span>
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
              {showTime && (
                <div className="flex items-center gap-2 px-3 pb-3 border-t pt-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={timeValue}
                    onChange={handleTimeChange}
                    className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <label
          htmlFor={id}
          className={cn(
            "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-10",
            "text-slate-500 dark:text-slate-400",
            isFloating
              ? "top-0 -translate-y-1/2 text-xs font-semibold scale-100 bg-white dark:bg-black px-1.5"
              : "top-1/2 -translate-y-1/2 text-sm scale-100",
            isFocused && !error && "text-black dark:text-white",
            error && "text-red-500 dark:text-red-500"
          )}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400 px-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelDatePicker.displayName = "FloatingLabelDatePicker";

export { FloatingLabelDatePicker };

