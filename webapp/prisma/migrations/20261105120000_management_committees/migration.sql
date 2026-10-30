-- Comités de Gestión: reuniones de coordinación y de dirección programadas por el máster.
CREATE TABLE "ManagementCommittee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagementCommittee_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManagementCommittee_startsAt_idx" ON "ManagementCommittee"("startsAt");

-- Ejemplo inicial: Reunión de dirección 2, 30 de octubre de 2026 (08:00, hora de Colombia).
INSERT INTO "ManagementCommittee" ("id", "name", "startsAt", "kind")
VALUES ('comite_direccion_2', 'Reunión de dirección 2', '2026-10-30 13:00:00', 'DIRECCION');
