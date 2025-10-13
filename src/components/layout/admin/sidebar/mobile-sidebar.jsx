"use client";

import React from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayout } from '../layout-provider';
import { SidebarHeader } from './sidebar-header';
import { SidebarNavigation } from './sidebar-navigation';
import { SidebarFooter } from './sidebar-footer';

export const MobileSidebar = () => {
  const { sidebarMobileOpen, setSidebarMobileOpen } = useLayout();

  const closeSidebar = () => setSidebarMobileOpen(false);

  return (
    <Sheet open={sidebarMobileOpen} onOpenChange={setSidebarMobileOpen}>
      <SheetContent 
        side="left" 
        className="w-80 max-w-[85vw] p-0 bg-background border-r-2 border-border"
      >
        {/* Titre caché pour l'accessibilité */}
        <VisuallyHidden>
          <SheetTitle>Menu de navigation</SheetTitle>
        </VisuallyHidden>

        <div className="flex h-full flex-col">
          <div className="relative border-b border-border">
            <SidebarHeader />
            <Button
              variant="ghost"
              size="sm"
              onClick={closeSidebar}
              className="absolute top-2 right-2 h-10 w-10 p-0 hover:bg-accent rounded-full min-h-[44px]"
            >
              <X className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SidebarNavigation onItemClick={closeSidebar} />
          </div>

          <div className="border-t border-border">
            <SidebarFooter />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};