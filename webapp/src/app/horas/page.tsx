import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { HoursBoard, type HourPerson } from "@/components/hours-board";
import { HoursTabs } from "@/components/hours-tabs";
import { NowCard, ScheduleBoard } from "@/components/schedule-board";
import { isShiftCategory, type ShiftData } from "@/lib/office-schedule";
import { canManageHours, getSession } from "@/lib/session";
import { CL_COURSE_WEEKLY_HOURS, GC_WEEKLY_HOURS, HOUR_AREA, PE_WEEKLY_HOURS, PI_WEEKLY_HOURS, HOUR_ROLES, WEEKLY_HOURS_TARGET, fmtHours, type HourCategory, type HourEntryData, type HourStatus } from "@/lib/hours";

export const dynamic = "force-dynamic";

export default async function HorasPage({ searchParams }: { searchParams: { vista?: string } }) {
  const [semester, session, manage] = await Promise.all([
    prisma.semester.findFirst({ where: { isCurrent: true }, select: { id: true, label: true } }),
    getSession(),
    canManageHours(),
  ]);

  const [weeks, users, projects, shiftRows] = await Promise.all([
    prisma.hourWeek.findMany({
      where: { semesterId: semester?.id ?? null },
      orderBy: { number: "asc" },
      include: { entries: { include: { project: { select: { id: true, title: true } } }, orderBy: { createdAt: "asc" } } },
    }),
    prisma.user.findMany({
      where: { active: true, area: HOUR_AREA, role: { in: [...HOUR_ROLES] } },
      select: { id: true, name: true, role: true, photoUrl: true, color: true, credentialKey: true },
    }),
    prisma.project.findMany({ where: { status: { not: "COMPLETADO" } }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.officeShift.findMany({ orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] }),
  ]);

  const shifts: ShiftData[] = shiftRows
    .filter((s) => isShiftCategory(s.category))
    .map((s) => ({ id: s.id, userId: s.userId, day: s.dayOfWeek, start: s.startMinutes, end: s.endMinutes, category: s.category as ShiftData["category"], label: s.label, location: s.location }));

  // El máster primero, luego los monitores Junior por nombre; quien está viendo su propia página, de primero.
  const order = (r: string) => HOUR_ROLES.indexOf(r as (typeof HOUR_ROLES)[number]);
  const myKey = session.authed ? session.juniorKey : null;
  const people: HourPerson[] = users
    .map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      photoUrl: u.photoUrl,
      color: u.color,
      isMe: myKey !== null && u.credentialKey === myKey,
    }))
    .sort((a, b) => Number(b.isMe) - Number(a.isMe) || order(a.role) - order(b.role) || a.name.localeCompare(b.name, "es"));

  const entries: HourEntryData[] = weeks.flatMap((w) =>
    w.entries.map((e) => ({
      id: e.id,
      weekId: e.weekId,
      userId: e.userId,
      category: e.category as HourCategory,
      title: e.title,
      planned: e.plannedHours,
      done: e.doneHours,
      status: e.status as HourStatus,
      project: e.project,
    })),
  );

  // Cada Junior ve solo lo suyo (su contador, sus horas y su horario, más los bloques de todo el equipo, como el GC). Se
  // filtra aquí, en el servidor: los datos de los demás ni siquiera llegan a su navegador.
  const personal = myKey !== null;
  const shownPeople = personal ? people.filter((p) => p.isMe) : people;
  const shownIds = new Set(shownPeople.map((p) => p.id));
  const shownEntries = personal ? entries.filter((e) => shownIds.has(e.userId)) : entries;
  const shownShifts = personal ? shifts.filter((s) => s.userId === null || shownIds.has(s.userId)) : shifts;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          {personal ? "Mis horas y mi horario" : "Horas del equipo"}
          <InfoHint
            text={`Control de horas semanales del máster y de los monitores Junior. Cada persona tiene una meta de ${WEEKLY_HOURS_TARGET} horas por semana, ${fmtHours(GC_WEEKLY_HOURS)} de ellas de Gestión del Conocimiento (GC); cada Junior tiene además ${fmtHours(PE_WEEKLY_HOURS)} h de su proyecto de estudio (PE) y ${fmtHours(PI_WEEKLY_HOURS)} h de punto de información (PI); el resto se reparte entre proyectos, apoyos académicos y cursos libres (quien dicta un curso libre dedica ${fmtHours(CL_COURSE_WEEKLY_HOURS)} h semanales mientras dura, y salen de las de proyectos). GC es la capacitación interna fija de 2 a 4 pm, en la que se capacita todo el equipo. Cómo se usa: elige la semana, planea las horas de cada persona por categoría con «Agregar horas» y, al cerrar la semana, anota las horas hechas o marca cada registro como terminado. El contador de cada persona compara lo planeado y lo hecho contra la meta; «Estadísticas» resume por semana, por mes o por todo el semestre. «Copiar a la semana siguiente» repite el plan. Solo el máster registra; los demás consultan. La pestaña «Horario de oficina» muestra dónde está cada persona de lunes a sábado; el máster lo configura con «Editar horario».`}
          />
        </h1>
        <p className="text-sm text-muted-foreground">
          Meta de {WEEKLY_HOURS_TARGET} h semanales por persona: {fmtHours(GC_WEEKLY_HOURS)} de GC y, los Junior, {fmtHours(PE_WEEKLY_HOURS)} de PE y {fmtHours(PI_WEEKLY_HOURS)} de PI
          {semester ? ` · semestre ${semester.label}` : ""}.
        </p>
      </div>
      {personal && <NowCard shifts={shownShifts} />}
      <HoursTabs
        initial={searchParams.vista === "horario" ? "horario" : "horas"}
        hours={
          <HoursBoard
            canManage={manage}
            people={shownPeople}
            personal={personal}
            projects={projects}
            weeks={weeks.map((w) => ({ id: w.id, number: w.number, startDate: w.startDate.toISOString(), endDate: w.endDate.toISOString() }))}
            entries={shownEntries}
          />
        }
        schedule={<ScheduleBoard canManage={manage} people={shownPeople} shifts={shownShifts} personal={personal} />}
      />
    </div>
  );
}
