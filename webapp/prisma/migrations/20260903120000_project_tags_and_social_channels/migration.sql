-- AlterTable: etiquetas del proyecto y marca de edición en la app
ALTER TABLE "Project" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Project" ADD COLUMN "editedInApp" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('INSTAGRAM', 'LINKEDIN', 'X', 'TIKTOK', 'YOUTUBE', 'FACEBOOK');
CREATE TYPE "SocialChannelStatus" AS ENUM ('ACTIVA', 'EN_RIESGO', 'EN_TRAMITE', 'INACTIVA', 'PERDIDA');

-- CreateTable
CREATE TABLE "SocialChannel" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT,
    "url" TEXT,
    "status" "SocialChannelStatus" NOT NULL DEFAULT 'ACTIVA',
    "official" BOOLEAN NOT NULL DEFAULT false,
    "followers" INTEGER,
    "cadence" TEXT,
    "lastPostAt" TIMESTAMP(3),
    "lastPostNote" TEXT,
    "nextAction" TEXT,
    "notes" TEXT,
    "responsibleId" TEXT,
    "projectId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialChannel_platform_key" ON "SocialChannel"("platform");
CREATE INDEX "SocialChannel_responsibleId_idx" ON "SocialChannel"("responsibleId");
CREATE INDEX "SocialChannel_projectId_idx" ON "SocialChannel"("projectId");

-- AddForeignKey
ALTER TABLE "SocialChannel" ADD CONSTRAINT "SocialChannel_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialChannel" ADD CONSTRAINT "SocialChannel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
