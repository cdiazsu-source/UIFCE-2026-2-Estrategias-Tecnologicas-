"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { fromBogotaInput } from "@/lib/utils";
import type { UndoAction } from "@/lib/undo";

const PATH = "/calendario";

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

export async function addEvent(formData: FormData) {
  if (await blockedForJunior()) return;
  const title = String(formData.get("title") ?? "").trim();
  const startAt = fromBogotaInput(String(formData.get("startAt") ?? ""));
  if (!title || !startAt) return;

  await prisma.calendarEvent.create({
    data: {
      title,
      description: str(formData, "description"),
      startAt,
      endAt: fromBogotaInput(String(formData.get("endAt") ?? "")),
      location: str(formData, "location"),
    },
  });
  revalidatePath(PATH);
}

export async function updateEvent(id: string, formData: FormData): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!prev) return;

  const title = String(formData.get("title") ?? "").trim();
  const startAt = fromBogotaInput(String(formData.get("startAt") ?? ""));
  if (!title || !startAt) return;

  await prisma.calendarEvent.update({
    where: { id },
    data: {
      title,
      description: str(formData, "description"),
      startAt,
      endAt: fromBogotaInput(String(formData.get("endAt") ?? "")),
      location: str(formData, "location"),
    },
  });
  revalidatePath(PATH);

  return {
    kind: "calendarevent.update",
    id,
    before: {
      title: prev.title,
      description: prev.description,
      startAt: prev.startAt.toISOString(),
      endAt: prev.endAt?.toISOString() ?? null,
      location: prev.location,
    },
  };
}

export async function deleteEvent(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath(PATH);

  return {
    kind: "calendarevent.delete",
    data: {
      id: prev.id,
      title: prev.title,
      description: prev.description,
      startAt: prev.startAt.toISOString(),
      endAt: prev.endAt?.toISOString() ?? null,
      location: prev.location,
    },
  };
}
