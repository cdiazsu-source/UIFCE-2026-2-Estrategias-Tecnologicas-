-- Aliados académicos: profesores que han pedido Apoyos Académicos, sus asignaturas y sesiones, notas de contacto y el seguimiento
-- de la convocatoria a eventos. Los profesores y sus apoyos se cargan después con scripts/load-aliados-academicos.mjs.
CREATE TABLE "AcademicAlly" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicAlly_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicAlly_name_key" ON "AcademicAlly"("name");

CREATE TABLE "AcademicAllySupport" (
    "id" TEXT NOT NULL,
    "allyId" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "mallaCourse" TEXT,
    "sessions" JSONB NOT NULL,
    "software" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "states" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicAllySupport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicAllySupport_allyId_course_program_key" ON "AcademicAllySupport"("allyId", "course", "program");

CREATE TABLE "AcademicAllyNote" (
    "id" TEXT NOT NULL,
    "allyId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicAllyNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcademicAllyNote_allyId_createdAt_idx" ON "AcademicAllyNote"("allyId", "createdAt");

CREATE TABLE "ConvocationEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "semFrom" INTEGER NOT NULL DEFAULT 1,
    "semTo" INTEGER NOT NULL DEFAULT 10,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventDate" TIMESTAMP(3),
    "notes" TEXT,
    "projectId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConvocationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConvocationFollowUp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "allyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POR_CONTACTAR',
    "ask" TEXT,
    "note" TEXT,
    "contactedAt" TIMESTAMP(3),
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConvocationFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConvocationFollowUp_eventId_allyId_key" ON "ConvocationFollowUp"("eventId", "allyId");

ALTER TABLE "AcademicAllySupport" ADD CONSTRAINT "AcademicAllySupport_allyId_fkey" FOREIGN KEY ("allyId") REFERENCES "AcademicAlly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicAllyNote" ADD CONSTRAINT "AcademicAllyNote_allyId_fkey" FOREIGN KEY ("allyId") REFERENCES "AcademicAlly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConvocationFollowUp" ADD CONSTRAINT "ConvocationFollowUp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ConvocationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConvocationFollowUp" ADD CONSTRAINT "ConvocationFollowUp_allyId_fkey" FOREIGN KEY ("allyId") REFERENCES "AcademicAlly"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Eventos iniciales para convocar, abiertos a los tres programas y a los diez semestres; se ajustan desde /aliados.
INSERT INTO "ConvocationEvent" ("id", "name", "programs", "semFrom", "semTo", "topics", "projectId", "order", "updatedAt") VALUES
  ('conv_semana_uifce', 'Semana UIFCE', ARRAY['economia','administracion','contaduria'], 1, 10, ARRAY[]::TEXT[], 'eventos-semana-uifce', 1, CURRENT_TIMESTAMP),
  ('conv_microtalleres', 'Microtalleres UIFCE', ARRAY['economia','administracion','contaduria'], 1, 10, ARRAY[]::TEXT[], 'eventos-microtalleres', 2, CURRENT_TIMESTAMP),
  ('conv_hackaton', 'Concurso/Hackatón', ARRAY['economia','administracion','contaduria'], 1, 10, ARRAY[]::TEXT[], NULL, 3, CURRENT_TIMESTAMP);
