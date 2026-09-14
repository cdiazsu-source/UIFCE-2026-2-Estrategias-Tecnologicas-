import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { CalendarPanel, type CalendarItem } from "@/components/calendar-panel";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const [projects, deadlines, events] = await Promise.all([
    prisma.project.findMany({
      where: { startAt: { not: null } },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        startAt: true,
        endAt: true,
        location: true,
        mainProject: { select: { title: true } },
      },
    }),
    prisma.checklistItem.findMany({
      where: { dueDate: { not: null } },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        text: true,
        done: true,
        dueDate: true,
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.calendarEvent.findMany({
      orderBy: { startAt: "asc" },
      select: { id: true, title: true, description: true, startAt: true, endAt: true, location: true },
    }),
  ]);

  const items: CalendarItem[] = [
    ...projects.map(
      (p): CalendarItem => ({
        kind: "project",
        id: p.id,
        title: p.title,
        status: p.status,
        startAt: p.startAt!.toISOString(),
        endAt: p.endAt?.toISOString() ?? null,
        location: p.location,
        mainProjectTitle: p.mainProject?.title ?? null,
      }),
    ),
    ...deadlines.map(
      (c): CalendarItem => ({
        kind: "deadline",
        id: c.id,
        text: c.text,
        done: c.done,
        startAt: c.dueDate!.toISOString(),
        projectId: c.project.id,
        projectTitle: c.project.title,
      }),
    ),
    ...events.map(
      (e): CalendarItem => ({
        kind: "event",
        id: e.id,
        title: e.title,
        description: e.description,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt?.toISOString() ?? null,
        location: e.location,
      }),
    ),
  ].sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Calendario
          <InfoHint text="Todo lo que tiene fecha, en un solo lugar y en orden: horario de eventos/proyectos, fechas límite de subtareas y eventos propios del calendario (sin proyecto). Cómo se usa: el horario de un proyecto se agrega desde su ficha con «+ Agregar horario»; las fechas límite se ponen al editar una subtarea; «Nuevo evento» crea uno independiente (reunión, trámite…) con su propio lápiz y papelera. Ejemplo: «Semana UIFCE · 9:00 – 11:00 a. m. · Auditorio»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Horario de proyectos, fechas límite de subtareas y eventos propios, todo en orden cronológico.
        </p>
      </div>
      <CalendarPanel items={items} />
    </div>
  );
}
