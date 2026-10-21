-- Control de horas del equipo (/horas): semanas de planeación y horas planeadas / hechas por persona y categoría.
CREATE TABLE "HourWeek" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT,
    "number" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourWeek_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HourEntry" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT,
    "plannedHours" DOUBLE PRECISION NOT NULL,
    "doneHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'POR_HACER',
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HourWeek_semesterId_number_key" ON "HourWeek"("semesterId", "number");
CREATE INDEX "HourWeek_startDate_idx" ON "HourWeek"("startDate");
CREATE INDEX "HourEntry_weekId_idx" ON "HourEntry"("weekId");
CREATE INDEX "HourEntry_userId_idx" ON "HourEntry"("userId");
CREATE INDEX "HourEntry_projectId_idx" ON "HourEntry"("projectId");

ALTER TABLE "HourWeek" ADD CONSTRAINT "HourWeek_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "HourWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
