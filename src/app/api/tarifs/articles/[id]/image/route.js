// GET /api/tarifs/articles/[id]/image : photo de l'article (mise en cache, l'URL porte ?v=).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerSession } from "@/lib/acces";

export async function GET(request, { params }) {
  const { refus } = await exigerSession();
  if (refus) return refus;
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id }, select: { image: true } });
  const m = article?.image?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return NextResponse.json({ error: "Pas de photo." }, { status: 404 });
  return new NextResponse(Buffer.from(m[2], "base64"), {
    headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
