"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { loadCoordination } from "@/lib/coordination-data";
import {
  BLOCKER_MAX,
  DESIGN_IMAGES_MAX,
  DESIGN_NOTE_MAX,
  DESIGN_TITLE_MAX,
  MEETING_LABEL_MAX,
  isImageLayout,
  isSlideKey,
  type DesignImage,
} from "@/lib/coordination";
import type { HoursResult } from "@/lib/actions/hours";

const NO_PERMISSION: HoursResult = { ok: false, error: "Solo el máster edita la reunión de coordinación." };
const NO_MIGRATION = "No se pudo guardar. ¿Ya se aplicó la migración de la reunión (db:deploy)?";

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
    return { ok: false, error: NO_MIGRATION };
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

/** Modo diseño: título, nota e imágenes (de plantillas) de una página. */
export async function saveDesign(key: string, input: { title: string; note: string; images: DesignImage[] }): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  if (!isSlideKey(key)) return { ok: false, error: "Página desconocida." };
  const title = String(input.title ?? "").trim();
  const note = String(input.note ?? "").trim();
  if (title.length > DESIGN_TITLE_MAX) return { ok: false, error: `El título admite hasta ${DESIGN_TITLE_MAX} caracteres.` };
  if (note.length > DESIGN_NOTE_MAX) return { ok: false, error: `La nota admite hasta ${DESIGN_NOTE_MAX} caracteres.` };
  const raw = Array.isArray(input.images) ? input.images.slice(0, DESIGN_IMAGES_MAX) : [];
  const images: DesignImage[] = raw
    .filter((i) => i && typeof i.templateId === "string" && i.templateId)
    .map((i) => ({ templateId: i.templateId, layout: isImageLayout(String(i.layout)) ? i.layout : "ancho", caption: String(i.caption ?? "").trim().slice(0, 120) }));
  try {
    // Solo se aceptan plantillas que existan.
    const found = await prisma.template.findMany({ where: { id: { in: images.map((i) => i.templateId) } }, select: { id: true } });
    const ok = new Set(found.map((t) => t.id));
    const clean = images.filter((i) => ok.has(i.templateId));
    await prisma.coordinationPage.upsert({
      where: { key },
      create: { key, title: title || null, note: note || null, images: clean },
      update: { title: title || null, note: note || null, images: clean },
    });
  } catch {
    return { ok: false, error: NO_MIGRATION };
  }
  revalidatePath("/reunion");
  return { ok: true };
}

export type SaveMeetingResult = { ok: true; id: string } | { ok: false; error: string };

/** Guarda la reunión con su fecha: congela lo que se presenta (proyectos, bloqueos, diseño) para consultarlo después. */
export async function saveMeeting(dateStr: string, label: string): Promise<SaveMeetingResult> {
  if (!(await canUseDeveloper())) return { ok: false, error: NO_PERMISSION.ok ? "" : NO_PERMISSION.error };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { ok: false, error: "Elige la fecha de la reunión." };
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return { ok: false, error: "La fecha no es válida." };
  const name = String(label ?? "").trim().slice(0, MEETING_LABEL_MAX);
  try {
    const data = await loadCoordination();
    const snapshot = { delivered: data.delivered, upcoming: data.upcoming, blockers: data.blockers ?? [], design: data.design };
    const m = await prisma.coordinationMeeting.create({ data: { date, label: name || null, snapshot } });
    revalidatePath("/reunion");
    return { ok: true, id: m.id };
  } catch {
    return { ok: false, error: NO_MIGRATION };
  }
}

/** Borra una reunión guardada (por ejemplo, una prueba). */
export async function deleteMeeting(id: string): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  try {
    await prisma.coordinationMeeting.deleteMany({ where: { id } });
  } catch {
    return { ok: false, error: "No se pudo borrar la reunión." };
  }
  revalidatePath("/reunion");
  return { ok: true };
}
