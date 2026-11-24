import { redirect } from "next/navigation";

// Les chiffres du jour sont dans le panneau droit de l'étape Client.
export default function CaissePage() {
  redirect("/admin/caisse/client");
}
