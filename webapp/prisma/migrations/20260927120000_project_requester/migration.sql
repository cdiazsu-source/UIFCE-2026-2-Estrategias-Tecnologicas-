-- AlterTable: solicitante del proyecto (persona fuera de ET que pidió el servicio o la iniciativa).
ALTER TABLE "Project" ADD COLUMN "requesterId" TEXT;

-- CreateIndex
CREATE INDEX "Project_requesterId_idx" ON "Project"("requesterId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
