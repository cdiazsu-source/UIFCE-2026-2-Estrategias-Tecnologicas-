"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

function parseDueDate(raw: FormDataEntryValue | null): Date | null {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** El responsable se elige de la lista de Equipo. Devuelve el vínculo y el
 *  snapshot del nombre (o ambos null si no se eligió a nadie). */
async function resolveAssignee(raw: FormDataEntryValue | null) {
  const assigneeId = String(raw ?? "").trim();
  if (!assigneeId) return { assigneeId: null, assignee: null };
  const user = await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true } });
  return user ? { assigneeId, assignee: user.name } : { assigneeId: null, assignee: null };
}

export async function addChecklistItem(projectId: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const { assigneeId, assignee } = await resolveAssignee(formData.get("assigneeId"));
  const dueDate = parseDueDate(formData.get("dueDate"));

  const last = await prisma.checklistItem.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.checklistItem.create({
    data: {
      projectId,
      text,
      order: (last?.order ?? -1) + 1,
      assigneeId,
      assignee,
      dueDate,
    },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function toggleChecklistItem(
  itemId: string,
  projectId: string,
  done: boolean,
): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.checklistItem.findUnique({ where: { id: itemId }, select: { done: true } });
  if (!prev) return;
  await prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
  return { kind: "checklist.toggle", id: itemId, projectId, before: prev.done };
}

export async function updateChecklistItem(
  itemId: string,
  projectId: string,
  formData: FormData,
): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    select: { text: true, assignee: true, assigneeId: true, dueDate: true },
  });
  if (!prev) return;

  const text = String(formData.get("text") ?? "").trim();
  const { assigneeId, assignee } = await resolveAssignee(formData.get("assigneeId"));
  const dueDate = parseDueDate(formData.get("dueDate"));

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(text.length > 0 ? { text } : {}),
      assigneeId,
      assignee,
      dueDate,
    },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return {
    kind: "checklist.update",
    id: itemId,
    projectId,
    before: {
      text: prev.text,
      assignee: prev.assignee,
      assigneeId: prev.assigneeId,
      dueDate: prev.dueDate ? prev.dueDate.toISOString() : null,
    },
  };
}

export async function deleteChecklistItem(itemId: string, projectId: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!prev) return;

  await prisma.checklistItem.delete({ where: { id: itemId } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return {
    kind: "checklist.delete",
    data: {
      id: prev.id,
      projectId: prev.projectId,
      text: prev.text,
      order: prev.order,
      done: prev.done,
      assignee: prev.assignee,
      assigneeId: prev.assigneeId,
      dueDate: prev.dueDate ? prev.dueDate.toISOString() : null,
    },
  };
}

/** Sube o baja una subtarea en el orden del checklist del proyecto,
 *  intercambiando su `order` con el de la vecina. */
export async function moveChecklistItem(itemId: string, projectId: string, dir: "up" | "down") {
  if (await blockedForJunior()) return;

  const items = await prisma.checklistItem.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });

  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return;

  const a = items[idx];
  const b = items[swapIdx];
  await prisma.$transaction([
    prisma.checklistItem.update({ where: { id: a.id }, data: { order: b.order } }),
    prisma.checklistItem.update({ where: { id: b.id }, data: { order: a.order } }),
  ]);

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}
