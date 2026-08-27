-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MASTER', 'JUNIOR_ARTES', 'JUNIOR_AUXILIAR', 'COORDINADOR', 'DIRECTOR');

-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('PENDIENTE', 'EN_CURSO', 'CUMPLIDO', 'ATRASADO');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "area" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyProject" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyCheckpoint" (
    "id" TEXT NOT NULL,
    "studyProjectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "CheckpointStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandGuideline" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "colorHex" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandGuideline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "StudyProject_ownerId_idx" ON "StudyProject"("ownerId");

-- CreateIndex
CREATE INDEX "StudyCheckpoint_studyProjectId_idx" ON "StudyCheckpoint"("studyProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyCheckpoint_studyProjectId_number_key" ON "StudyCheckpoint"("studyProjectId", "number");

-- CreateIndex
CREATE INDEX "BrandGuideline_section_idx" ON "BrandGuideline"("section");

-- AddForeignKey
ALTER TABLE "StudyProject" ADD CONSTRAINT "StudyProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyCheckpoint" ADD CONSTRAINT "StudyCheckpoint_studyProjectId_fkey" FOREIGN KEY ("studyProjectId") REFERENCES "StudyProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
