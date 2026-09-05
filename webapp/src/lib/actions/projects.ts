"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";
import { PRIORITY_TAGS, WIP_ATENCION_INMEDIATA } from "@/lib/utils";

const PRIORITY_VALUES = PRIORITY_TAGS as readonly string[];

/** Mensaje exacto que ve quien intenta un cuarto proyecto en «Atención Inmediata». */
const WIP_MESSAGE = "Límite de WIP alcanzado: Resuelve o reclasifica una tarea de Atención Inmediata actual.";

/** sourceOrder de los proyectos creados a mano: empieza alto para no chocar
 *  con el índice del CSV (0..N-1) que reescribe el seed en cada resync. */
const MANUAL_SOURCE_ORDER_BASE = 1000;

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createProject(formData: FormData) {
  if (await blockedForJunior()) return;
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!title || !category) return;

  const rawPriority = String(formData.get("priorityTag") ?? "").trim();
  const priorityTag = PRIORITY_VALUES.includes(rawPriority) ? rawPriority : null;
  const description = String(formData.get("description") ?? "").trim();
  const expectedOutcome = String(formData.get("expectedOutcome") ?? "").trim();
  const rationale = String(formData.get("rationale") ?? "").trim();

  // Semestre: el que se eligió, si no el vigente.
  const rawSemesterId = String(formData.get("semesterId") ?? "").trim();
  const semester = rawSemesterId
    ? await prisma.semester.findUnique({ where: { id: rawSemesterId }, select: { id: true } })
    : await prisma.semester.findFirst({ where: { isCurrent: true }, select: { id: true } });

  const base = slugify(title) || "proyecto";
  let id = base;
  for (let n = 2; await prisma.project.findUnique({ where: { id }, select: { id: true } }); n++) {
    id = `${base}-${n}`;
  }

  const top = await prisma.project.findFirst({
    orderBy: { sourceOrder: "desc" },
    select: { sourceOrder: true },
  });
  const sourceOrder = Math.max((top?.sourceOrder ?? 0) + 1, MANUAL_SOURCE_ORDER_BASE);

  await prisma.project.create({
    data: {
      id,
      category,
      priorityTag,
      title,
      description,
      expectedOutcome,
      rationale,
      isManual: true,
      sourceOrder,
      semesterId: semester?.id ?? null,
    },
  });

  revalidatePath("/");
  redirect(`/proyectos/${id}`);
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  if (await blockedForJunior()) return;
  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

/** Nombre de la primera persona asignada a `projectId` (por subtarea) que ya
 *  llegó al tope de proyectos activos en «❗ Atención Inmediata», o null si
 *  nadie lo alcanza. Un proyecto "activo" = estado distinto de COMPLETADO. */
export async function wipBlockedBy(projectId: string): Promise<string | null> {
  const items = await prisma.checklistItem.findMany({
    where: { projectId, assigneeId: { not: null } },
    select: { assigneeId: true },
  });
  const ids = [...new Set(items.map((i) => i.assigneeId).filter((x): x is string => !!x))];

  for (const id of ids) {
    const count = await prisma.project.count({
      where: {
        id: { not: projectId },
        priorityTag: "ATENCION_INMEDIATA",
        status: { not: "COMPLETADO" },
        checklistItems: { some: { assigneeId: id } },
      },
    });
    if (count >= WIP_ATENCION_INMEDIATA) {
      const u = await prisma.user.findUnique({ where: { id }, select: { name: true } });
      return u?.name ?? "Una persona del equipo";
    }
  }
  return null;
}

/** Cambia la etiqueta de urgencia. Bloqueado para el perfil junior. Si se
 *  intenta poner «❗ Atención Inmediata» y alguna persona asignada ya está en
 *  el límite WIP, no escribe y devuelve { error } para que la UI muestre la
 *  alerta. */
export async function updateProjectPriority(
  projectId: string,
  rawTag: string,
): Promise<UndoAction | { error: string } | void> {
  if (await blockedForJunior()) return;

  const tag = PRIORITY_VALUES.includes(rawTag) ? rawTag : null;
  const prev = await prisma.project.findUnique({
    where: { id: projectId },
    select: { priorityTag: true },
  });
  if (!prev || prev.priorityTag === tag) return;

  if (tag === "ATENCION_INMEDIATA") {
    const blockedBy = await wipBlockedBy(projectId);
    if (blockedBy) return { error: WIP_MESSAGE };
  }

  await prisma.project.update({ where: { id: projectId }, data: { priorityTag: tag } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return { kind: "project.priority", id: projectId, before: prev.priorityTag };
}

/** Edita los campos de contenido de cualquier proyecto. Si el proyecto viene
 *  del CSV, lo marca como editado en la app para que el resync deje de
 *  sobrescribir esos campos (ver Project.editedInApp). */
export async function updateProjectContent(
  projectId: string,
  formData: FormData,
): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.project.findUnique({ where: { id: projectId } });
  if (!prev) return;

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  // La urgencia (`priorityTag`) ya no se edita aquí: tiene su propio selector con
  // control de límite WIP (ver updateProjectPriority).

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(title.length > 0 ? { title } : {}),
      ...(category.length > 0 ? { category } : {}),
      description: String(formData.get("description") ?? "").trim(),
      expectedOutcome: String(formData.get("expectedOutcome") ?? "").trim(),
      rationale: String(formData.get("rationale") ?? "").trim(),
      editedInApp: true,
    },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return {
    kind: "project.content",
    id: projectId,
    before: {
      title: prev.title,
      category: prev.category,
      priorityTag: prev.priorityTag,
      description: prev.description,
      expectedOutcome: prev.expectedOutcome,
      rationale: prev.rationale,
      editedInApp: prev.editedInApp,
    },
  };
}

/** Reemplaza las etiquetas del proyecto (lista de textos ya normalizada). */
export async function updateProjectTags(
  projectId: string,
  tags: string[],
): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.project.findUnique({
    where: { id: projectId },
    select: { tags: true },
  });
  if (!prev) return;

  const clean = Array.from(
    new Set(tags.map((t) => t.trim()).filter((t) => t.length > 0 && t.length <= 40)),
  ).slice(0, 12);

  await prisma.project.update({ where: { id: projectId }, data: { tags: clean } });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return { kind: "project.tags", id: projectId, before: prev.tags };
}

/** Borra un proyecto creado a mano (y en cascada su checklist/notas). No debe
 *  usarse con proyectos del CSV: el próximo seed los recrearía. */
export async function deleteManualProject(projectId: string) {
  if (await blockedForJunior()) return;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { isManual: true },
  });
  if (!project?.isManual) return;

  await prisma.project.delete({ where: { id: projectId } });
  revalidatePath("/");
  redirect("/");
}

export async function updateProjectDriveLink(projectId: string, driveFolderUrl: string) {
  if (await blockedForJunior()) return;
  const trimmed = driveFolderUrl.trim();
  await prisma.project.update({
    where: { id: projectId },
    data: { driveFolderUrl: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(`/proyectos/${projectId}`);
}
