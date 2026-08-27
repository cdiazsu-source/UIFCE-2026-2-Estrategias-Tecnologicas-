"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

const PRIORITY_TAGS = ["CRÍTICO", "PRIORITARIO", "NUEVO"];

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
  const priorityTag = PRIORITY_TAGS.includes(rawPriority) ? rawPriority : null;
  const description = String(formData.get("description") ?? "").trim();
  const expectedOutcome = String(formData.get("expectedOutcome") ?? "").trim();
  const rationale = String(formData.get("rationale") ?? "").trim();

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

/** Edita los campos de contenido. Sólo se ofrece en la UI para proyectos
 *  creados a mano (isManual) — los que vienen del CSV se editan en el CSV. */
export async function updateProjectContent(projectId: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const rawPriority = String(formData.get("priorityTag") ?? "").trim();
  const priorityTag = PRIORITY_TAGS.includes(rawPriority) ? rawPriority : null;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(title.length > 0 ? { title } : {}),
      ...(category.length > 0 ? { category } : {}),
      priorityTag,
      description: String(formData.get("description") ?? "").trim(),
      expectedOutcome: String(formData.get("expectedOutcome") ?? "").trim(),
      rationale: String(formData.get("rationale") ?? "").trim(),
    },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
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
