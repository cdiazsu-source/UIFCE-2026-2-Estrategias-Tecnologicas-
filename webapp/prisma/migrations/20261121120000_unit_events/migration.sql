-- Microtalleres y eventos de la Unidad, para llevar el histórico por año (menú «Microtalleres y eventos»).
-- Tabla nueva y aditiva: no toca datos existentes.

CREATE TABLE "UnitEvent" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'MICROTALLER',
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "modality" TEXT NOT NULL DEFAULT 'PRESENCIAL',
    "place" TEXT,
    "speaker" TEXT,
    "audience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANEADO',
    "registered" INTEGER,
    "attended" INTEGER,
    "link" TEXT,
    "projectId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UnitEvent_date_idx" ON "UnitEvent"("date");
