import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function normalizeDateInput(value){
  if (!value) return "";

  // string
  if (typeof value === "string") {
    // "2025-09-01" ou "2025-09-01T12:00:00Z"
    return value.includes("T") ? value.split("T")[0] : value;
  }

  // Firestore Timestamp (v9): a souvent .toDate()
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      return value.toDate().toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  // Firestore Timestamp (seconds/nanoseconds)
  if (value && typeof value === "object" && "seconds" in value) {
    try {
      const ms = (value.seconds ) * 1000 + Math.floor((value.nanoseconds || 0) / 1e6);
      return new Date(ms).toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  // number (epoch ms) ou objet convertible
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch {}

  return "";
}
