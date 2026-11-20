"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, canManageLeads } from "@/lib/session";
import { normalizeKind, normalizeModality, normalizeStatus } from "@/lib/unit-events";

/** Acciones de «Microtalleres y eventos» (/eventos). Registrar y actualizar lo puede hacer cualquier sesión (`canManageLeads`, incluye
 *  al Junior, que suele llevar la asistencia); borrar es del perfil completo. */

export type EventResult = { ok: true } | { ok: false; error: string };

const text = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? "").trim().slice(0, max) || null;

function count(fd: FormData, k: string): number | null | "bad" {
  const raw = String(fd.get(k) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 100000 ? n : "bad";
}

function fields(fd: FormData): { ok: true; data: Parameters<typeof prisma.unitEvent.create>[0]["data"] } | { ok: false; error: string } {
  const title = text(fd, "title", 200);
  if (!title) return { ok: false, error: "Escribe el nombre." };
  const day = String(fd.get("date") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day))) return { ok: false, error: "Elige la fecha." };
  const registered = count(fd, "registered");
  const attended = count(fd, "attended");
  if (registered === "bad" || attended === "bad") return { ok: false, error: "Inscritos y asistentes son números enteros." };
  if (registered != null && attended != null && attended > registered) {
    return { ok: false, error: "Los asistentes no pueden ser más que los inscritos." };
  }
  const link = text(fd, "link", 500);
  if (link && !/^https?:\/\//i.test(link)) return { ok: false, error: "El enlace debe empezar por http:// o https://." };
  return {
    ok: true,
    data: {
      kind: normalizeKind(String(fd.get("kind") ?? "")),
      title,
      date: new Date(`${day}T12:00:00-05:00`),
      modality: normalizeModality(String(fd.get("modality") ?? "")),
      place: text(fd, "place", 120),
      speaker: text(fd, "speaker", 160),
      audience: text(fd, "audience", 160),
      status: normalizeStatus(String(fd.get("status") ?? "")),
      registered,
      attended,
      link,
      projectId: text(fd, "projectId", 100),
      notes: text(fd, "notes", 2000),
    },
  };
}

export async function createUnitEvent(fd: FormData): Promise<EventResult> {
  if (!(await canManageLeads())) return { ok: false, error: "No tienes permiso para registrar eventos." };
  const f = fields(fd);
  if (!f.ok) return f;
  await prisma.unitEvent.create({ data: f.data });
  revalidatePath("/eventos");
  return { ok: true };
}

export async function updateUnitEvent(id: string, fd: FormData): Promise<EventResult> {
  if (!(await canManageLeads())) return { ok: false, error: "No tienes permiso para editar eventos." };
  const f = fields(fd);
  if (!f.ok) return f;
  await prisma.unitEvent.update({ where: { id }, data: f.data });
  revalidatePath("/eventos");
  return { ok: true };
}

export async function deleteUnitEvent(id: string): Promise<EventResult> {
  if (await blockedForJunior()) return { ok: false, error: "Solo el perfil completo puede eliminar." };
  await prisma.unitEvent.delete({ where: { id } }).catch(() => {});
  revalidatePath("/eventos");
  return { ok: true };
}
