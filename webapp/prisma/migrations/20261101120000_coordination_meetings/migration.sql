-- Modo diseño y reuniones guardadas de «Reunión coordinación».
CREATE TABLE "CoordinationPage" (
    "key" TEXT NOT NULL,
    "title" TEXT,
    "note" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinationPage_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "CoordinationMeeting" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinationMeeting_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CoordinationMeeting_date_idx" ON "CoordinationMeeting"("date");
