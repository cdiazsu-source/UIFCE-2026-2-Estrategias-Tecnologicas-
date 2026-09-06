-- CreateEnum
CREATE TYPE "LinkedInTrackeeKind" AS ENUM ('PERSON', 'ORG');

-- CreateTable: lista curada de personas/organización a las que se les hace tracking en LinkedIn
CREATE TABLE "LinkedInTrackee" (
    "id" TEXT NOT NULL,
    "kind" "LinkedInTrackeeKind" NOT NULL DEFAULT 'PERSON',
    "name" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "area" TEXT,
    "level" TEXT,
    "userId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInTrackee_pkey" PRIMARY KEY ("id")
);

-- CreateTable: medición mensual de LinkedIn de un trackee
CREATE TABLE "LinkedInSnapshot" (
    "id" TEXT NOT NULL,
    "trackeeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "profileScore" INTEGER,
    "connections" INTEGER,
    "followers" INTEGER,
    "ssi" INTEGER,
    "postsLast30" INTEGER,
    "engagementLast30" INTEGER,
    "recommendations" INTEGER,
    "certsPublished" INTEGER,
    "uifceExperience" BOOLEAN NOT NULL DEFAULT false,
    "creatorMode" BOOLEAN NOT NULL DEFAULT false,
    "pageViews" INTEGER,
    "impressions" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "note" TEXT,
    "recordedById" TEXT,
    "recordedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinkedInTrackee_userId_idx" ON "LinkedInTrackee"("userId");
CREATE UNIQUE INDEX "LinkedInSnapshot_trackeeId_month_key" ON "LinkedInSnapshot"("trackeeId", "month");
CREATE INDEX "LinkedInSnapshot_trackeeId_month_idx" ON "LinkedInSnapshot"("trackeeId", "month");
CREATE INDEX "LinkedInSnapshot_recordedById_idx" ON "LinkedInSnapshot"("recordedById");

-- AddForeignKey
ALTER TABLE "LinkedInTrackee" ADD CONSTRAINT "LinkedInTrackee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LinkedInSnapshot" ADD CONSTRAINT "LinkedInSnapshot_trackeeId_fkey" FOREIGN KEY ("trackeeId") REFERENCES "LinkedInTrackee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LinkedInSnapshot" ADD CONSTRAINT "LinkedInSnapshot_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
