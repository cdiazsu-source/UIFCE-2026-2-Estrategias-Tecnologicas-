"use server";

import { revalidatePath } from "next/cache";
import type { ToolStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function parseVerifiedDate(raw: FormDataEntryValue | null): Date | null {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function addTool(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const status = String(formData.get("status") ?? "SIN_LICENCIA") as ToolStatus;
  const location = String(formData.get("location") ?? "").trim();
  const lastVerifiedAt = parseVerifiedDate(formData.get("lastVerifiedAt"));

  await prisma.tool.create({
    data: { name, status, location: location.length > 0 ? location : null, lastVerifiedAt },
  });

  revalidatePath("/herramientas");
}

export async function updateTool(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "SIN_LICENCIA") as ToolStatus;
  const location = String(formData.get("location") ?? "").trim();
  const lastVerifiedAt = parseVerifiedDate(formData.get("lastVerifiedAt"));

  await prisma.tool.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      status,
      location: location.length > 0 ? location : null,
      lastVerifiedAt,
    },
  });

  revalidatePath("/herramientas");
}

export async function deleteTool(id: string) {
  await prisma.tool.delete({ where: { id } });
  revalidatePath("/herramientas");
}
