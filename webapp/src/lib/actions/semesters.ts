"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

/** Crea un semestre nuevo (vacío). No lo marca como vigente. */
export async function createSemester(formData: FormData) {
  if (await blockedForJunior()) return;
  const label = String(formData.get("label") ?? "").trim().slice(0, 20);
  if (!label) return;

  const exists = await prisma.semester.findUnique({ where: { label }, select: { id: true } });
  if (exists) return;

  const top = await prisma.semester.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.semester.create({ data: { label, order: (top?.order ?? -1) + 1 } });
  revalidatePath("/");
}

/** Marca un semestre como el vigente (el que se muestra por defecto). */
export async function setCurrentSemester(id: string) {
  if (await blockedForJunior()) return;
  const target = await prisma.semester.findUnique({ where: { id }, select: { id: true } });
  if (!target) return;

  await prisma.$transaction([
    prisma.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
    prisma.semester.update({ where: { id }, data: { isCurrent: true } }),
  ]);
  revalidatePath("/");
}

export async function renameSemester(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const label = String(formData.get("label") ?? "").trim().slice(0, 20);
  if (!label) return;
  const clash = await prisma.semester.findFirst({ where: { label, NOT: { id } }, select: { id: true } });
  if (clash) return;
  await prisma.semester.update({ where: { id }, data: { label } });
  revalidatePath("/");
}

/** Reemplaza la lista de objetivos del semestre (uno por línea). */
export async function updateSemesterObjectives(id: string, objectivesText: string) {
  if (await blockedForJunior()) return;
  const objectives = objectivesText
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 20);
  await prisma.semester.update({ where: { id }, data: { objectives } });
  revalidatePath("/");
}

/** Borra un semestre solo si no tiene proyectos y no es el vigente. */
export async function deleteSemester(id: string) {
  if (await blockedForJunior()) return;
  const sem = await prisma.semester.findUnique({
    where: { id },
    select: { isCurrent: true, _count: { select: { projects: true } } },
  });
  if (!sem || sem.isCurrent || sem._count.projects > 0) return;
  await prisma.semester.delete({ where: { id } });
  revalidatePath("/");
}
