"use server";

import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath("/");
  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateProjectDriveLink(projectId: string, driveFolderUrl: string) {
  const trimmed = driveFolderUrl.trim();
  await prisma.project.update({
    where: { id: projectId },
    data: { driveFolderUrl: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(`/proyectos/${projectId}`);
}
