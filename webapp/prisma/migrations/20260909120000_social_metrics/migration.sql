-- CreateTable: mediciones de KPIs por cuenta de redes (Instagram / LinkedIn)
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "recordedById" TEXT,
    "recordedByName" TEXT,
    "note" TEXT,
    "igFollowers" INTEGER,
    "igReach" INTEGER,
    "igImpressions" INTEGER,
    "igInteractions" INTEGER,
    "igProfileVisits" INTEGER,
    "liFollowers" INTEGER,
    "liProfileViews" INTEGER,
    "liPostImpressions" INTEGER,
    "liInteractions" INTEGER,
    "liSearchAppearances" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialMetric_channelId_at_idx" ON "SocialMetric"("channelId", "at");
CREATE INDEX "SocialMetric_recordedById_idx" ON "SocialMetric"("recordedById");

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "SocialChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
