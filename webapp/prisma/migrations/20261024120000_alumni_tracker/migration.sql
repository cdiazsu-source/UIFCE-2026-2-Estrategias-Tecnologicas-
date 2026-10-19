-- Tracker de egresados: antiguos monitores de la UIFCE a los que se les sigue la pista (dónde trabajan hoy,
-- carrera de graduación y estado del contacto). Ver /egresados.
CREATE TABLE "Alumnus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cohort" TEXT,
    "area" TEXT,
    "degree" TEXT,
    "currentCompany" TEXT,
    "currentRole" TEXT,
    "linkedinUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POR_RASTREAR',
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alumnus_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Alumnus_status_idx" ON "Alumnus"("status");
