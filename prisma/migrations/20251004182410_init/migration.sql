-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CLIENT', 'ADMIN', 'STAFF', 'TRACKER', 'AGENT');

-- CreateEnum
CREATE TYPE "public"."PackageType" AS ENUM ('CARTON', 'CARTON_MEDIUM', 'CARTON_LARGE', 'BARRIQUE', 'FUT_BLACK_270L', 'VEHICLE', 'SUV_4X4', 'MOTORCYCLE', 'ELECTRONICS', 'FRIDGE_SMALL', 'FRIDGE_STANDARD', 'FRIDGE_LARGE', 'FRIDGE_AMERICAN', 'FREEZER_SMALL', 'FREEZER_MEDIUM', 'FREEZER_LARGE', 'FREEZER_XLARGE', 'WASHING_MACHINE', 'STOVE', 'TV_32', 'TV_40', 'TV_48', 'TV_55', 'TV_65', 'TV_75', 'TV_80', 'TV_OTHER', 'VALISE_SMALL', 'VALISE_MEDIUM', 'VALISE_LARGE', 'VALISE_XLARGE', 'SAC_MEDIUM', 'SAC_LARGE', 'SAC_XLARGE', 'CANTINE_SMALL', 'CANTINE_MEDIUM', 'CANTINE_LARGE', 'CANTINE_XLARGE', 'CHAIR_STACKABLE', 'CHAIR_STANDARD', 'OFFICE_CHAIR', 'ARMCHAIR', 'SOFA_SEAT', 'MATTRESS_SEAT', 'WINE_6_BOTTLES', 'WINE_12_BOTTLES', 'CHAMPAGNE_6_BOTTLES', 'CHAMPAGNE_12_BOTTLES', 'CLOTHING', 'FOOD', 'DOCUMENTS', 'GENERATOR_SMALL', 'INDUSTRIAL', 'LARGE_BAGGAGE', 'CONTAINERS', 'TRACTORS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PackageStatus" AS ENUM ('REGISTERED', 'COLLECTED', 'IN_CONTAINER', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ContainerStatus" AS ENUM ('PREPARATION', 'LOADED', 'IN_TRANSIT', 'CUSTOMS', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'MOBILE_MONEY', 'CHEQUE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('SMS', 'EMAIL', 'WHATSAPP', 'PUSH');

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'France',
    "dateOfBirth" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."phone_verifications" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'France',
    "postalCode" TEXT,
    "company" TEXT,
    "siret" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientAddress" TEXT NOT NULL,
    "recipientCity" TEXT NOT NULL,
    "recipientRelation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."containers" (
    "id" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "name" TEXT,
    "departureDate" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "arrivalDate" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "status" "public"."ContainerStatus" NOT NULL DEFAULT 'PREPARATION',
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "currentLoad" INTEGER NOT NULL DEFAULT 0,
    "maxWeight" DOUBLE PRECISION,
    "currentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "origin" TEXT NOT NULL DEFAULT 'France',
    "destination" TEXT NOT NULL DEFAULT 'Burkina Faso',
    "currentLocation" TEXT,
    "transportCompany" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "plateNumber" TEXT,
    "transportCost" DOUBLE PRECISION,
    "customsCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" TEXT NOT NULL,
    "packageNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "containerId" TEXT,
    "userId" TEXT,
    "types" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 1,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "value" DOUBLE PRECISION,
    "photos" JSONB,
    "status" "public"."PackageStatus" NOT NULL DEFAULT 'REGISTERED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isFragile" BOOLEAN NOT NULL DEFAULT false,
    "isInsured" BOOLEAN NOT NULL DEFAULT false,
    "pickupAddress" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTime" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "deliveryTime" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "pickupFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod",
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "specialInstructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shipmentId" TEXT,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracking_updates" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "photos" JSONB,
    "temperature" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pricings" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "pickupFee" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "perKgPrice" DOUBLE PRECISION,
    "minWeight" DOUBLE PRECISION,
    "maxWeight" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "packageId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "packageId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "reference" TEXT,
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_messages" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "templateName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "packageId" TEXT,
    "clientId" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "packageId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'string',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipments" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "containerId" TEXT,
    "userId" TEXT NOT NULL,
    "packagesCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickupFeeTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insuranceFeeTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customsFeeTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod",
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "pickupAddress" TEXT,
    "pickupDate" TIMESTAMP(3),
    "pickupTime" TEXT,
    "deliveryAddress" TEXT,
    "specialInstructions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "public"."accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "phone_verifications_phone_idx" ON "public"."phone_verifications"("phone");

-- CreateIndex
CREATE INDEX "phone_verifications_expiresAt_idx" ON "public"."phone_verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "phone_verifications_phone_code_key" ON "public"."phone_verifications"("phone", "code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientCode_key" ON "public"."clients"("clientCode");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "public"."clients"("phone");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "public"."clients"("email");

-- CreateIndex
CREATE INDEX "clients_clientCode_idx" ON "public"."clients"("clientCode");

-- CreateIndex
CREATE INDEX "clients_isActive_idx" ON "public"."clients"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "containers_containerNumber_key" ON "public"."containers"("containerNumber");

-- CreateIndex
CREATE INDEX "containers_containerNumber_idx" ON "public"."containers"("containerNumber");

-- CreateIndex
CREATE INDEX "containers_status_idx" ON "public"."containers"("status");

-- CreateIndex
CREATE INDEX "containers_departureDate_idx" ON "public"."containers"("departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "packages_packageNumber_key" ON "public"."packages"("packageNumber");

-- CreateIndex
CREATE INDEX "packages_shipmentId_idx" ON "public"."packages"("shipmentId");

-- CreateIndex
CREATE INDEX "packages_packageNumber_idx" ON "public"."packages"("packageNumber");

-- CreateIndex
CREATE INDEX "packages_clientId_idx" ON "public"."packages"("clientId");

-- CreateIndex
CREATE INDEX "packages_containerId_idx" ON "public"."packages"("containerId");

-- CreateIndex
CREATE INDEX "packages_status_idx" ON "public"."packages"("status");

-- CreateIndex
CREATE INDEX "packages_createdAt_idx" ON "public"."packages"("createdAt");

-- CreateIndex
CREATE INDEX "tracking_updates_containerId_idx" ON "public"."tracking_updates"("containerId");

-- CreateIndex
CREATE INDEX "tracking_updates_timestamp_idx" ON "public"."tracking_updates"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "pricings_type_key" ON "public"."pricings"("type");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "public"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "public"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "public"."invoices"("clientId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "public"."invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentNumber_key" ON "public"."payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "payments_paymentNumber_idx" ON "public"."payments"("paymentNumber");

-- CreateIndex
CREATE INDEX "payments_clientId_idx" ON "public"."payments"("clientId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_to_idx" ON "public"."whatsapp_messages"("to");

-- CreateIndex
CREATE INDEX "whatsapp_messages_status_idx" ON "public"."whatsapp_messages"("status");

-- CreateIndex
CREATE INDEX "whatsapp_messages_createdAt_idx" ON "public"."whatsapp_messages"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "public"."notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "public"."notifications"("isRead");

-- CreateIndex
CREATE INDEX "files_packageId_idx" ON "public"."files"("packageId");

-- CreateIndex
CREATE INDEX "files_uploadedBy_idx" ON "public"."files"("uploadedBy");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "public"."audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "public"."settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_shipmentNumber_key" ON "public"."shipments"("shipmentNumber");

-- CreateIndex
CREATE INDEX "shipments_shipmentNumber_idx" ON "public"."shipments"("shipmentNumber");

-- CreateIndex
CREATE INDEX "shipments_clientId_idx" ON "public"."shipments"("clientId");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."packages" ADD CONSTRAINT "packages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."packages" ADD CONSTRAINT "packages_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."packages" ADD CONSTRAINT "packages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."packages" ADD CONSTRAINT "packages_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_updates" ADD CONSTRAINT "tracking_updates_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_updates" ADD CONSTRAINT "tracking_updates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoice_items" ADD CONSTRAINT "invoice_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "public"."containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
