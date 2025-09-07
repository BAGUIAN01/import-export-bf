"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// ===== RÉSULTATS DE RECHERCHE =====
export const SearchResults = ({ results, onItemClick }) => {
  const router = useRouter();

  const handleResultClick = (item) => {
    if (item.url) {
      router.push(item.url);
      onItemClick?.();
    }
  };

  if (results.length === 0) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Résultats ({results.length})
        </span>
      </div>
      <div className="space-y-1">
        {results.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={`${item.title}-${index}`}
              variant="ghost"
              onClick={() => handleResultClick(item)}
              className="w-full justify-start h-auto p-2 font-normal"
            >
              <div className="flex items-start gap-2 w-full">
                <IconComponent className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm">{item.title}</span>
                  {item.breadcrumb.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {item.breadcrumb.slice(0, -1).join(' › ')}
                    </span>
                  )}
                  {item.description && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};