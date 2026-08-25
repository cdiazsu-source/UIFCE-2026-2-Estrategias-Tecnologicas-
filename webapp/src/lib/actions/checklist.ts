"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

function parseDueDate(raw: FormDataEntryValue | null): Date | null {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function addChecklistItem(projectId: string, formData: FormData) {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const assignee = String(formData.get("assignee") ?? "").trim();
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
      assignee: assignee.length > 0 ? assignee : null,
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
  const assignee = String(formData.get("assignee") ?? "").trim();
  const dueDate = parseDueDate(formData.get("dueDate"));

  await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(text.length > 0 ? { text } : {}),
      assignee: assignee.length > 0 ? assignee : null,
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
