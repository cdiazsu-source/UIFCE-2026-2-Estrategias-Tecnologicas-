"use server";

import { revalidatePath } from "next/cache";
import type { SocialChannelStatus, SocialOfficialStatus, SocialPlatform } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

const PLATFORMS = ["INSTAGRAM", "LINKEDIN", "X", "TIKTOK", "YOUTUBE", "FACEBOOK"] as const;
const STATUSES = ["ACTIVA", "EN_RIESGO", "EN_TRAMITE", "INACTIVA", "PERDIDA"] as const;
const OFFICIAL_STATUSES = ["OFICIALIZADA", "EN_TRAMITE", "SIN_OFICIALIZAR"] as const;

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

function int(fd: FormData, k: string): number | null {
  const raw = String(fd.get(k) ?? "").trim();
  if (raw.length === 0) return null;
  const n = Math.trunc(Number(raw));
  return Number.isFinite(n) ? Math.max(0, n) : null;
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

  const rawOfficial = String(formData.get("officialStatus") ?? "");
  const officialStatus = (OFFICIAL_STATUSES as readonly string[]).includes(rawOfficial)
    ? (rawOfficial as SocialOfficialStatus)
    : prev.officialStatus;

  const rawLastPost = String(formData.get("lastPostAt") ?? "").trim();
  const lastPostAt = rawLastPost.length > 0 ? new Date(rawLastPost) : null;

  await prisma.socialChannel.update({
    where: { id },
    data: {
      handle: str(formData, "handle"),
      url: str(formData, "url"),
      status,
      officialStatus,
      followers: int(formData, "followers"),
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
      officialStatus: prev.officialStatus,
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
      officialStatus: prev.officialStatus,
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

// --- Interacciones / trazabilidad -----------------------------------------

function parseAt(fd: FormData): Date {
  const raw = String(fd.get("at") ?? "").trim();
  const d = raw.length > 0 ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export async function addSocialInteraction(channelId: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const channel = await prisma.socialChannel.findUnique({ where: { id: channelId }, select: { id: true } });
  if (!channel) return;

  await prisma.socialInteraction.create({
    data: {
      channelId,
      at: parseAt(formData),
      title,
      detail: str(formData, "detail"),
      followers: int(formData, "followers"),
      reach: int(formData, "reach"),
      interactions: int(formData, "interactions"),
      url: str(formData, "url"),
    },
  });
  revalidatePath("/redes");
}

export async function updateSocialInteraction(id: string, formData: FormData): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.socialInteraction.findUnique({ where: { id } });
  if (!prev) return;

  const title = String(formData.get("title") ?? "").trim();

  await prisma.socialInteraction.update({
    where: { id },
    data: {
      at: parseAt(formData),
      ...(title.length > 0 ? { title } : {}),
      detail: str(formData, "detail"),
      followers: int(formData, "followers"),
      reach: int(formData, "reach"),
      interactions: int(formData, "interactions"),
      url: str(formData, "url"),
    },
  });
  revalidatePath("/redes");

  return {
    kind: "socialinteraction.update",
    id,
    before: {
      at: prev.at.toISOString(),
      title: prev.title,
      detail: prev.detail,
      followers: prev.followers,
      reach: prev.reach,
      interactions: prev.interactions,
      url: prev.url,
    },
  };
}

export async function deleteSocialInteraction(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.socialInteraction.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.socialInteraction.delete({ where: { id } });
  revalidatePath("/redes");

  return {
    kind: "socialinteraction.delete",
    data: {
      id: prev.id,
      channelId: prev.channelId,
      at: prev.at.toISOString(),
      title: prev.title,
      detail: prev.detail,
      followers: prev.followers,
      reach: prev.reach,
      interactions: prev.interactions,
      url: prev.url,
    },
  };
}
