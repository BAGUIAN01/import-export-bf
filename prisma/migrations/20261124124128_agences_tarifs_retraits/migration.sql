-- CreateEnum
CREATE TYPE "public"."AgenceRole" AS ENUM ('DEPART', 'ARRIVEE', 'DEUX');

-- AlterTable
ALTER TABLE "public"."containers" ADD COLUMN     "sealNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."shipments" ADD COLUMN     "receivedIdNumber" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "agenceId" TEXT;

-- CreateTable
CREATE TABLE "public"."agences" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "role" "public"."AgenceRole" NOT NULL DEFAULT 'DEPART',
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "taux" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "pariteFixe" BOOLEAN NOT NULL DEFAULT true,
    "modesPaiement" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prefixeRecu" TEXT NOT NULL DEFAULT 'R-',
    "adresse" TEXT,
    "telephone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."familles_articles" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "teinte" TEXT NOT NULL DEFAULT 'gris',
    "icone" TEXT NOT NULL DEFAULT 'package',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familles_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "detail" TEXT,
    "prix" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surDevis" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "frequent" BOOLEAN NOT NULL DEFAULT false,
    "proposeCaisse" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "familleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "familles_articles_cle_key" ON "public"."familles_articles"("cle");

-- CreateIndex
CREATE INDEX "articles_familleId_idx" ON "public"."articles"("familleId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "public"."agences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."articles" ADD CONSTRAINT "articles_familleId_fkey" FOREIGN KEY ("familleId") REFERENCES "public"."familles_articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
