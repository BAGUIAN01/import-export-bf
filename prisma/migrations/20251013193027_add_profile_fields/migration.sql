-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "notificationSettings" JSONB,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
