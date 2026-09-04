-- CreateTable: semestre de planeación (agrupa proyectos y objetivos del área)
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Semester_label_key" ON "Semester"("label");

-- AlterTable: cada proyecto pertenece a un semestre
ALTER TABLE "Project" ADD COLUMN "semesterId" TEXT;
CREATE INDEX "Project_semesterId_idx" ON "Project"("semesterId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
