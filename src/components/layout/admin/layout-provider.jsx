"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LayoutContext = createContext(null);

export const useLayout = () => {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within <LayoutProvider>");
  return ctx;
};

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [expandedSections, setExpandedSections] = useState(() => new Set(["Utilisateurs"]));
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 👇 NOUVEAU : le titre global du header
  const [headerTitle, setHeaderTitle] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

    // init client only
  useEffect(() => {
    if (!mounted) return;

    try {
      const savedSidebarOpen = localStorage.getItem("sidebarOpen");
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia?.("(permits-color-scheme: dark)").matches;

      if (savedSidebarOpen !== null) setSidebarOpen(JSON.parse(savedSidebarOpen));
      if (savedTheme) setTheme(savedTheme);
      else if (prefersDark) setTheme("dark");
    } catch { /* ignore */ }

    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen)); } catch {}
  }, [sidebarOpen, mounted]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const toggleSidebar = () => (isMobile ? setSidebarMobileOpen((v) => !v) : setSidebarOpen((v) => !v));
  const toggleSection = (title) =>
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  const value = useMemo(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      sidebarMobileOpen,
      setSidebarMobileOpen,
      theme,
      toggleTheme,
      isMobile,
      toggleSidebar,
      expandedSections,
      toggleSection,
      mounted,
      // 👇 Expose dans le contexte
      headerTitle,
      setHeaderTitle,
    }),
    [sidebarOpen, sidebarMobileOpen, theme, isMobile, expandedSections, mounted, headerTitle]
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export default LayoutProvider;
