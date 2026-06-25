"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationData } from "@/lib/data/sidebar";
import { useRBAC } from "@/hooks/use-rbac";
import { filterNavByRole } from "@/lib/rbac";
import { useLayout } from "./layout-provider";

/**
 * Bottom navbar mobile (style application) pour la partie gestion (/admin).
 * Affiche les principaux accès filtrés par rôle + un bouton "Menu" qui ouvre
 * la sidebar complète (MobileSidebar). Masquée à partir de `md`.
 */
export function AdminBottomNav() {
  const pathname = usePathname();
  const { role } = useRBAC();
  const { setSidebarMobileOpen } = useLayout();

  // Items principaux : filtrés par rôle, dédupliqués par URL, limités à 4 onglets
  const items = React.useMemo(() => {
    if (!role) return [];
    const filtered = filterNavByRole(navigationData.navMain, role, { hideUnknown: true });
    const seen = new Set();
    const unique = [];
    for (const it of filtered) {
      if (!it.url || seen.has(it.url)) continue;
      seen.add(it.url);
      unique.push(it);
    }
    return unique.slice(0, 4);
  }, [role]);

  const isActive = (url) =>
    url === "/admin"
      ? pathname === "/admin"
      : pathname === url || pathname.startsWith(url + "/");

  return (
    <nav
      className="md:hidden shrink-0 border-t bg-background z-40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation gestion"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.url);
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2 px-0.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              <span className="text-[10px] font-medium leading-none truncate max-w-full">
                {item.title}
              </span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}

        {/* Bouton Menu : ouvre la sidebar complète */}
        <button
          onClick={() => setSidebarMobileOpen(true)}
          aria-label="Ouvrir le menu complet"
          className="flex flex-col items-center justify-center gap-1 py-2 px-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}

export default AdminBottomNav;
