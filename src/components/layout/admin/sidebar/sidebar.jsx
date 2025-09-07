"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { useLayout } from '../layout-provider';
import { SidebarHeader } from './sidebar-header';
import { SidebarNavigation } from './sidebar-navigation';
import { SidebarFooter } from './sidebar-footer';

// ===== SIDEBAR DESKTOP - VERSION MODULAIRE =====
export const Sidebar = ({ className = "" }) => {
  const { sidebarOpen } = useLayout();

  return (
    <div
      className={cn(
        "border-r bg-muted/30 transition-all duration-300 font-bold hidden md:flex flex-col h-screen",
        sidebarOpen ? "w-64" : "w-16",
        className
      )}
    >
      <SidebarHeader />
      <SidebarNavigation />
      <SidebarFooter />
    </div>
  );}