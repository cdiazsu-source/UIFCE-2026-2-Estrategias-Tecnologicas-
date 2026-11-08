-- Equipos de las salas: códigos de la torre (inventario/placa y serie/CPU), software
-- pendiente de instalar, y observaciones/notas técnicas por equipo.
ALTER TABLE "LabSeat" ADD COLUMN "assetTag1" TEXT;
ALTER TABLE "LabSeat" ADD COLUMN "assetTag2" TEXT;
ALTER TABLE "LabSeat" ADD COLUMN "pending" TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE "LabSeatComment" (
    "id" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabSeatComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LabSeatComment_seatId_createdAt_idx" ON "LabSeatComment"("seatId", "createdAt");

ALTER TABLE "LabSeatComment" ADD CONSTRAINT "LabSeatComment_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "LabSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
