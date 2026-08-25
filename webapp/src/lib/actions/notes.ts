"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function addProjectNote(projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  if (!body || !author) return;

  await prisma.projectNote.create({ data: { projectId, body, author } });

  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}
