"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABEL } from "@/lib/utils";

/** Solo alguien del equipo (un User) puede dejar una nota de bitácora.
 *  Se guarda un snapshot de su nombre y cargo junto al vínculo. */
export async function addProjectNote(projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const authorId = String(formData.get("authorId") ?? "").trim();
  if (!body || !authorId) return;

  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true, role: true },
  });
  if (!user) return;

  await prisma.projectNote.create({
    data: {
      projectId,
      body,
      author: user.name,
      authorRole: USER_ROLE_LABEL[user.role] ?? null,
      authorId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

/** Corrige el texto de una nota ya publicada. No cambia autor ni fecha:
 *  la nota sigue atribuida a quien la escribió. Mismo nivel de acceso que
 *  crear una nota (la bitácora la mantiene el equipo). */
export async function updateProjectNote(noteId: string, projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await prisma.projectNote.update({ where: { id: noteId }, data: { body } });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

/** Elimina una nota de la bitácora. */
export async function deleteProjectNote(noteId: string, projectId: string) {
  await prisma.projectNote.delete({ where: { id: noteId } });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}
