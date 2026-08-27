"use server";

import { revalidatePath } from "next/cache";
import type { CheckpointStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

const PATH = "/proyectos-de-estudio";

const CHECKPOINT_STATUSES: CheckpointStatus[] = ["PENDIENTE", "EN_CURSO", "CUMPLIDO", "ATRASADO"];

// Etiquetas por defecto de los 4 puntos de corte. No se exporta: un módulo
// "use server" sólo puede exportar funciones async.
const DEFAULT_CHECKPOINT_LABELS = ["Primer corte", "Segundo corte", "Tercer corte", "Cuarto corte"];

function parseDate(raw: FormDataEntryValue | null): Date | null {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseStatus(raw: FormDataEntryValue | null): CheckpointStatus {
  const value = String(raw ?? "");
  return (CHECKPOINT_STATUSES as string[]).includes(value) ? (value as CheckpointStatus) : "PENDIENTE";
}

export async function createStudyProject(formData: FormData) {
  if (await blockedForJunior()) return;
  const ownerId = String(formData.get("ownerId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!ownerId || !title) return;

  const description = String(formData.get("description") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();

  const count = await prisma.studyProject.count({ where: { ownerId } });

  await prisma.studyProject.create({
    data: {
      ownerId,
      title,
      description: description.length > 0 ? description : null,
      schedule: schedule.length > 0 ? schedule : null,
      order: count,
      checkpoints: {
        create: DEFAULT_CHECKPOINT_LABELS.map((label, i) => ({
          number: i + 1,
          label,
        })),
      },
    },
  });

  revalidatePath(PATH);
}

export async function updateStudyProject(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const schedule = String(formData.get("schedule") ?? "").trim();

  await prisma.studyProject.update({
    where: { id },
    data: {
      ...(title.length > 0 ? { title } : {}),
      description: description.length > 0 ? description : null,
      schedule: schedule.length > 0 ? schedule : null,
    },
  });

  revalidatePath(PATH);
}

export async function deleteStudyProject(id: string) {
  if (await blockedForJunior()) return;
  await prisma.studyProject.delete({ where: { id } });
  revalidatePath(PATH);
}

export async function updateCheckpoint(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const label = String(formData.get("label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.studyCheckpoint.update({
    where: { id },
    data: {
      ...(label.length > 0 ? { label } : {}),
      dueDate: parseDate(formData.get("dueDate")),
      status: parseStatus(formData.get("status")),
      notes: notes.length > 0 ? notes : null,
    },
  });

  revalidatePath(PATH);
}

export async function setCheckpointStatus(id: string, status: CheckpointStatus) {
  if (await blockedForJunior()) return;
  await prisma.studyCheckpoint.update({ where: { id }, data: { status } });
  revalidatePath(PATH);
}

export async function updateStudyProjectDrive(id: string, driveFolderUrl: string) {
  if (await blockedForJunior()) return;
  const trimmed = driveFolderUrl.trim();
  await prisma.studyProject.update({
    where: { id },
    data: { driveFolderUrl: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(PATH);
}
