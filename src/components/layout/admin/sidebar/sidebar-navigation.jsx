// components/layout/sidebar-navigation.jsx
"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navigationData } from "@/lib/data/sidebar";
import { useRBAC } from "@/hooks/use-rbac";
import { filterNavByRole, canAccess as checkAccess } from "@/lib/rbac";
import { useLayout } from "../layout-provider";
import { SidebarSearch } from "./sidebar-search";
import { SearchResults } from "./search-results";
import { SidebarNavItem } from "./sidebar-nav-item";

// --- utils recherche ---
function normalize(q) {
  return q.toLowerCase().trim();
}

function searchInNavigation(items, query) {
  const q = normalize(query);
  if (!q) return [];
  const results = [];

  const walk = (item, ancestors) => {
    const textMatch =
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));

    if (textMatch) {
      results.push({
        ...item,
        breadcrumb: [...ancestors, item.title],
        parentPath: ancestors,
      });
    }

    if (item.items && item.items.length) {
      for (const child of item.items) {
        walk(child, [...ancestors, item.title]);
      }
    }
  };

  for (const it of items) walk(it, []);
  return results;
}

export const SidebarNavigation = () => {
  const { sidebarMobileOpen, setSidebarMobileOpen } = useLayout();
  const { role } = useRBAC();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const handleItemClick = () => setSidebarMobileOpen(false);
  const handleClearSearch = () => setSearchQuery("");

  const filteredNavigation = useMemo(() => {
    if (!role) return [];
    return filterNavByRole(navigationData.navMain, role, { hideUnknown: true });
  }, [role]);

  // Utilise checkAccess (fonction pure importée) pour éviter la recréation à chaque render
  const searchResults = useMemo(() => {
    const q = normalize(deferredQuery);
    if (!q || !filteredNavigation.length) return [];
    const base = searchInNavigation(filteredNavigation, q);
    return base.filter((hit) => (hit.url ? checkAccess(role, hit.url) : true));
  }, [deferredQuery, filteredNavigation, role]);

  const isSearching = normalize(deferredQuery).length > 0;

  return (
    // TooltipProvider au niveau parent pour tous les items du sidebar
    <TooltipProvider>
      <SidebarSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClearSearch={handleClearSearch}
      />

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {isSearching ? (
            <SearchResults
              results={searchResults}
              onItemClick={handleItemClick}
            />
          ) : (
            <div className="px-3 py-2">
              <nav className="grid gap-1">
                {filteredNavigation.map((item) => {
                  // Pour Hub (/admin), on vérifie l'égalité exacte
                  // Pour les autres, on utilise includes pour les sous-routes
                  const isActive = item.url === "/admin" 
                    ? pathname === "/admin" 
                    : pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url + "/"));
                  return (
                    <SidebarNavItem
                      key={item.url || item.title}
                      item={item}
                      isActive={isActive}
                      onClick={handleItemClick}
                      searchQuery={searchQuery}
                    />
                  );
                })}
              </nav>

              {filteredNavigation.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Aucun élément de navigation disponible pour votre rôle.
                </div>
              )}

              <div className="h-4" />
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};
