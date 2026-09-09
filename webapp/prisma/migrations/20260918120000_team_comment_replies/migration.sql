-- Respuestas a comentarios del equipo: una fila de TeamComment puede colgar de
-- otra. Un solo nivel de anidado (la app cuelga las respuestas del comentario
-- raíz). Al borrar el padre, sus respuestas quedan como comentarios sueltos.
ALTER TABLE "TeamComment" ADD COLUMN "parentId" TEXT;

ALTER TABLE "TeamComment"
  ADD CONSTRAINT "TeamComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "TeamComment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "TeamComment_parentId_idx" ON "TeamComment"("parentId");
