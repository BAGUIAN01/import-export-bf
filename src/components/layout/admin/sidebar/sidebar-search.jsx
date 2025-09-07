"use client";

import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLayout } from '../layout-provider';

// ===== SIDEBAR SEARCH =====
export const SidebarSearch = ({ searchQuery, setSearchQuery, onClearSearch }) => {
  const { sidebarOpen } = useLayout();

  if (!sidebarOpen) return null;

  return (
    <div className="border-b p-4 shrink-0">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans le menu..."
          className="h-9 pl-8 pr-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 p-0"
            onClick={onClearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};