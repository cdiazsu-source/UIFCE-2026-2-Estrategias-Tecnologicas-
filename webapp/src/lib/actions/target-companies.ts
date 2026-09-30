"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

export async function addTargetCompany(formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.targetCompany.create({
    data: { name, notes: notes.length > 0 ? notes : null },
  });

  revalidatePath("/aliados");
}

export async function updateTargetCompany(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.targetCompany.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      notes: notes.length > 0 ? notes : null,
    },
  });

  revalidatePath("/aliados");
}

export async function deleteTargetCompany(id: string) {
  if (await blockedForJunior()) return;
  await prisma.targetCompany.delete({ where: { id } });
  revalidatePath("/aliados");
}

export async function addCompanyLead(companyId: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!name || !role) return;

  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.companyLead.create({
    data: {
      companyId,
      name,
      role,
      linkedinUrl: linkedinUrl.length > 0 ? linkedinUrl : null,
      notes: notes.length > 0 ? notes : null,
    },
  });

  revalidatePath("/aliados");
}

export async function updateCompanyLead(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  await prisma.companyLead.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      ...(role.length > 0 ? { role } : {}),
      linkedinUrl: linkedinUrl.length > 0 ? linkedinUrl : null,
      notes: notes.length > 0 ? notes : null,
    },
  });

  revalidatePath("/aliados");
}

export async function deleteCompanyLead(id: string) {
  if (await blockedForJunior()) return;
  await prisma.companyLead.delete({ where: { id } });
  revalidatePath("/aliados");
}

/** Marca el perfil de LinkedIn de este lead como revisado ahora mismo —
 *  botón "Marcar revisado hoy", sin formulario de por medio. */
export async function markCompanyLeadChecked(id: string) {
  if (await blockedForJunior()) return;
  await prisma.companyLead.update({
    where: { id },
    data: { lastCheckedAt: new Date() },
  });
  revalidatePath("/aliados");
}
