// app/api/pricing/[id]/image/route.js
// Photo d'un article, rangée dans Cloudflare R2. Le navigateur l'a déjà réduite
// (WebP, 800 px) : on refuse ce qui ressemble à une photo brute.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject, isR2Configured, putObject } from "@/lib/storage/r2";
import { authorName, refreshPublicPricing, requireSession } from "@/lib/pricing-server";

const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

const storageNotReady = () =>
  NextResponse.json(
    {
      error:
        "Le stockage des photos n'est pas encore branché (Cloudflare R2). Le tarif est enregistré, la photo pourra être ajoutée plus tard.",
    },
    { status: 503 },
  );

async function findRow(params) {
  const { id } = await params;
  return prisma.pricing.findUnique({ where: { id } });
}

// POST /api/pricing/[id]/image — remplace la photo
export async function POST(request, { params }) {
  const { session, error } = await requireSession({ adminOnly: true });
  if (error) return error;
  if (!isR2Configured()) return storageNotReady();

  try {
    const row = await findRow(params);
    if (!row) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Aucune photo reçue" }, { status: 400 });
    }
    const ext = EXTENSIONS[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Format non pris en charge (JPG, PNG ou WebP)" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Photo trop lourde (2 Mo au maximum)" }, { status: 400 });
    }

    const key = `pricing/${row.type.toLowerCase()}-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageUrl = await putObject(key, bytes, file.type);

    const updated = await prisma.pricing.update({
      where: { id: row.id },
      data: { imageUrl, imageKey: key, updatedByName: authorName(session) },
    });

    // L'ancienne photo n'est plus référencée : on la retire (un échec ne bloque pas).
    if (row.imageKey && row.imageKey !== key) {
      await deleteObject(row.imageKey).catch((e) => console.error("R2 delete:", e));
    }

    refreshPublicPricing();
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("POST /api/pricing/[id]/image:", e);
    return NextResponse.json({ error: "Impossible d'envoyer la photo" }, { status: 500 });
  }
}

// DELETE /api/pricing/[id]/image — retire la photo
export async function DELETE(request, { params }) {
  const { session, error } = await requireSession({ adminOnly: true });
  if (error) return error;

  try {
    const row = await findRow(params);
    if (!row) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

    const updated = await prisma.pricing.update({
      where: { id: row.id },
      data: { imageUrl: null, imageKey: null, updatedByName: authorName(session) },
    });

    if (row.imageKey && isR2Configured()) {
      await deleteObject(row.imageKey).catch((e) => console.error("R2 delete:", e));
    }

    refreshPublicPricing();
    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("DELETE /api/pricing/[id]/image:", e);
    return NextResponse.json({ error: "Impossible de retirer la photo" }, { status: 500 });
  }
}
