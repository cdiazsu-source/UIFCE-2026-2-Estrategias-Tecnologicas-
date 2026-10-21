-- Horario semanal de oficina (/horas → «Horario»): bloques por persona (o todo el equipo) de lunes a sábado.
CREATE TABLE "OfficeShift" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "location" TEXT NOT NULL DEFAULT '310',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeShift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfficeShift_dayOfWeek_idx" ON "OfficeShift"("dayOfWeek");
CREATE INDEX "OfficeShift_userId_idx" ON "OfficeShift"("userId");

ALTER TABLE "OfficeShift" ADD CONSTRAINT "OfficeShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
