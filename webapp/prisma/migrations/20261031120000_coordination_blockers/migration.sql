-- Bloqueos de la pantalla «Reunión coordinación» (solo el máster los edita).
CREATE TABLE "CoordinationBlocker" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinationBlocker_pkey" PRIMARY KEY ("id")
);

-- Primer bloqueo a presentar.
INSERT INTO "CoordinationBlocker" ("id", "text", "order") VALUES ('bloqueo-tv-entre-salas', 'Daño en el televisor entre salas (no lee las memorias).', 0);
