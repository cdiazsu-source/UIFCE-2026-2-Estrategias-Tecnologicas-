"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

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

export async function toggleChecklistItem(itemId: string, projectId: string, done: boolean) {
  await prisma.checklistItem.update({ where: { id: itemId }, data: { done } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateChecklistItem(itemId: string, projectId: string, formData: FormData) {
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
}

export async function deleteChecklistItem(itemId: string, projectId: string) {
  await prisma.checklistItem.delete({ where: { id: itemId } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}
