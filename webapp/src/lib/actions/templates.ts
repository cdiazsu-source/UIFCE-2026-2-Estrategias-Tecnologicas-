"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

const PATH = "/plantillas";

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

export async function addTemplate(formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Otras";
  if (!name) return;

  const last = await prisma.template.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.template.create({
    data: {
      name,
      category,
      description: str(formData, "description"),
      url: str(formData, "url"),
      format: str(formData, "format"),
      notes: str(formData, "notes"),
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidatePath(PATH);
}

export async function updateTemplate(id: string, formData: FormData): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.template.findUnique({ where: { id } });
  if (!prev) return;

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  await prisma.template.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      ...(category.length > 0 ? { category } : {}),
      description: str(formData, "description"),
      url: str(formData, "url"),
      format: str(formData, "format"),
      notes: str(formData, "notes"),
    },
  });
  revalidatePath(PATH);

  return {
    kind: "template.update",
    id,
    before: {
      name: prev.name,
      category: prev.category,
      description: prev.description,
      url: prev.url,
      format: prev.format,
      notes: prev.notes,
    },
  };
}

export async function deleteTemplate(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.template.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.template.delete({ where: { id } });
  revalidatePath(PATH);

  return {
    kind: "template.delete",
    data: {
      id: prev.id,
      name: prev.name,
      category: prev.category,
      description: prev.description,
      url: prev.url,
      format: prev.format,
      notes: prev.notes,
      order: prev.order,
    },
  };
}
