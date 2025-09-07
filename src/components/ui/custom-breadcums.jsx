"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumbs
 * - items?: [{ label, href?, icon? }]
 * - base?: préfixe à ignorer dans l’URL (ex: "/dashboard")
 * - max?: nb max d’éléments avant collapse (…)
 * - mapping?: { segment: "Label lisible" }
 * - home?: { label, href, icon }
 * - className?: styles externes
 */
export default function Breadcrumbs({
  items,
  base = "",
  max = 4,
  mapping = {},
  home = { label: "Dashboard", href: "/dashboard", icon: Home },
  className,
}) {
  const pathname = usePathname();
  const autoItems = React.useMemo(() => {
    if (items?.length) return items;

    // Construire à partir du pathname
    let path = pathname || "/";
    if (base && path.startsWith(base)) path = path.slice(base.length) || "/";
    const segs = path.split("/").filter(Boolean);

    const acc = [];
    const built = segs.map((seg, i) => {
      const href = `${base}/${segs.slice(0, i + 1).join("/")}`.replace(/\/+/g, "/");
      const raw = decodeURIComponent(seg);
      const label =
        mapping[raw] ||
        raw
          .replace(/-/g, " ")
          .replace(/\b\w/g, (m) => m.toUpperCase());
      return { label, href };
    });

    if (home) acc.push({ label: home.label, href: home.href, icon: home.icon ?? Home });
    return [...acc, ...built];
  }, [items, pathname, base, mapping, home]);

  const collapsed = React.useMemo(() => {
    if (autoItems.length <= max) return autoItems;
    // Conserve: Home, …, avant-dernier, dernier
    const first = autoItems[0];
    const tail = autoItems.slice(-2);
    return [first, { label: "…" }, ...tail];
  }, [autoItems, max]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "w-full flex items-center gap-2 rounded-lg border bg-background px-3 py-2",
        "text-sm",
        className
      )}
    >
      <ul className="flex items-center flex-wrap gap-1">
        {collapsed.map((item, idx) => {
          const isLast = idx === collapsed.length - 1;
          const Icon = item.icon;

          const node =
            !item.href || isLast || item.label === "…" ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1 rounded-md",
                  item.label === "…"
                    ? "text-muted-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {item.label === "…" ? (
                  <MoreHorizontal className="h-4 w-4" />
                ) : Icon ? (
                  <>
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </>
                ) : (
                  <span className="font-medium">{item.label}</span>
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            );

          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {node}
              {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
