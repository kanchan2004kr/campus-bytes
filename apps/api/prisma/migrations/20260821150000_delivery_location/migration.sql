-- Campus delivery location: student saved location + per-order snapshot.
-- Additive, nullable columns only — safe for existing production data.

-- Student's saved (reusable) delivery location
ALTER TABLE "app_user" ADD COLUMN "savedDeliveryType" TEXT;
ALTER TABLE "app_user" ADD COLUMN "savedDeliveryName" TEXT;
ALTER TABLE "app_user" ADD COLUMN "savedDeliveryRoomNo" TEXT;
ALTER TABLE "app_user" ADD COLUMN "savedDeliveryInstructions" TEXT;

-- Order-time delivery snapshot (frozen; never changes if the student later
-- edits their saved location)
ALTER TABLE "order" ADD COLUMN "deliveryType" TEXT;
ALTER TABLE "order" ADD COLUMN "deliveryLocationName" TEXT;
ALTER TABLE "order" ADD COLUMN "deliveryInstructions" TEXT;
