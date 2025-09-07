"use client";

import { useEffect } from "react";
import { useLayout } from "@/components/layout/admin/layout-provider";

export function PageTitle({ title = "" }) {
  const { setHeaderTitle } = useLayout();

  useEffect(() => {
    setHeaderTitle(title);
    return () => setHeaderTitle(""); // nettoie au démontage si tu veux
  }, [title, setHeaderTitle]);

  return null;
}
