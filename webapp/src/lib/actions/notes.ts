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
