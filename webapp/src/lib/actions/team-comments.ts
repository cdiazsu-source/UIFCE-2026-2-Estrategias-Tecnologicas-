"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { USER_ROLE_LABEL } from "@/lib/utils";
import type { UndoAction } from "@/lib/undo";

/** Cualquiera del equipo puede dejar un comentario o idea. El autor se elige de
 *  la lista de User (equipo): solo se acepta si existe y está activo. */
export async function addTeamComment(formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const authorId = String(formData.get("authorId") ?? "").trim();
  if (!body || !authorId) return;

  const user = await prisma.user.findFirst({
    where: { id: authorId, active: true },
    select: { name: true, role: true },
  });
  if (!user) return;

  await prisma.teamComment.create({
    data: {
      body,
      author: user.name,
      authorRole: USER_ROLE_LABEL[user.role] ?? null,
      authorId,
    },
  });

  revalidatePath("/");
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
      createdAt: prev.createdAt.toISOString(),
    },
  };
}
