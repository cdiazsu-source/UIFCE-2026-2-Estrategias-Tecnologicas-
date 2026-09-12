"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { STUDY_COMMENT_ROLES, USER_ROLE_LABEL } from "@/lib/utils";
import type { UndoAction } from "@/lib/undo";

const PATH = "/";

/** Dueño de un proyecto o quien responde una actualización de proyecto de
 *  estudio. El login es compartido, así que la identidad se auto-declara en el
 *  desplegable "¿Quién eres?"; esta acción valida el rol otra vez server-side. */
export async function addStudyComment(formData: FormData): Promise<{ ok: boolean }> {
  const body = String(formData.get("body") ?? "").trim();
  const authorId = String(formData.get("authorId") ?? "").trim();
  const studyProjectId = String(formData.get("studyProjectId") ?? "").trim();
  const rawParentId = String(formData.get("parentId") ?? "").trim();
  if (!body || !authorId || !studyProjectId) return { ok: false };

  const user = await prisma.user.findFirst({
    where: { id: authorId, active: true, role: { in: [...STUDY_COMMENT_ROLES] } },
    select: { name: true, role: true },
  });
  if (!user) return { ok: false };

  const project = await prisma.studyProject.findUnique({
    where: { id: studyProjectId },
    select: { id: true },
  });
  if (!project) return { ok: false };

  // Si es una respuesta, se cuelga del comentario raíz (un solo nivel), y debe
  // ser del mismo proyecto de estudio.
  let parentId: string | null = null;
  if (rawParentId) {
    const parent = await prisma.studyProjectComment.findUnique({
      where: { id: rawParentId },
      select: { id: true, parentId: true, studyProjectId: true },
    });
    if (!parent || parent.studyProjectId !== studyProjectId) return { ok: false };
    parentId = parent.parentId ?? parent.id;
  }

  await prisma.studyProjectComment.create({
    data: {
      studyProjectId,
      body,
      author: user.name,
      authorRole: USER_ROLE_LABEL[user.role] ?? null,
      authorId,
      parentId,
    },
  });

  revalidatePath(PATH);
  return { ok: true };
}

/** Borrar una actualización. Reservado al perfil completo (igual que borrar un
 *  comentario del equipo), con Deshacer. */
export async function deleteStudyComment(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.studyProjectComment.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.studyProjectComment.delete({ where: { id } });
  revalidatePath(PATH);

  return {
    kind: "studycomment.delete",
    data: {
      id: prev.id,
      studyProjectId: prev.studyProjectId,
      body: prev.body,
      author: prev.author,
      authorRole: prev.authorRole,
      authorId: prev.authorId,
      parentId: prev.parentId,
      createdAt: prev.createdAt.toISOString(),
    },
  };
}
