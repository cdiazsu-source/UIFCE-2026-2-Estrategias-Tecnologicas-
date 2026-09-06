-- AlterTable: los proyectos de estudio se agrupan por semestre (como los proyectos).
ALTER TABLE "StudyProject" ADD COLUMN "semesterId" TEXT;

-- CreateIndex
CREATE INDEX "StudyProject_semesterId_idx" ON "StudyProject"("semesterId");

-- AddForeignKey
ALTER TABLE "StudyProject" ADD CONSTRAINT "StudyProject_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
