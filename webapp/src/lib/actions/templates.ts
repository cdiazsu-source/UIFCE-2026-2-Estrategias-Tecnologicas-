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

/** Tope defensivo para la captura: quien edita ya la reduce a ~640px en el
 *  navegador (ver templates-panel.tsx); esto solo evita filas gigantes si
 *  alguien pega una imagen sin reducir. ~1.2M chars ≈ 900 KB de data URL. */
const SCREENSHOT_MAX = 1_200_000;

function screenshot(fd: FormData): string | null {
  const v = str(fd, "screenshot");
  if (!v) return null;
  return v.length <= SCREENSHOT_MAX ? v : null;
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
      screenshot: screenshot(formData),
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
      screenshot: screenshot(formData),
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
      screenshot: prev.screenshot,
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
      screenshot: prev.screenshot,
      order: prev.order,
    },
  };
}
