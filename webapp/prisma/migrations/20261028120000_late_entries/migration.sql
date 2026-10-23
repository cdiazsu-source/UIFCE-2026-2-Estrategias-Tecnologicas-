-- Tiempo tarde acumulado del equipo: tardanzas por persona y día (pestaña «Puntualidad» de /horas y capa de bienvenida).
CREATE TABLE "LateEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LateEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LateEntry_userId_date_idx" ON "LateEntry"("userId", "date");
CREATE INDEX "LateEntry_date_idx" ON "LateEntry"("date");

ALTER TABLE "LateEntry" ADD CONSTRAINT "LateEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
