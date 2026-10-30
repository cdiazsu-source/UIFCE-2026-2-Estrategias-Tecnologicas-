"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { COMMITTEE_NAME_MAX, isCommitteeKind, parseBogotaLocal } from "@/lib/committees";
import type { HoursResult } from "@/lib/actions/hours";

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster programa los comités." };

/** Programa una reunión: nombre, fecha y hora (hora de Colombia) y tipo de comité. */
export async function createCommittee(formData: FormData): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const startsAt = parseBogotaLocal(String(formData.get("startsAt") ?? ""));
  if (!name) return { ok: false, error: "Escribe el nombre de la reunión." };
  if (name.length > COMMITTEE_NAME_MAX) return { ok: false, error: `El nombre admite hasta ${COMMITTEE_NAME_MAX} caracteres.` };
  if (!startsAt) return { ok: false, error: "Elige la fecha y la hora." };
  if (!isCommitteeKind(kind)) return { ok: false, error: "Elige el tipo de comité." };
  try {
    await prisma.managementCommittee.create({ data: { name, startsAt, kind } });
  } catch {
    return { ok: false, error: "No se pudo guardar. ¿Ya se aplicó la migración de Comités de Gestión (db:deploy)?" };
  }
  revalidatePath("/comites");
  return { ok: true };
}

/** Quita una reunión programada. */
export async function deleteCommittee(id: string): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  try {
    await prisma.managementCommittee.deleteMany({ where: { id } });
  } catch {
    return { ok: false, error: "No se pudo quitar la reunión." };
  }
  revalidatePath("/comites");
  return { ok: true };
}
