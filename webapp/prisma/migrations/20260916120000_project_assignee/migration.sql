-- AlterTable: responsable a nivel de proyecto (da el color del proyecto en el panel).
ALTER TABLE "Project" ADD COLUMN "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "Project_assigneeId_idx" ON "Project"("assigneeId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
