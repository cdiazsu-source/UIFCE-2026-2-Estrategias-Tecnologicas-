"use server";

import { revalidatePath } from "next/cache";
import type { SocialChannelStatus, SocialPlatform } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

const PLATFORMS = ["INSTAGRAM", "LINKEDIN", "X", "TIKTOK", "YOUTUBE", "FACEBOOK"] as const;
const STATUSES = ["ACTIVA", "EN_RIESGO", "EN_TRAMITE", "INACTIVA", "PERDIDA"] as const;

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

export async function addSocialChannel(formData: FormData) {
  if (await blockedForJunior()) return;
  const platform = String(formData.get("platform") ?? "");
  if (!(PLATFORMS as readonly string[]).includes(platform)) return;

  const exists = await prisma.socialChannel.findUnique({
    where: { platform: platform as SocialPlatform },
    select: { id: true },
  });
  if (exists) return;

  const top = await prisma.socialChannel.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.socialChannel.create({
    data: { platform: platform as SocialPlatform, order: (top?.order ?? -1) + 1 },
  });
  revalidatePath("/redes");
}

export async function updateSocialChannel(id: string, formData: FormData): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.socialChannel.findUnique({ where: { id } });
  if (!prev) return;

  const rawStatus = String(formData.get("status") ?? "");
  const status = (STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as SocialChannelStatus)
    : prev.status;

  const rawFollowers = String(formData.get("followers") ?? "").trim();
  const followers = rawFollowers.length > 0 ? Math.max(0, Math.trunc(Number(rawFollowers)) || 0) : null;

  const rawLastPost = String(formData.get("lastPostAt") ?? "").trim();
  const lastPostAt = rawLastPost.length > 0 ? new Date(rawLastPost) : null;

  await prisma.socialChannel.update({
    where: { id },
    data: {
      handle: str(formData, "handle"),
      url: str(formData, "url"),
      status,
      official: formData.get("official") === "on",
      followers,
      cadence: str(formData, "cadence"),
      lastPostAt: lastPostAt && !Number.isNaN(lastPostAt.getTime()) ? lastPostAt : null,
      lastPostNote: str(formData, "lastPostNote"),
      nextAction: str(formData, "nextAction"),
      notes: str(formData, "notes"),
      responsibleId: str(formData, "responsibleId"),
    },
  });

  revalidatePath("/redes");
  revalidatePath("/");

  return {
    kind: "social.update",
    id,
    before: {
      handle: prev.handle,
      url: prev.url,
      status: prev.status,
      official: prev.official,
      followers: prev.followers,
      cadence: prev.cadence,
      lastPostAt: prev.lastPostAt ? prev.lastPostAt.toISOString() : null,
      lastPostNote: prev.lastPostNote,
      nextAction: prev.nextAction,
      notes: prev.notes,
      responsibleId: prev.responsibleId,
    },
  };
}

export async function deleteSocialChannel(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.socialChannel.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.socialChannel.delete({ where: { id } });
  revalidatePath("/redes");

  return {
    kind: "social.delete",
    data: {
      id: prev.id,
      platform: prev.platform,
      handle: prev.handle,
      url: prev.url,
      status: prev.status,
      official: prev.official,
      followers: prev.followers,
      cadence: prev.cadence,
      lastPostAt: prev.lastPostAt ? prev.lastPostAt.toISOString() : null,
      lastPostNote: prev.lastPostNote,
      nextAction: prev.nextAction,
      notes: prev.notes,
      responsibleId: prev.responsibleId,
      projectId: prev.projectId,
      order: prev.order,
    },
  };
}
