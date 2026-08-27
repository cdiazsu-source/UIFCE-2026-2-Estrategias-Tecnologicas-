-- AlterTable
ALTER TABLE "ProjectNote" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "authorRole" TEXT;

-- CreateIndex
CREATE INDEX "ProjectNote_authorId_idx" ON "ProjectNote"("authorId");

-- AddForeignKey
ALTER TABLE "ProjectNote" ADD CONSTRAINT "ProjectNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
