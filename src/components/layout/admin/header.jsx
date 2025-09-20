"use client";

import React from "react";
import { PanelLeft, Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { useLayout } from "./layout-provider";
import { MobileSidebar } from "./sidebar";

export const Header = ({ children }) => {
  const { toggleSidebar, theme, toggleTheme, headerTitle } = useLayout();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7">
        <PanelLeft className="h-4 w-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex-1">
        <h1 className="text-lg font-semibold">
          {headerTitle || "—"} {/* fallback si aucun titre n’a été défini */}
        </h1>
      </div>

    </header>
  );
};

export default Header;
