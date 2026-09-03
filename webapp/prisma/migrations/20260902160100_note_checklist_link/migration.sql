-- AlterTable
-- Vincula (opcionalmente) una nota de bitácora con una subtarea del checklist.
ALTER TABLE "ProjectNote" ADD COLUMN "checklistItemId" TEXT;

-- CreateIndex
CREATE INDEX "ProjectNote_checklistItemId_idx" ON "ProjectNote"("checklistItemId");

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
