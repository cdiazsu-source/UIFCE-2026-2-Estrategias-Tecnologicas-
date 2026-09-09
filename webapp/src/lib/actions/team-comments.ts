"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { USER_ROLE_LABEL } from "@/lib/utils";
import type { UndoAction } from "@/lib/undo";

/** Cualquiera del equipo puede dejar un comentario o idea. El autor se elige de
 *  la lista de User (equipo): solo se acepta si existe y está activo.
 *  Devuelve `{ ok }` para que el formulario sepa si limpiar el borrador local. */
export async function addTeamComment(formData: FormData): Promise<{ ok: boolean }> {
  const body = String(formData.get("body") ?? "").trim();
  const authorId = String(formData.get("authorId") ?? "").trim();
  const rawParentId = String(formData.get("parentId") ?? "").trim();
  if (!body || !authorId) return { ok: false };

  const user = await prisma.user.findFirst({
    where: { id: authorId, active: true },
    select: { name: true, role: true },
  });
  if (!user) return { ok: false };

  // Si es una respuesta: se cuelga del comentario raíz (un solo nivel de anidado).
  let parentId: string | null = null;
  if (rawParentId) {
    const parent = await prisma.teamComment.findUnique({
      where: { id: rawParentId },
      select: { id: true, parentId: true },
    });
    if (!parent) return { ok: false };
    parentId = parent.parentId ?? parent.id;
  }

  await prisma.teamComment.create({
    data: {
      body,
      author: user.name,
      authorRole: USER_ROLE_LABEL[user.role] ?? null,
      authorId,
      parentId,
    },
  });

  revalidatePath("/");
  return { ok: true };
}

export async function toggleTeamCommentReviewed(
  id: string,
  reviewed: boolean,
): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.teamComment.findUnique({ where: { id }, select: { reviewed: true } });
  if (!prev) return;

  await prisma.teamComment.update({ where: { id }, data: { reviewed } });
  revalidatePath("/");

  return { kind: "teamcomment.reviewed", id, before: prev.reviewed };
}

export async function deleteTeamComment(id: string): Promise<UndoAction | void> {
  if (await blockedForJunior()) return;
  const prev = await prisma.teamComment.findUnique({ where: { id } });
  if (!prev) return;

  await prisma.teamComment.delete({ where: { id } });
  revalidatePath("/");

  return {
    kind: "teamcomment.delete",
    data: {
      id: prev.id,
      body: prev.body,
      author: prev.author,
      authorRole: prev.authorRole,
      authorId: prev.authorId,
      reviewed: prev.reviewed,
      parentId: prev.parentId,
      createdAt: prev.createdAt.toISOString(),
    },
  };
}
