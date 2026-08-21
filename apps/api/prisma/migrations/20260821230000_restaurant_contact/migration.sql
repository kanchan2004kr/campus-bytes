-- Restaurant contact/hours for owner + admin profile editing.
-- Additive, nullable — safe for existing data.
ALTER TABLE "restaurant" ADD COLUMN "phone" TEXT;
ALTER TABLE "restaurant" ADD COLUMN "hours" TEXT;
