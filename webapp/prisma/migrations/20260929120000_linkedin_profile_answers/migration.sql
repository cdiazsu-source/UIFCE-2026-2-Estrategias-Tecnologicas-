-- Plantilla de preguntas para armar el perfil de LinkedIn: una fila por
-- persona (LinkedInTrackee) y pregunta, guardada pregunta por pregunta.
CREATE TABLE "LinkedInProfileAnswer" (
    "id" TEXT NOT NULL,
    "trackeeId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedInProfileAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LinkedInProfileAnswer_trackeeId_questionKey_key" ON "LinkedInProfileAnswer"("trackeeId", "questionKey");

CREATE INDEX "LinkedInProfileAnswer_trackeeId_idx" ON "LinkedInProfileAnswer"("trackeeId");

ALTER TABLE "LinkedInProfileAnswer" ADD CONSTRAINT "LinkedInProfileAnswer_trackeeId_fkey" FOREIGN KEY ("trackeeId") REFERENCES "LinkedInTrackee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
