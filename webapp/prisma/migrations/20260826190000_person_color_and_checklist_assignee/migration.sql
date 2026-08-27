-- AlterTable
ALTER TABLE "User" ADD COLUMN     "color" TEXT;

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "ChecklistItem_assigneeId_idx" ON "ChecklistItem"("assigneeId");

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
