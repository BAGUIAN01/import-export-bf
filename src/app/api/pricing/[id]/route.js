// app/api/pricing/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePricingInput } from "@/lib/data/pricing-catalog";
import { authorName, refreshPublicPricing, requireSession } from "@/lib/pricing-server";

// PUT /api/pricing/[id] — modifier un article (administrateur).
// Les colis déjà enregistrés gardent leur prix : ils le portent eux-mêmes.
export async function PUT(request, { params }) {
  const { session, error } = await requireSession({ adminOnly: true });
  if (error) return error;

  try {
    const { id } = await params;
    const current = await prisma.pricing.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
    }

    const body = await request.json();
    const { data, errors } = validatePricingInput(body, { partial: true, current });
    if (Object.keys(errors).length) {
      return NextResponse.json({ error: "Données invalides", errors }, { status: 400 });
    }

    const updated = await prisma.pricing.update({
      where: { id },
      data: { ...data, updatedByName: authorName(session) },
    });

    refreshPublicPricing();
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PUT /api/pricing/[id]:", e);
    return NextResponse.json({ error: "Impossible d'enregistrer le tarif" }, { status: 500 });
  }
}
