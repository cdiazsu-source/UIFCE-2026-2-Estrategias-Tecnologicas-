"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

const PATH = "/linea-grafica";

function normalizeHex(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (value.length === 0) return null;
  const withHash = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : null;
}

export async function addGuideline(formData: FormData) {
  if (await blockedForJunior()) return;
  const section = String(formData.get("section") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!section || !title || !body) return;

  const last = await prisma.brandGuideline.findFirst({
    where: { section },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.brandGuideline.create({
    data: {
      section,
      title,
      body,
      colorHex: normalizeHex(formData.get("colorHex")),
      order: (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(PATH);
}

export async function updateGuideline(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const section = String(formData.get("section") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  await prisma.brandGuideline.update({
    where: { id },
    data: {
      ...(section.length > 0 ? { section } : {}),
      ...(title.length > 0 ? { title } : {}),
      ...(body.length > 0 ? { body } : {}),
      colorHex: normalizeHex(formData.get("colorHex")),
    },
  });

  revalidatePath(PATH);
}

export async function deleteGuideline(id: string) {
  if (await blockedForJunior()) return;
  await prisma.brandGuideline.delete({ where: { id } });
  revalidatePath(PATH);
}
