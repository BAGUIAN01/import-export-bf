-- AlterTable
ALTER TABLE "public"."shipments" ADD COLUMN "deliveredAt" TIMESTAMP(3),
ADD COLUMN "receivedBy" TEXT,
ADD COLUMN "deliveryNote" TEXT;
