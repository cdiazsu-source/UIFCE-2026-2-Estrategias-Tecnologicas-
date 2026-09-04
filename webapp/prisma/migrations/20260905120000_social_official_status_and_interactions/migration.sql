-- CreateEnum: estado de oficialización de 3 valores (reemplaza el booleano)
CREATE TYPE "SocialOfficialStatus" AS ENUM ('OFICIALIZADA', 'EN_TRAMITE', 'SIN_OFICIALIZAR');

-- AlterTable: SocialChannel.official (bool) -> officialStatus (enum)
ALTER TABLE "SocialChannel" ADD COLUMN "officialStatus" "SocialOfficialStatus" NOT NULL DEFAULT 'SIN_OFICIALIZAR';
UPDATE "SocialChannel"
  SET "officialStatus" = CASE WHEN "official" THEN 'OFICIALIZADA'::"SocialOfficialStatus" ELSE 'SIN_OFICIALIZAR'::"SocialOfficialStatus" END;
ALTER TABLE "SocialChannel" DROP COLUMN "official";

-- CreateTable: trazabilidad de interacciones por cuenta
CREATE TABLE "SocialInteraction" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "followers" INTEGER,
    "reach" INTEGER,
    "interactions" INTEGER,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialInteraction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialInteraction_channelId_at_idx" ON "SocialInteraction"("channelId", "at");

ALTER TABLE "SocialInteraction" ADD CONSTRAINT "SocialInteraction_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SocialChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
