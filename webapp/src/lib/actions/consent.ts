"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { CONSENT_PROJECT_ID } from "@/lib/consent";

function str(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

function revalidate() {
  revalidatePath(`/proyectos/${CONSENT_PROJECT_ID}`);
  revalidatePath("/");
}

export async function setConsentSigned(id: string, signed: boolean) {
  if (await blockedForJunior()) return;
  await prisma.consentSignatory.update({
    where: { id },
    data: { signed, signedAt: signed ? new Date() : null },
  });
  revalidate();
}

export async function setConsentDriveAccess(id: string, driveAccess: boolean) {
  if (await blockedForJunior()) return;
  await prisma.consentSignatory.update({
    where: { id },
    data: { driveAccess, driveAccessAt: driveAccess ? new Date() : null },
  });
  revalidate();
}

export async function updateConsentDriveUrl(id: string, driveFolderUrl: string) {
  if (await blockedForJunior()) return;
  const trimmed = driveFolderUrl.trim();
  await prisma.consentSignatory.update({
    where: { id },
    data: { driveFolderUrl: trimmed.length > 0 ? trimmed : null },
  });
  revalidate();
}

export async function addConsentSignatory(formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const top = await prisma.consentSignatory.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.consentSignatory.create({
    data: {
      name,
      driveFolderUrl: str(formData, "driveFolderUrl"),
      order: (top?.order ?? 0) + 1,
    },
  });
  revalidate();
}

export async function updateConsentSignatory(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  await prisma.consentSignatory.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      driveFolderUrl: str(formData, "driveFolderUrl"),
      active: formData.get("active") !== "false",
    },
  });
  revalidate();
}

export async function deleteConsentSignatory(id: string) {
  if (await blockedForJunior()) return;
  await prisma.consentSignatory.delete({ where: { id } });
  revalidate();
}
