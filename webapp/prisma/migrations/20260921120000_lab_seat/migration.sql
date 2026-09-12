-- Nombre/etiqueta opcional de un equipo puntual de una sala de cómputo (ej.
-- "UIFCE-09"), para la disposición interactiva de Herramientas y licencias.
-- Solo existe fila cuando alguien nombra ese puesto.
CREATE TABLE "LabSeat" (
    "id" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabSeat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LabSeat_room_number_key" ON "LabSeat"("room", "number");
CREATE INDEX "LabSeat_room_idx" ON "LabSeat"("room");
