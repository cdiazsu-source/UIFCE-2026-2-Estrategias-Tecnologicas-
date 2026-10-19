"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";
import { LEAD_KIND_LABEL, normalizeAlumni, normalizeKind, normalizeLinkedinUrl, normalizeStatus, parseList, parseTags } from "@/lib/company-leads";

/** Campos comunes del formulario de empresa. Vacío = null. */
function companyFields(formData: FormData) {
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const opt = (k: string) => (text(k).length > 0 ? text(k) : null);
  return {
    name: text("name"),
    sector: opt("sector"),
    logoUrl: opt("logoUrl"),
    linkedinUrl: normalizeLinkedinUrl(text("linkedinUrl")),
    notes: opt("notes"),
    tags: parseTags(text("tags")),
  };
}

export async function addTargetCompany(formData: FormData) {
  if (await blockedForJunior()) return;
  const { name, ...rest } = companyFields(formData);
  if (!name) return;

  await prisma.targetCompany.create({ data: { name, ...rest } });

  revalidatePath("/aliados");
}

export async function updateTargetCompany(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const { name, ...rest } = companyFields(formData);

  await prisma.targetCompany.update({
    where: { id },
    data: { ...(name.length > 0 ? { name } : {}), ...rest },
  });

  revalidatePath("/aliados");
}

export async function deleteTargetCompany(id: string) {
  if (await blockedForJunior()) return;
  await prisma.targetCompany.delete({ where: { id } });
  revalidatePath("/aliados");
}

/** Campos comunes del formulario de contacto. Si no se escribe el cargo, se usa el nombre del tipo. */
function leadFields(formData: FormData) {
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const kind = normalizeKind(formData.get("kind"));
  return {
    name: text("name"),
    kind,
    role: text("role") || LEAD_KIND_LABEL[kind],
    status: normalizeStatus(formData.get("status")),
    alumni: normalizeAlumni(formData.get("alumni")),
    linkedinUrl: text("linkedinUrl") || null,
    undergrad: text("undergrad").slice(0, 160) || null,
    postgrad: parseList(text("postgrad")),
    notes: text("notes") || null,
  };
}

export async function addCompanyLead(companyId: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const fields = leadFields(formData);
  if (!fields.name) return;

  await prisma.companyLead.create({ data: { companyId, ...fields } });

  revalidatePath("/aliados");
}

export async function updateCompanyLead(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const { name, ...rest } = leadFields(formData);

  await prisma.companyLead.update({
    where: { id },
    data: { ...(name.length > 0 ? { name } : {}), ...rest },
  });

  revalidatePath("/aliados");
}

/** Cambia solo el avance del contacto (selector en la fila). */
export async function setCompanyLeadStatus(id: string, status: string) {
  if (await blockedForJunior()) return;
  await prisma.companyLead.update({ where: { id }, data: { status: normalizeStatus(status) } });
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
