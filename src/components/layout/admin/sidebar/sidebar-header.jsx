"use client";

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useLayout } from '../layout-provider';
import Image from 'next/image';

// ===== SIDEBAR HEADER =====
export const SidebarHeader = () => {
  const { sidebarOpen } = useLayout();

  return (
    <div className="flex h-14 items-center border-b px-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Image src="/logo.jpeg" alt="Logo" width={24} height={24} className='text-primary-foreground' />
        </div>
        {sidebarOpen && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Naange Envoi</span>
            <span className="text-xs text-muted-foreground">Gestion des colis</span>
          </div>
        )}
      </div>
    </div>
  );
};