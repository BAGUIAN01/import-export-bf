// app/api/pricing/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  comparePricing,
  typeCodeFromName,
  validatePricingInput,
} from "@/lib/data/pricing-catalog";
import { isR2Configured } from "@/lib/storage/r2";
import { authorName, refreshPublicPricing, requireSession } from "@/lib/pricing-server";

// GET /api/pricing — toute la grille (caisse, formulaire de colis, écran Tarifs)
export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const rows = await prisma.pricing.findMany();
    rows.sort(comparePricing);
    return NextResponse.json({
      success: true,
      data: rows,
      photoStorageReady: isR2Configured(),
    });
  } catch (e) {
    console.error("GET /api/pricing:", e);
    return NextResponse.json({ error: "Impossible de lire les tarifs" }, { status: 500 });
  }
}

// POST /api/pricing — nouvel article (administrateur)
export async function POST(request) {
  const { session, error } = await requireSession({ adminOnly: true });
  if (error) return error;

  try {
    const body = await request.json();
    const { data, errors } = validatePricingInput(body);
    if (Object.keys(errors).length) {
      return NextResponse.json({ error: "Données invalides", errors }, { status: 400 });
    }

    // Code technique unique, dérivé du nom (TROTTINETTE, TROTTINETTE_2…)
    const base = typeCodeFromName(data.name);
    const taken = new Set(
      (
        await prisma.pricing.findMany({
          where: { type: { startsWith: base } },
          select: { type: true },
        })
      ).map((r) => r.type)
    );
    let type = base;
    for (let i = 2; taken.has(type); i++) type = `${base}_${i}`;

    const last = await prisma.pricing.findFirst({
      where: { category: data.category },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const created = await prisma.pricing.create({
      data: {
        priceProvince: null,
        showOnWebsite: true,
        isActive: true,
        ...data,
        type,
        sortOrder: data.sortOrder ?? (last?.sortOrder ?? 0) + 1,
        updatedByName: authorName(session),
      },
    });

    refreshPublicPricing();
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/pricing:", e);
    return NextResponse.json({ error: "Impossible d'ajouter l'article" }, { status: 500 });
  }
}
