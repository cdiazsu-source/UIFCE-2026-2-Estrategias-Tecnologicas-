"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABEL } from "@/lib/utils";
import type { UndoAction } from "@/lib/undo";

/** Devuelve el id de la subtarea elegida solo si pertenece a este proyecto;
 *  si no se eligió ninguna (o no corresponde), la nota queda como nota general. */
async function resolveChecklistItem(raw: FormDataEntryValue | null, projectId: string) {
  const id = String(raw ?? "").trim();
  if (!id) return null;
  const item = await prisma.checklistItem.findUnique({
    where: { id },
    select: { projectId: true },
  });
  return item && item.projectId === projectId ? id : null;
}

/** Solo alguien del equipo (un User) puede dejar una nota de bitácora.
 *  Se guarda un snapshot de su nombre y cargo junto al vínculo. La nota puede
 *  quedar ligada a una subtarea del checklist para ordenar el seguimiento. */
export async function addProjectNote(projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const authorId = String(formData.get("authorId") ?? "").trim();
  if (!body || !authorId) return;

  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true, role: true },
  });
  if (!user) return;

  const checklistItemId = await resolveChecklistItem(formData.get("checklistItemId"), projectId);

  await prisma.projectNote.create({
    data: {
      projectId,
      body,
      author: user.name,
      authorRole: USER_ROLE_LABEL[user.role] ?? null,
      authorId,
      checklistItemId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

/** Corrige el texto de una nota ya publicada y su subtarea vinculada. No cambia
 *  autor ni fecha: la nota sigue atribuida a quien la escribió. Mismo nivel de
 *  acceso que crear una nota (la bitácora la mantiene el equipo). */
export async function updateProjectNote(
  noteId: string,
  projectId: string,
  formData: FormData,
): Promise<UndoAction | void> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const prev = await prisma.projectNote.findUnique({
    where: { id: noteId },
    select: { body: true, checklistItemId: true },
  });
  if (!prev) return;

  const checklistItemId = await resolveChecklistItem(formData.get("checklistItemId"), projectId);

  await prisma.projectNote.update({
    where: { id: noteId },
    data: { body, checklistItemId },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return {
    kind: "note.update",
    id: noteId,
    projectId,
    before: { body: prev.body, checklistItemId: prev.checklistItemId },
  };
}

/** Elimina una nota de la bitácora. */
export async function deleteProjectNote(noteId: string, projectId: string): Promise<UndoAction | void> {
  const prev = await prisma.projectNote.findUnique({ where: { id: noteId } });
  if (!prev) return;

  await prisma.projectNote.delete({ where: { id: noteId } });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);

  return {
    kind: "note.delete",
    data: {
      id: prev.id,
      projectId: prev.projectId,
      body: prev.body,
      author: prev.author,
      authorRole: prev.authorRole,
      authorId: prev.authorId,
      checklistItemId: prev.checklistItemId,
      createdAt: prev.createdAt.toISOString(),
    },
  };
}
