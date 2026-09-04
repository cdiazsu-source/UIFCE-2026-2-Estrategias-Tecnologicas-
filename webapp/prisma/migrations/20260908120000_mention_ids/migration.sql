-- AlterTable: personas etiquetadas en una nota de bitácora y en una subtarea
ALTER TABLE "ProjectNote" ADD COLUMN "mentionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ChecklistItem" ADD COLUMN "mentionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
