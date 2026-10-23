"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canPostSticky } from "@/lib/session";
import { STICKY_ID, STICKY_MAX, isStickyColor } from "@/lib/sticky-note";
import { JUNIOR_PROFILES, isJuniorWho } from "@/lib/view-profiles";
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

  // Destinatarios: ninguno o todos los perfiles Junior = para todos (sin filas); si no, solo los elegidos.
  const picked = Array.from(new Set(formData.getAll("to").map(String))).filter(isJuniorWho);
  const targeted = picked.length > 0 && picked.length < Object.keys(JUNIOR_PROFILES).length ? picked : [];
  try {
    await prisma.$transaction([prisma.stickyRecipient.deleteMany(), prisma.stickyRecipient.createMany({ data: targeted.map((profileKey) => ({ profileKey })) })]);
  } catch {
    // Tabla nueva: sin la migración solo se puede publicar para todos.
    if (targeted.length > 0) return { ok: false, error: "Falta aplicar la migración de destinatarios (db:deploy) para elegir a quién va." };
  }

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
