-- Actualizaciones/comentarios sobre un proyecto de estudio en particular
-- (preguntas, dificultades, descubrimientos de quien lo lleva; respuestas con
-- sugerencias de coordinación/máster). Un solo nivel de anidado, como TeamComment.
CREATE TABLE "StudyProjectComment" (
    "id" TEXT NOT NULL,
    "studyProjectId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorId" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyProjectComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyProjectComment_studyProjectId_idx" ON "StudyProjectComment"("studyProjectId");
CREATE INDEX "StudyProjectComment_authorId_idx" ON "StudyProjectComment"("authorId");
CREATE INDEX "StudyProjectComment_parentId_idx" ON "StudyProjectComment"("parentId");
CREATE INDEX "StudyProjectComment_createdAt_idx" ON "StudyProjectComment"("createdAt");

ALTER TABLE "StudyProjectComment"
  ADD CONSTRAINT "StudyProjectComment_studyProjectId_fkey"
  FOREIGN KEY ("studyProjectId") REFERENCES "StudyProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudyProjectComment"
  ADD CONSTRAINT "StudyProjectComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudyProjectComment"
  ADD CONSTRAINT "StudyProjectComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "StudyProjectComment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
