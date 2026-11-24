import { redirect } from "next/navigation";

// L'écran de fin est /admin/caisse/impression (reçu, bordereau, client suivant).
export default function TerminerPage() {
  redirect("/admin/caisse/impression");
}
