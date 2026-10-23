"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { BLOCKER_MAX } from "@/lib/coordination";
import type { HoursResult } from "@/lib/actions/hours";

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster edita los bloqueos." };

/** Agrega un bloqueo al final de la lista. */
export async function addBlocker(formData: FormData): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { ok: false, error: "Escribe el bloqueo." };
  if (text.length > BLOCKER_MAX) return { ok: false, error: `El bloqueo admite hasta ${BLOCKER_MAX} caracteres.` };
  try {
    const last = await prisma.coordinationBlocker.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    await prisma.coordinationBlocker.create({ data: { text, order: (last?.order ?? -1) + 1 } });
  } catch {
    return { ok: false, error: "No se pudo guardar. ¿Ya se aplicó la migración de bloqueos (db:deploy)?" };
  }
  revalidatePath("/reunion");
  return { ok: true };
}

/** Quita un bloqueo (ya resuelto o que no se presenta). */
export async function deleteBlocker(id: string): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  try {
    await prisma.coordinationBlocker.deleteMany({ where: { id } });
  } catch {
    return { ok: false, error: "No se pudo quitar el bloqueo." };
  }
  revalidatePath("/reunion");
  return { ok: true };
}
