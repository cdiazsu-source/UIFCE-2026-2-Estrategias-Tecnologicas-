"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canManageHours } from "@/lib/session";
import { addDays, isHourCategory, isHourStatus, parseHours, HOUR_AREA, HOUR_ROLES, type HourCategory, type HourStatus } from "@/lib/hours";

const PATH = "/horas";

/** Resultado de una acción: el formulario muestra el motivo si algo se rechaza. */
export type HoursResult = { ok: true } | { ok: false; error: string };

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster puede planear y registrar horas." };
const done: HoursResult = { ok: true };
const fail = (error: string): HoursResult => ({ ok: false, error });

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** «YYYY-MM-DD» -> medianoche UTC (las fechas "solo día" se guardan así, ver lib/utils.ts). */
function dayInput(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function currentSemesterId(): Promise<string | null> {
  const s = await prisma.semester.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return s?.id ?? null;
}

/** Crea una semana, o varias seguidas (la segunda empieza 7 días después de la primera, y así): al arrancar el semestre se
 *  crean todas de una vez. */
export async function addWeeks(formData: FormData): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;

  const number = Math.floor(Number(text(formData, "number")));
  const start = dayInput(text(formData, "startDate"));
  const end = dayInput(text(formData, "endDate"));
  const count = Math.floor(Number(text(formData, "count") || "1"));
  if (!Number.isFinite(number) || number < 1 || number > 60) return fail("El número de semana debe estar entre 1 y 60.");
  if (!start || !end) return fail("Indica la fecha de inicio y la de fin.");
  if (end < start) return fail("La fecha de fin no puede ser anterior a la de inicio.");
  if (!Number.isFinite(count) || count < 1 || count > 30) return fail("Cantidad de semanas: entre 1 y 30.");

  const semesterId = await currentSemesterId();
  const existing = await prisma.hourWeek.findMany({ where: { semesterId }, select: { number: true } });
  const taken = new Set(existing.map((w) => w.number));
  const rows = Array.from({ length: count }, (_, i) => ({
    semesterId,
    number: number + i,
    startDate: new Date(start.getTime() + i * 7 * 86400000),
    endDate: new Date(end.getTime() + i * 7 * 86400000),
  }));
  const clash = rows.find((r) => taken.has(r.number));
  if (clash) return fail(`La semana ${clash.number} ya existe.`);

  await prisma.hourWeek.createMany({ data: rows });
  revalidatePath(PATH);
  return done;
}

export async function updateWeek(id: string, formData: FormData): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  const number = Math.floor(Number(text(formData, "number")));
  const start = dayInput(text(formData, "startDate"));
  const end = dayInput(text(formData, "endDate"));
  if (!Number.isFinite(number) || number < 1 || number > 60) return fail("El número de semana debe estar entre 1 y 60.");
  if (!start || !end) return fail("Indica la fecha de inicio y la de fin.");
  if (end < start) return fail("La fecha de fin no puede ser anterior a la de inicio.");

  const week = await prisma.hourWeek.findUnique({ where: { id }, select: { semesterId: true } });
  if (!week) return fail("Esa semana ya no existe.");
  const clash = await prisma.hourWeek.findFirst({ where: { semesterId: week.semesterId, number, NOT: { id } }, select: { id: true } });
  if (clash) return fail(`La semana ${number} ya existe.`);

  await prisma.hourWeek.update({ where: { id }, data: { number, startDate: start, endDate: end } });
  revalidatePath(PATH);
  return done;
}

export async function deleteWeek(id: string): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  await prisma.hourWeek.deleteMany({ where: { id } });
  revalidatePath(PATH);
  return done;
}

/** Copia el plan de una semana a la siguiente (mismo número + 1, fechas + 7 días): las horas planeadas pasan, lo hecho
 *  vuelve a cero y todo queda «Por hacer». El plan suele repetirse de una semana a otra. */
export async function duplicateWeek(id: string): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  const week = await prisma.hourWeek.findUnique({ where: { id }, include: { entries: true } });
  if (!week) return fail("Esa semana ya no existe.");

  const number = week.number + 1;
  const taken = await prisma.hourWeek.findFirst({ where: { semesterId: week.semesterId, number }, select: { id: true } });
  if (taken) return fail(`La semana ${number} ya existe: copia el plan desde ahí o bórrala antes.`);

  await prisma.hourWeek.create({
    data: {
      semesterId: week.semesterId,
      number,
      startDate: new Date(addDays(week.startDate.toISOString(), 7)),
      endDate: new Date(addDays(week.endDate.toISOString(), 7)),
      entries: {
        create: week.entries.map((e) => ({
          userId: e.userId,
          category: e.category,
          title: e.title,
          plannedHours: e.plannedHours,
          projectId: e.projectId,
        })),
      },
    },
  });
  revalidatePath(PATH);
  return done;
}

type EntryData = { category: HourCategory; title: string | null; plannedHours: number; doneHours: number; status: HourStatus; projectId: string | null };

/** Lee y valida el formulario de un registro de horas. */
async function parseEntry(formData: FormData): Promise<{ error: string } | { error?: undefined; data: EntryData }> {
  const category = text(formData, "category");
  const planned = parseHours(text(formData, "plannedHours"));
  const doneHours = parseHours(text(formData, "doneHours") || "0");
  const status = text(formData, "status") || "POR_HACER";
  if (!isHourCategory(category)) return { error: "Elige una categoría." };
  if (planned === null || planned <= 0) return { error: "Las horas planeadas deben ser mayores que 0 (puedes usar 0,5)." };
  if (doneHours === null) return { error: "Las horas hechas no son válidas." };
  if (!isHourStatus(status)) return { error: "Estado no válido." };

  const projectId = text(formData, "projectId");
  const project = category === "PROYECTO" && projectId ? await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }) : null;
  const title = text(formData, "title").slice(0, 200) || null;
  // Terminada sin horas anotadas: se dan por hechas las planeadas.
  const finalDone = status === "TERMINADA" && doneHours === 0 ? planned : doneHours;
  return {
    data: {
      category,
      title,
      plannedHours: planned,
      doneHours: finalDone,
      status,
      projectId: project?.id ?? null,
    },
  };
}

export async function addEntry(weekId: string, userId: string, formData: FormData): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  const [week, person] = await Promise.all([
    prisma.hourWeek.findUnique({ where: { id: weekId }, select: { id: true } }),
    prisma.user.findFirst({ where: { id: userId, active: true, area: HOUR_AREA, role: { in: [...HOUR_ROLES] } }, select: { id: true } }),
  ]);
  if (!week) return fail("Esa semana ya no existe.");
  if (!person) return fail("Esa persona no registra horas.");

  const parsed = await parseEntry(formData);
  if (parsed.error !== undefined) return fail(parsed.error);
  if (!parsed.data.title && !parsed.data.projectId && parsed.data.category !== "GESTION_CONOCIMIENTO") {
    return fail("Escribe en qué se usan las horas (o elige el proyecto).");
  }
  await prisma.hourEntry.create({ data: { weekId, userId, ...parsed.data } });
  revalidatePath(PATH);
  return done;
}

export async function updateEntry(id: string, formData: FormData): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  const parsed = await parseEntry(formData);
  if (parsed.error !== undefined) return fail(parsed.error);
  if (!parsed.data.title && !parsed.data.projectId && parsed.data.category !== "GESTION_CONOCIMIENTO") {
    return fail("Escribe en qué se usan las horas (o elige el proyecto).");
  }
  await prisma.hourEntry.updateMany({ where: { id }, data: parsed.data });
  revalidatePath(PATH);
  return done;
}

/** Cambio rápido de estado desde la tabla. Al terminar sin horas anotadas se dan por hechas las planeadas. */
export async function setEntryStatus(id: string, status: string): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  if (!isHourStatus(status)) return fail("Estado no válido.");
  const entry = await prisma.hourEntry.findUnique({ where: { id }, select: { plannedHours: true, doneHours: true } });
  if (!entry) return fail("Ese registro ya no existe.");
  await prisma.hourEntry.update({
    where: { id },
    data: { status, ...(status === "TERMINADA" && entry.doneHours === 0 ? { doneHours: entry.plannedHours } : {}) },
  });
  revalidatePath(PATH);
  return done;
}

export async function deleteEntry(id: string): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  await prisma.hourEntry.deleteMany({ where: { id } });
  revalidatePath(PATH);
  return done;
}
