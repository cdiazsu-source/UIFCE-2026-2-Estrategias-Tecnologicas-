"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { LinkedInSnapshot, LinkedInTrackeeKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, canRecordMetrics } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

const NUM_FIELDS = [
  "profileScore",
  "connections",
  "followers",
  "ssi",
  "postsLast30",
  "engagementLast30",
  "recommendations",
  "certsPublished",
  "pageViews",
  "impressions",
] as const;
const BOOL_FIELDS = ["uifceExperience", "creatorMode"] as const;

const LEVELS = ["direction", "coordination", "lead", "master", "junior"];

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

function bool(fd: FormData, k: string): boolean {
  const v = fd.get(k);
  return v != null && v !== "false" && v !== "";
}

function floatOrNull(fd: FormData, k: string): number | null {
  const raw = String(fd.get(k) ?? "").trim();
  if (raw.length === 0) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function monthOrNull(fd: FormData): string | null {
  const raw = String(fd.get("month") ?? "").trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

/** Lee del formulario todos los campos numéricos/booleanos; los que la
 *  plataforma no renderiza para ese `kind` quedan en null/false. */
function readValues(fd: FormData): Record<string, number | boolean | null> {
  const out: Record<string, number | boolean | null> = {};
  for (const k of NUM_FIELDS) out[k] = int(fd, k);
  for (const k of BOOL_FIELDS) out[k] = bool(fd, k);
  out.engagementRate = floatOrNull(fd, "engagementRate");
  return out;
}

function pickValues(row: LinkedInSnapshot): Record<string, number | boolean | null> {
  const out: Record<string, number | boolean | null> = {};
  for (const k of NUM_FIELDS) out[k] = row[k as (typeof NUM_FIELDS)[number]];
  for (const k of BOOL_FIELDS) out[k] = row[k as (typeof BOOL_FIELDS)[number]];
  out.engagementRate = row.engagementRate;
  return out;
}

// --- Mediciones ------------------------------------------------------------

/** Registra (o sobrescribe) la medición de un trackee para un mes. Perfil
 *  completo y junior (el junior coordinador es quien hace el seguimiento). */
export async function addLinkedInSnapshot(trackeeId: string, formData: FormData) {
  if (!(await canRecordMetrics())) return;

  const trackee = await prisma.linkedInTrackee.findUnique({
    where: { id: trackeeId },
    select: { id: true },
  });
  if (!trackee) return;

  const month = monthOrNull(formData);
  if (!month) return;

  const recordedById = str(formData, "recordedById");
  const recorder = recordedById
    ? await prisma.user.findFirst({ where: { id: recordedById, active: true }, select: { id: true, name: true } })
    : null;
  if (!recorder) return;

  const values = readValues(formData);
  if (Object.values(values).every((v) => v == null || v === false)) return;

  const base: Prisma.LinkedInSnapshotUncheckedCreateInput = {
    trackeeId: trackee.id,
    month,
    note: str(formData, "note"),
    recordedById: recorder.id,
    recordedByName: recorder.name,
  };
  const create: Prisma.LinkedInSnapshotUncheckedCreateInput = { ...base };
  const update: Prisma.LinkedInSnapshotUncheckedUpdateInput = { ...base };
  for (const [k, v] of Object.entries(values)) {
    (create as Record<string, unknown>)[k] = v;
    (update as Record<string, unknown>)[k] = v;
  }

  await prisma.linkedInSnapshot.upsert({
    where: { trackeeId_month: { trackeeId: trackee.id, month } },
    create,
    update,
  });

  revalidatePath("/linkedin");
}

export async function updateLinkedInSnapshot(id: string, formData: FormData): Promise<UndoAction | void> {
  if (!(await canRecordMetrics())) return;

  const prev = await prisma.linkedInSnapshot.findUnique({ where: { id } });
  if (!prev) return;

  const month = monthOrNull(formData) ?? prev.month;
  const values = readValues(formData);

  const data: Prisma.LinkedInSnapshotUncheckedUpdateInput = { month, note: str(formData, "note") };
  for (const [k, v] of Object.entries(values)) (data as Record<string, unknown>)[k] = v;

  await prisma.linkedInSnapshot.update({ where: { id }, data });
  revalidatePath("/linkedin");

  return {
    kind: "linkedinsnapshot.update",
    id,
    before: { month: prev.month, note: prev.note, values: pickValues(prev) },
  };
}

export async function deleteLinkedInSnapshot(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;

  const prev = await prisma.linkedInSnapshot.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.linkedInSnapshot.delete({ where: { id } });
  revalidatePath("/linkedin");

  return {
    kind: "linkedinsnapshot.delete",
    data: {
      id: prev.id,
      trackeeId: prev.trackeeId,
      month: prev.month,
      note: prev.note,
      recordedById: prev.recordedById,
      recordedByName: prev.recordedByName,
      values: pickValues(prev),
    },
  };
}

// --- Lista de trackees (solo perfil completo) -----------------------------

export async function addLinkedInTrackee(formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const rawKind = String(formData.get("kind") ?? "PERSON");
  const kind: LinkedInTrackeeKind = rawKind === "ORG" ? "ORG" : "PERSON";
  const rawLevel = String(formData.get("level") ?? "").trim();

  const top = await prisma.linkedInTrackee.findFirst({ orderBy: { order: "desc" }, select: { order: true } });

  await prisma.linkedInTrackee.create({
    data: {
      kind,
      name,
      linkedinUrl: str(formData, "linkedinUrl"),
      area: str(formData, "area"),
      level: LEVELS.includes(rawLevel) ? rawLevel : null,
      order: (top?.order ?? 0) + 1,
    },
  });
  revalidatePath("/linkedin");
}

export async function updateLinkedInTrackee(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const rawLevel = String(formData.get("level") ?? "").trim();

  await prisma.linkedInTrackee.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      linkedinUrl: str(formData, "linkedinUrl"),
      area: str(formData, "area"),
      level: LEVELS.includes(rawLevel) ? rawLevel : null,
      active: formData.get("active") !== "false",
    },
  });
  revalidatePath("/linkedin");
}

export async function deleteLinkedInTrackee(id: string) {
  if (await blockedForJunior()) return;
  await prisma.linkedInTrackee.delete({ where: { id } });
  revalidatePath("/linkedin");
}
