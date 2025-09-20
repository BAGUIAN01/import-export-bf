import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";
import { formatPhoneNumber, getPhonePlaceholder } from "@/lib/utils/phone-formatter-utils";

export function PhoneInput({ 
  id,
  label,
  value, 
  onChange, 
  country, 
  error,
  required = false,
  ...props 
}) {
  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    const formattedValue = formatPhoneNumber(inputValue, country);
    onChange(formattedValue);
  };

  const placeholder = getPhonePlaceholder(country);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium flex items-center gap-2">
        <Phone className="h-3 w-3" />
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type="tel"
        value={value}
        onChange={handlePhoneChange}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        placeholder={placeholder}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}