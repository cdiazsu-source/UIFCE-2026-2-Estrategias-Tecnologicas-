"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABEL } from "@/lib/utils";

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
export async function updateProjectNote(noteId: string, projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const checklistItemId = await resolveChecklistItem(formData.get("checklistItemId"), projectId);

  await prisma.projectNote.update({
    where: { id: noteId },
    data: { body, checklistItemId },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

/** Elimina una nota de la bitácora. */
export async function deleteProjectNote(noteId: string, projectId: string) {
  await prisma.projectNote.delete({ where: { id: noteId } });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}
