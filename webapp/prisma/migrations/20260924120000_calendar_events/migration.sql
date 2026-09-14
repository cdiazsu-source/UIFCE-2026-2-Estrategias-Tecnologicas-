-- Módulo "Calendario" (/calendario, evolución de "Horario"): eventos que no
-- son (ni forman parte de) un proyecto del portafolio, ej. una reunión o un
-- trámite puntual. El Calendario los combina con los proyectos que ya tienen
-- horario (Project.startAt) y con las subtareas con fecha límite
-- (ChecklistItem.dueDate).
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");
