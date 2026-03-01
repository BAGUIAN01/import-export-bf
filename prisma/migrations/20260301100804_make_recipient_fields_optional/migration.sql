-- AlterTable
ALTER TABLE "public"."clients" ALTER COLUMN "recipientName" DROP NOT NULL,
ALTER COLUMN "recipientPhone" DROP NOT NULL,
ALTER COLUMN "recipientAddress" DROP NOT NULL,
ALTER COLUMN "recipientCity" DROP NOT NULL;
