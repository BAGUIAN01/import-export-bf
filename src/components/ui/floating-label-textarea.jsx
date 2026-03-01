"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const FloatingLabelTextarea = React.forwardRef(
  ({ className, label, id, value, error, rows = 4, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const textareaRef = React.useRef(null)
    const hasValue = value && value.toString().length > 0
    const isFloating = isFocused || hasValue

    // Combiner les refs
    React.useImperativeHandle(ref, () => textareaRef.current)

    return (
      <div className="relative group">
        <div className="relative">
          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            rows={rows}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "peer w-full rounded-md border-2 bg-transparent pt-5 pb-2 px-4 text-sm",
              "transition-all duration-300 ease-out",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "resize-none",
              // Border colors and focus effects
              error
                ? "border-red-500 focus-visible:border-red-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                : "border-zinc-300 focus-visible:border-zinc-900 focus-visible:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]",
              // Text colors
              "text-zinc-900 placeholder-transparent",
              className
            )}
            placeholder=" "
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-10",
              "text-zinc-600",
              isFloating
                ? "top-0 -translate-y-1/2 text-xs font-semibold scale-100 bg-white px-1.5"
                : "top-3 text-sm scale-100",
              // Focus state with smooth color transition
              isFocused && !error && "text-zinc-900",
              error && "text-red-500"
            )}
          >
            {label}
          </label>
        </div>
      </div>
    )
  }
)
FloatingLabelTextarea.displayName = "FloatingLabelTextarea"

export { FloatingLabelTextarea }

