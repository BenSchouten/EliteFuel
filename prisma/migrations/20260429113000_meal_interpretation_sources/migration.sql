-- AlterTable
ALTER TABLE "MealLog"
ADD COLUMN "displayTitle" TEXT,
ADD COLUMN "userDetails" TEXT,
ADD COLUMN "photoDescription" TEXT,
ADD COLUMN "photoComponents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill existing rows so older logs have a stable display title and final source fallback.
UPDATE "MealLog"
SET "displayTitle" = COALESCE(NULLIF("note", ''), "extractedDescription"),
    "userDetails" = CASE
      WHEN "note" IS NOT NULL AND "note" <> '' AND "note" <> "extractedDescription" AND "note" <> 'Meal photo submitted'
      THEN "note"
      ELSE NULL
    END;
