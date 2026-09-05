"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { SocialMetric } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, canRecordMetrics } from "@/lib/session";
import type { UndoAction } from "@/lib/undo";

/** Columnas de KPIs por plataforma. El resto de la fila queda en null.
 *  (No se exporta: un archivo "use server" solo puede exportar funciones async.
 *  Las etiquetas visibles viven en src/components/social-panel.tsx.) */
const IG_METRIC_KEYS = [
  "igFollowers",
  "igReach",
  "igImpressions",
  "igInteractions",
  "igProfileVisits",
] as const;

const LI_METRIC_KEYS = [
  "liFollowers",
  "liProfileViews",
  "liPostImpressions",
  "liInteractions",
  "liSearchAppearances",
] as const;

const ALL_METRIC_KEYS = [...IG_METRIC_KEYS, ...LI_METRIC_KEYS] as const;
type MetricKey = (typeof ALL_METRIC_KEYS)[number];

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

function parseAt(fd: FormData): Date {
  const raw = String(fd.get("at") ?? "").trim();
  const d = raw.length > 0 ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Lee del formulario solo las columnas de la plataforma dada. */
function readValues(fd: FormData, platform: "INSTAGRAM" | "LINKEDIN"): Record<string, number | null> {
  const keys = platform === "INSTAGRAM" ? IG_METRIC_KEYS : LI_METRIC_KEYS;
  const out: Record<string, number | null> = {};
  for (const k of keys) out[k] = int(fd, k);
  return out;
}

function pickValues(row: SocialMetric): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const k of ALL_METRIC_KEYS) out[k] = row[k as MetricKey];
  return out;
}

/** Registrar una medición nueva. Perfil completo y junior. */
export async function addSocialMetric(channelId: string, formData: FormData) {
  if (!(await canRecordMetrics())) return;

  const channel = await prisma.socialChannel.findUnique({
    where: { id: channelId },
    select: { id: true, platform: true },
  });
  if (!channel) return;
  if (channel.platform !== "INSTAGRAM" && channel.platform !== "LINKEDIN") return;

  // Quién registra: se elige del equipo (el perfil junior compartido no lleva
  // identidad propia, igual que en la bitácora y los comentarios de equipo).
  const recordedById = str(formData, "recordedById");
  const recorder = recordedById
    ? await prisma.user.findFirst({ where: { id: recordedById, active: true }, select: { id: true, name: true } })
    : null;
  if (!recorder) return;

  const values = readValues(formData, channel.platform);
  if (Object.values(values).every((v) => v == null)) return; // al menos un dato

  const data: Prisma.SocialMetricUncheckedCreateInput = {
    channelId: channel.id,
    platform: channel.platform,
    at: parseAt(formData),
    recordedById: recorder.id,
    recordedByName: recorder.name,
    note: str(formData, "note"),
  };
  for (const [k, v] of Object.entries(values)) (data as Record<string, unknown>)[k] = v;

  await prisma.socialMetric.create({ data });

  revalidatePath("/redes");
}

/** Editar una medición. Perfil completo y junior. */
export async function updateSocialMetric(id: string, formData: FormData): Promise<UndoAction | void> {
  if (!(await canRecordMetrics())) return;

  const prev = await prisma.socialMetric.findUnique({ where: { id } });
  if (!prev) return;
  if (prev.platform !== "INSTAGRAM" && prev.platform !== "LINKEDIN") return;

  const values = readValues(formData, prev.platform);

  const data: Prisma.SocialMetricUncheckedUpdateInput = {
    at: parseAt(formData),
    note: str(formData, "note"),
  };
  for (const [k, v] of Object.entries(values)) (data as Record<string, unknown>)[k] = v;

  await prisma.socialMetric.update({ where: { id }, data });

  revalidatePath("/redes");

  return {
    kind: "socialmetric.update",
    id,
    before: { at: prev.at.toISOString(), note: prev.note, values: pickValues(prev) },
  };
}

/** Borrar una medición. Solo perfil completo. */
export async function deleteSocialMetric(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;

  const prev = await prisma.socialMetric.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.socialMetric.delete({ where: { id } });
  revalidatePath("/redes");

  return {
    kind: "socialmetric.delete",
    data: {
      id: prev.id,
      channelId: prev.channelId,
      platform: prev.platform,
      at: prev.at.toISOString(),
      recordedById: prev.recordedById,
      recordedByName: prev.recordedByName,
      note: prev.note,
      values: pickValues(prev),
    },
  };
}
