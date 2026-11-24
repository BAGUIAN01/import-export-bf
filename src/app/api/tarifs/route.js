// GET /api/tarifs : familles et articles du catalogue.
// ?caisse=1 : seulement ce que la caisse propose.
import { NextResponse } from "next/server";
import { exigerSession } from "@/lib/acces";
import { listerCatalogue } from "@/lib/tarifs";

export async function GET(request) {
  const { refus } = await exigerSession();
  if (refus) return refus;
  try {
    const pourCaisse = new URL(request.url).searchParams.get("caisse") === "1";
    const familles = await listerCatalogue({ pourCaisse });
    return NextResponse.json({ familles });
  } catch (error) {
    console.error("Erreur GET /api/tarifs:", error);
    return NextResponse.json({ error: "Le catalogue n'a pas pu être chargé." }, { status: 500 });
  }
}
