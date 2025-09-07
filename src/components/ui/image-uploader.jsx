
"use client";
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";

export function ImageUploader({ value, onChange, label="Importer photo", className="" }) {
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // pré-aperçu immédiat
    const localPreview = URL.createObjectURL(f);
    onChange?.({ file: f, url: localPreview, isLocal: true });
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-16 w-16 rounded-lg overflow-hidden border bg-muted">
        {value?.url ? (
          <img src={value.url} alt="photo" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
            Pas d’image
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={pick}>{label}</Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>
    </div>
  );
}
