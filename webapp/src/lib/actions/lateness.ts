"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canManageHours } from "@/lib/session";
import { HOUR_AREA, HOUR_ROLES } from "@/lib/hours";
import { LATE_MAX_MINUTES, LATE_NOTE_MAX } from "@/lib/lateness";
import { bogotaDateKey } from "@/lib/utils";
import type { HoursResult } from "@/lib/actions/hours";

const PATH = "/horas";

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster registra la puntualidad." };
const fail = (error: string): HoursResult => ({ ok: false, error });

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Registra una tardanza: la persona, el día y los minutos que llegó tarde. */
export async function addLate(formData: FormData): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;

  const userId = text(formData, "userId");
  const day = text(formData, "date");
  const minutes = Math.floor(Number(text(formData, "minutes")));
  const note = text(formData, "note").slice(0, LATE_NOTE_MAX) || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(new Date(`${day}T00:00:00Z`).getTime())) return fail("Elige el día de la tardanza.");
  if (day > bogotaDateKey(new Date())) return fail("El día no puede ser futuro.");
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > LATE_MAX_MINUTES) return fail(`Escribe los minutos de tardanza (de 1 a ${LATE_MAX_MINUTES}).`);
  const person = await prisma.user.findFirst({ where: { id: userId, active: true, area: HOUR_AREA, role: { in: [...HOUR_ROLES] } }, select: { id: true } });
  if (!person) return fail("Elige una persona del equipo.");

  await prisma.lateEntry.create({ data: { userId: person.id, date: new Date(`${day}T00:00:00Z`), minutes, note } });
  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteLate(id: string): Promise<HoursResult> {
  if (!(await canManageHours())) return NO_PERMISSION;
  await prisma.lateEntry.deleteMany({ where: { id } });
  revalidatePath(PATH);
  return { ok: true };
}
