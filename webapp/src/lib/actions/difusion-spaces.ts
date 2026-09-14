"use server";

import { revalidatePath } from "next/cache";

import type { DifusionSpaceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

const PATH = "/difusion/fisica";

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

/** Tope defensivo para una imagen de galería: quien edita ya la reduce a
 *  ~640px en el navegador (ver difusion-spaces-panel.tsx); esto solo evita
 *  filas gigantes si alguien pega una imagen sin reducir. ~1.2M chars ≈ 900 KB
 *  de data URL — mismo criterio que Template.screenshot. */
const IMAGE_MAX = 1_200_000;

export async function addSpace(formData: FormData) {
  if (await blockedForJunior()) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const last = await prisma.difusionSpace.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.difusionSpace.create({
    data: {
      title,
      description: str(formData, "description"),
      order: (last?.order ?? -1) + 1,
    },
  });
  revalidatePath(PATH);
}

export async function updateSpace(id: string, formData: FormData): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.difusionSpace.findUnique({ where: { id } });
  if (!prev) return;

  const title = String(formData.get("title") ?? "").trim();

  await prisma.difusionSpace.update({
    where: { id },
    data: {
      ...(title.length > 0 ? { title } : {}),
      description: str(formData, "description"),
    },
  });
  revalidatePath(PATH);

  return { kind: "difusionspace.update", id, before: { title: prev.title, description: prev.description } };
}

export async function updateSpaceStatus(id: string, status: DifusionSpaceStatus) {
  if (await blockedForJunior()) return;
  await prisma.difusionSpace.update({ where: { id }, data: { status } });
  revalidatePath(PATH);
}

export async function deleteSpace(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.difusionSpace.findUnique({ where: { id }, include: { images: true } });
  if (!prev) return;

  await prisma.difusionSpace.delete({ where: { id } });
  revalidatePath(PATH);

  return {
    kind: "difusionspace.delete",
    data: {
      id: prev.id,
      title: prev.title,
      status: prev.status,
      description: prev.description,
      order: prev.order,
      images: prev.images.map((img) => ({ id: img.id, dataUrl: img.dataUrl, order: img.order })),
    },
  };
}

export async function addSpaceImage(spaceId: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const dataUrl = String(formData.get("dataUrl") ?? "").trim();
  if (!dataUrl || dataUrl.length > IMAGE_MAX) return;

  const last = await prisma.difusionSpaceImage.findFirst({
    where: { spaceId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.difusionSpaceImage.create({
    data: { spaceId, dataUrl, order: (last?.order ?? -1) + 1 },
  });
  revalidatePath(PATH);
}

export async function deleteSpaceImage(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.difusionSpaceImage.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.difusionSpaceImage.delete({ where: { id } });
  revalidatePath(PATH);

  return {
    kind: "difusionspaceimage.delete",
    data: { id: prev.id, spaceId: prev.spaceId, dataUrl: prev.dataUrl, order: prev.order },
  };
}
