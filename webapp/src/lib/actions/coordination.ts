"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { defaultProjectIds, loadCoordination } from "@/lib/coordination-data";
import { loadProjectSummary, type ProjectSummary } from "@/lib/coordination-summary";
import {
  BLOCKER_MAX,
  DESIGN_IMAGES_MAX,
  DESIGN_NOTE_MAX,
  DESIGN_TITLE_MAX,
  MEETING_LABEL_MAX,
  SECTION_KEYS,
  type SectionKey,
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

const isSection = (v: string): v is SectionKey => (SECTION_KEYS as readonly string[]).includes(v);

/** Pasa una sección de «automática» a «personalizada»: guarda como filas la lista que tiene ahora y la marca. Si ya lo estaba, no hace nada. */
async function ensureCustomized(section: SectionKey): Promise<void> {
  const exists = await prisma.coordinationSection.findUnique({ where: { section } });
  if (exists) return;
  const ids = await defaultProjectIds(section);
  await prisma.$transaction([
    prisma.coordinationItem.createMany({ data: ids.map((projectId, order) => ({ section, projectId, order })), skipDuplicates: true }),
    prisma.coordinationSection.create({ data: { section } }),
  ]);
}

/** Agrega un proyecto a una sección de la presentación. */
export async function addSectionProject(section: string, projectId: string): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  if (!isSection(section)) return { ok: false, error: "Sección desconocida." };
  try {
    if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }))) return { ok: false, error: "El proyecto no existe." };
    await ensureCustomized(section);
    const last = await prisma.coordinationItem.findFirst({ where: { section }, orderBy: { order: "desc" }, select: { order: true } });
    await prisma.coordinationItem.createMany({ data: [{ section, projectId, order: (last?.order ?? -1) + 1 }], skipDuplicates: true });
  } catch {
    return { ok: false, error: NO_MIGRATION };
  }
  revalidatePath("/reunion");
  return { ok: true };
}

/** Quita un proyecto de una sección de la presentación (el proyecto no se borra). */
export async function removeSectionProject(section: string, projectId: string): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  if (!isSection(section)) return { ok: false, error: "Sección desconocida." };
  try {
    await ensureCustomized(section);
    await prisma.coordinationItem.deleteMany({ where: { section, projectId } });
  } catch {
    return { ok: false, error: NO_MIGRATION };
  }
  revalidatePath("/reunion");
  return { ok: true };
}

/** Vuelve una sección a su lista automática. */
export async function resetSection(section: string): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  if (!isSection(section)) return { ok: false, error: "Sección desconocida." };
  try {
    await prisma.$transaction([prisma.coordinationItem.deleteMany({ where: { section } }), prisma.coordinationSection.deleteMany({ where: { section } })]);
  } catch {
    return { ok: false, error: NO_MIGRATION };
  }
  revalidatePath("/reunion");
  return { ok: true };
}

/** Enlaza plantillas a un proyecto (en este orden): sus imágenes mini salen en la tarjeta del proyecto, en cualquier sección. */
export async function setProjectTemplates(projectId: string, templateIds: string[]): Promise<HoursResult> {
  if (!(await canUseDeveloper())) return NO_PERMISSION;
  const wanted = Array.from(new Set((Array.isArray(templateIds) ? templateIds : []).filter((t) => typeof t === "string"))).slice(0, 10);
  try {
    const found = await prisma.template.findMany({ where: { id: { in: wanted } }, select: { id: true } });
    const ok = new Set(found.map((t) => t.id));
    const clean = wanted.filter((t) => ok.has(t));
    await prisma.$transaction([
      prisma.projectTemplateLink.deleteMany({ where: { projectId } }),
      prisma.projectTemplateLink.createMany({ data: clean.map((templateId, order) => ({ projectId, templateId, order })) }),
    ]);
  } catch {
    return { ok: false, error: NO_MIGRATION };
  }
  revalidatePath("/reunion");
  return { ok: true };
}

export type ProjectSummaryResult = { ok: true; summary: ProjectSummary } | { ok: false; error: string };

/** Resumen de un proyecto para la presentación (lo más importante y sus plantillas asociadas). */
export async function getProjectSummary(projectId: string): Promise<ProjectSummaryResult> {
  if (!(await canUseDeveloper())) return { ok: false, error: "Solo el máster ve el resumen de la reunión." };
  try {
    const summary = await loadProjectSummary(projectId);
    return summary ? { ok: true, summary } : { ok: false, error: "No se encontró el proyecto." };
  } catch {
    return { ok: false, error: "No se pudo cargar el resumen del proyecto." };
  }
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
    const snapshot = { delivered: data.delivered, inProgress: data.inProgress, upcoming: data.upcoming, blockers: data.blockers ?? [], design: data.design };
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
