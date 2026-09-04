"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

/** Actualiza la ficha del área: descripción corporativa y objetivos generales
 *  (uno por línea). Singleton con id "area". */
export async function updateAreaProfile(formData: FormData) {
  if (await blockedForJunior()) return;
  const description = String(formData.get("description") ?? "").trim();
  const objectives = String(formData.get("objectives") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 20);

  await prisma.areaProfile.upsert({
    where: { id: "area" },
    update: { description, objectives },
    create: { id: "area", description, objectives },
  });
  revalidatePath("/");
}
