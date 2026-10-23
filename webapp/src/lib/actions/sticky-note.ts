"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canPostSticky } from "@/lib/session";
import { STICKY_ID, STICKY_MAX, isStickyColor } from "@/lib/sticky-note";
import type { HoursResult } from "@/lib/actions/hours";

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster deja el post-it." };

/** Publica (o reemplaza) el post-it para los Junior. Hay una sola nota vigente. */
export async function saveSticky(formData: FormData): Promise<HoursResult> {
  if (!(await canPostSticky())) return NO_PERMISSION;
  const body = String(formData.get("body") ?? "").trim();
  const color = String(formData.get("color") ?? "AMARILLO");
  if (!body) return { ok: false, error: "Escribe la nota." };
  if (body.length > STICKY_MAX) return { ok: false, error: `La nota admite hasta ${STICKY_MAX} caracteres.` };
  if (!isStickyColor(color)) return { ok: false, error: "Elige un color." };

  const master = await prisma.user.findFirst({ where: { role: "MASTER", area: "ET", active: true }, orderBy: { name: "asc" }, select: { name: true } });
  const author = master?.name.split(" ")[0] ?? "Máster";
  await prisma.stickyNote.upsert({
    where: { id: STICKY_ID },
    create: { id: STICKY_ID, body, color, author, active: true },
    update: { body, color, author, active: true },
  });
  revalidatePath("/");
  return { ok: true };
}

/** Retira el post-it: deja de aparecerles a los Junior. */
export async function clearSticky(): Promise<HoursResult> {
  if (!(await canPostSticky())) return NO_PERMISSION;
  await prisma.stickyNote.updateMany({ where: { id: STICKY_ID }, data: { active: false } });
  revalidatePath("/");
  return { ok: true };
}
