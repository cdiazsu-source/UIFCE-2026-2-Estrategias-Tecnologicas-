"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canManageHours } from "@/lib/session";
import { HOUR_AREA, HOUR_ROLES } from "@/lib/hours";
import { DEFAULT_BUILDING, SHIFT_MAX_MINUTES, SHIFT_MIN_MINUTES, SHIFT_STEP_MINUTES, isBuilding, isShiftCategory } from "@/lib/office-schedule";
import type { HoursResult } from "@/lib/actions/hours";

const PATH = "/horas";

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster puede configurar el horario." };
const fail = (error: string): HoursResult => ({ ok: false, error });

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Crea (`id` null) o actualiza un bloque del horario. «TEAM» en la persona = todo el equipo. */
export async function saveShift(id: string | null, formData: FormData): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;

  const day = Math.floor(Number(text(formData, "day")));
  const start = Math.floor(Number(text(formData, "start")));
  const end = Math.floor(Number(text(formData, "end")));
  const category = text(formData, "category");
  const who = text(formData, "userId");
  if (!Number.isFinite(day) || day < 1 || day > 6) return fail("Elige un día de lunes a sábado.");
  const validTime = (m: number) => Number.isFinite(m) && m >= SHIFT_MIN_MINUTES && m <= SHIFT_MAX_MINUTES && m % SHIFT_STEP_MINUTES === 0;
  if (!validTime(start) || !validTime(end)) return fail("Elige una hora de inicio y una de fin.");
  if (end <= start) return fail("La hora de fin debe ser posterior a la de inicio.");
  if (!isShiftCategory(category)) return fail("Elige el tipo de bloque.");

  let userId: string | null = null;
  if (who && who !== "TEAM") {
    const person = await prisma.user.findFirst({ where: { id: who, active: true, area: HOUR_AREA, role: { in: [...HOUR_ROLES] } }, select: { id: true } });
    if (!person) return fail("Esa persona no está en el horario.");
    userId = person.id;
  }
  const label = text(formData, "label").slice(0, 80) || null;
  const location = text(formData, "location") || DEFAULT_BUILDING;
  if (!isBuilding(location)) return fail("Elige el edificio.");
  const data = { userId, dayOfWeek: day, startMinutes: start, endMinutes: end, category, label, location };

  if (id) await prisma.officeShift.updateMany({ where: { id }, data });
  else await prisma.officeShift.create({ data });
  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteShift(id: string): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  await prisma.officeShift.deleteMany({ where: { id } });
  revalidatePath(PATH);
  return { ok: true };
}
