import { Suspense } from "react";
import AuthErrorClient from "./auth-error-client";

export const dynamic = "force-dynamic"; // évite la SSG sur cette page

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement…</div>}>
      <AuthErrorClient />
    </Suspense>
  );
}
