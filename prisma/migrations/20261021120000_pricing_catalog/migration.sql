-- Grille tarifaire unique : écran Gestion → Tarifs, caisse, formulaire de colis, site public.

-- AlterTable
ALTER TABLE "public"."pricings" ADD COLUMN "category" TEXT,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "priceMode" TEXT NOT NULL DEFAULT 'FIXED',
ADD COLUMN "priceProvince" DOUBLE PRECISION,
ADD COLUMN "imageUrl" TEXT,
ADD COLUMN "imageKey" TEXT,
ADD COLUMN "showOnWebsite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "updatedByName" TEXT;

-- Reprise des prix de la caisse (lib/data/packages.js au 21/10/2026).
-- Une ligne déjà réglée (catégorie renseignée) n'est jamais écrasée ; seules
-- les lignes d'essai de scripts/seed.js (sans catégorie) sont remises à jour.
INSERT INTO "public"."pricings"
  ("id", "type", "name", "description", "category", "sortOrder", "priceMode", "basePrice", "priceProvince", "showOnWebsite", "updatedAt")
SELECT 'prc_' || md5(v.type), v.type, v.name, v.description, v.category, v.sort_order, v.price_mode, v.base_price, v.price_province, v.show_on_website, CURRENT_TIMESTAMP
FROM (VALUES
  ('CARTON', 'Carton Standard', '40 × 40 × 35 cm', 'cartons', 1, 'FIXED', 40, NULL, true),
  ('CARTON_MEDIUM', 'Carton Moyen', '80 × 50 × 50 cm', 'cartons', 2, 'FIXED', 90, 140, true),
  ('CARTON_LARGE', 'Carton Grand', '80 × 60 × 60 cm', 'cartons', 3, 'FIXED', 100, 140, true),
  ('BARRIQUE', 'Fût bleu 220 L', NULL, 'futs', 1, 'FIXED', 120, 160, true),
  ('FUT_BLACK_270L', 'Fût noir 270 L', NULL, 'futs', 2, 'FIXED', 120, 170, true),
  ('VALISE_SMALL', 'Petite valise', 'Valise cabine', 'bagages', 1, 'FIXED', 30, NULL, true),
  ('VALISE_MEDIUM', 'Valise moyenne', 'Valise standard', 'bagages', 2, 'FIXED', 50, NULL, true),
  ('VALISE_LARGE', 'Grande valise', 'Valise voyage', 'bagages', 3, 'FIXED', 70, NULL, true),
  ('VALISE_XLARGE', 'Très grande valise', 'Valise XXL', 'bagages', 4, 'FIXED', 100, NULL, true),
  ('SAC_MEDIUM', 'Sac moyen', NULL, 'bagages', 5, 'FIXED', 60, NULL, true),
  ('SAC_LARGE', 'Grand sac', 'Sac de voyage, sac boudin', 'bagages', 6, 'FIXED', 70, NULL, true),
  ('SAC_XLARGE', 'Très grand sac', NULL, 'bagages', 7, 'FIXED', 100, NULL, true),
  ('CANTINE_SMALL', 'Petite cantine', NULL, 'cantines', 1, 'FIXED', 70, NULL, true),
  ('CANTINE_MEDIUM', 'Cantine moyenne', NULL, 'cantines', 2, 'FIXED', 120, NULL, true),
  ('CANTINE_LARGE', 'Grande cantine', NULL, 'cantines', 3, 'FIXED', 160, NULL, true),
  ('CANTINE_XLARGE', 'Très grande cantine', NULL, 'cantines', 4, 'FIXED', 180, NULL, true),
  ('ELECTRONICS', 'Micro-ondes', NULL, 'electromenager', 1, 'FIXED', 30, NULL, true),
  ('FRIDGE_SMALL', 'Petit frigo', NULL, 'electromenager', 2, 'FIXED', 100, NULL, true),
  ('FRIDGE_STANDARD', 'Frigo standard', NULL, 'electromenager', 3, 'FROM', 160, NULL, true),
  ('FRIDGE_LARGE', 'Grand frigo', NULL, 'electromenager', 4, 'FROM', 200, NULL, true),
  ('FRIDGE_AMERICAN', 'Frigo américain', NULL, 'electromenager', 5, 'FIXED', 300, NULL, true),
  ('FREEZER_SMALL', 'Petit congélateur', NULL, 'electromenager', 6, 'FIXED', 140, NULL, true),
  ('FREEZER_MEDIUM', 'Congélateur moyen', NULL, 'electromenager', 7, 'FROM', 300, NULL, true),
  ('FREEZER_LARGE', 'Grand congélateur', NULL, 'electromenager', 8, 'FROM', 380, NULL, true),
  ('FREEZER_XLARGE', 'Très grand congélateur', NULL, 'electromenager', 9, 'QUOTE', 0, NULL, true),
  ('WASHING_MACHINE', 'Lave-linge', NULL, 'electromenager', 10, 'FIXED', 120, NULL, true),
  ('STOVE', 'Gazinière', NULL, 'electromenager', 11, 'FIXED', 120, NULL, true),
  ('TV_32', 'TV 32"', '80 cm', 'tv', 1, 'FIXED', 90, NULL, true),
  ('TV_40', 'TV 40"', '100 cm', 'tv', 2, 'FIXED', 130, NULL, true),
  ('TV_48', 'TV 48"', '123 cm', 'tv', 3, 'FIXED', 150, NULL, true),
  ('TV_55', 'TV 55"', '140 cm', 'tv', 4, 'FIXED', 180, NULL, true),
  ('TV_65', 'TV 65"', '163 cm', 'tv', 5, 'FIXED', 200, NULL, true),
  ('TV_75', 'TV 75"', '189 cm', 'tv', 6, 'FIXED', 270, NULL, true),
  ('TV_80', 'TV 80"', '203 cm', 'tv', 7, 'FIXED', 300, NULL, true),
  ('TV_OTHER', 'TV autre taille', NULL, 'tv', 8, 'QUOTE', 0, NULL, true),
  ('CHAIR_STACKABLE', 'Chaise empilable', NULL, 'mobilier', 1, 'FIXED', 10, NULL, true),
  ('CHAIR_STANDARD', 'Chaise non empilable', NULL, 'mobilier', 2, 'FIXED', 30, NULL, true),
  ('OFFICE_CHAIR', 'Chaise de bureau', NULL, 'mobilier', 3, 'FIXED', 40, NULL, true),
  ('ARMCHAIR', 'Fauteuil', NULL, 'mobilier', 4, 'FIXED', 120, NULL, true),
  ('SOFA_SEAT', 'Canapé (par place)', NULL, 'mobilier', 5, 'FIXED', 100, NULL, true),
  ('MATTRESS_SEAT', 'Matelas (par place)', NULL, 'mobilier', 6, 'FIXED', 60, NULL, true),
  ('WINE_6_BOTTLES', 'Carton 6 bouteilles de vin', NULL, 'vins', 1, 'FROM', 10, NULL, true),
  ('WINE_12_BOTTLES', 'Carton 12 bouteilles de vin', NULL, 'vins', 2, 'FIXED', 18, NULL, true),
  ('CHAMPAGNE_6_BOTTLES', 'Carton 6 bouteilles de champagne', NULL, 'vins', 3, 'FIXED', 28, NULL, true),
  ('CHAMPAGNE_12_BOTTLES', 'Carton 12 bouteilles de champagne', NULL, 'vins', 4, 'FIXED', 32, NULL, true),
  ('VEHICLE', 'Petite voiture', 'Chargée', 'vehicules', 1, 'FIXED', 1500, NULL, true),
  ('SUV_4X4', 'SUV 4×4', 'Chargé', 'vehicules', 2, 'FROM', 2000, NULL, true),
  ('MOTORCYCLE', 'Vélo', NULL, 'vehicules', 3, 'FROM', 30, NULL, true),
  ('OTHER', 'Autre véhicule', NULL, 'vehicules', 4, 'QUOTE', 0, NULL, true),
  ('GENERATOR_SMALL', 'Groupe électrogène', NULL, 'divers', 1, 'FROM', 280, NULL, true),
  ('FOOD', 'Alimentation', 'Produits alimentaires', 'divers', 2, 'FIXED', 45, NULL, false),
  ('CLOTHING', 'Vêtements', 'Textiles et accessoires', 'divers', 3, 'FIXED', 40, NULL, false),
  ('DOCUMENTS', 'Documents', 'Papiers et courrier', 'divers', 4, 'FIXED', 25, NULL, false),
  ('INDUSTRIAL', 'Matériel industriel', NULL, 'divers', 5, 'QUOTE', 0, NULL, true),
  ('ENLEVEMENT', 'Enlèvement à domicile', NULL, 'enlevement', 1, 'FIXED', 20, NULL, true)
) AS v(type, name, description, category, sort_order, price_mode, base_price, price_province, show_on_website)
ON CONFLICT ("type") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "sortOrder" = EXCLUDED."sortOrder",
  "priceMode" = EXCLUDED."priceMode",
  "basePrice" = EXCLUDED."basePrice",
  "priceProvince" = EXCLUDED."priceProvince",
  "showOnWebsite" = EXCLUDED."showOnWebsite",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "pricings"."category" IS NULL;
