-- AlterTable: LinkedIn personal de cada persona
ALTER TABLE "User" ADD COLUMN "linkedinUrl" TEXT;

-- CreateTable: ficha institucional del área (singleton)
CREATE TABLE "AreaProfile" (
    "id" TEXT NOT NULL DEFAULT 'area',
    "description" TEXT NOT NULL,
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaProfile_pkey" PRIMARY KEY ("id")
);
