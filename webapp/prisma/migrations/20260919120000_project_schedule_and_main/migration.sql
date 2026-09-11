-- Horario de proyecto-evento (alimenta /horario) y "proyecto principal" para
-- colgar actividades de un evento (ej. cada actividad de la Semana UIFCE
-- cuelga del proyecto "Semana UIFCE").
ALTER TABLE "Project" ADD COLUMN "startAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "endAt" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN "location" TEXT;
ALTER TABLE "Project" ADD COLUMN "mainProjectId" TEXT;

ALTER TABLE "Project"
  ADD CONSTRAINT "Project_mainProjectId_fkey"
  FOREIGN KEY ("mainProjectId") REFERENCES "Project"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Project_mainProjectId_idx" ON "Project"("mainProjectId");
CREATE INDEX "Project_startAt_idx" ON "Project"("startAt");
