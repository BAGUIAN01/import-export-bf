"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

const FloatingLabelInput = React.forwardRef(
  ({ className, label, id, value, error, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [showPassword, setShowPassword] = React.useState(false)
    const inputRef = React.useRef(null)
    const hasValue = value && value.toString().length > 0
    const isFloating = isFocused || hasValue
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type

    // Combiner les refs
    React.useImperativeHandle(ref, () => inputRef.current)

    return (
      <div className="relative group">
        <div className="relative">
          <input
            id={id}
            ref={inputRef}
            type={inputType}
            value={value}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "peer h-14 w-full rounded-md border-2 bg-transparent pt-5 pb-2 text-sm",
              isPassword ? "px-4 pr-12" : "px-4",
              "transition-all duration-300 ease-out",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
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
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md",
                "text-zinc-500 hover:text-zinc-900",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
              )}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 pointer-events-none transition-all duration-300 ease-out origin-left z-10",
              "text-zinc-600",
              isFloating
                ? "top-0 -translate-y-1/2 text-xs font-semibold scale-100 bg-white px-1.5"
                : "top-1/2 -translate-y-1/2 text-sm scale-100",
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
FloatingLabelInput.displayName = "FloatingLabelInput"

export { FloatingLabelInput }

