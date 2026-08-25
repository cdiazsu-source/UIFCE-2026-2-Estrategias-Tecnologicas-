"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function updateSituationStat(id: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!label || !value) return;

  await prisma.situationStat.update({ where: { id }, data: { label, value } });
  revalidatePath("/");
}
