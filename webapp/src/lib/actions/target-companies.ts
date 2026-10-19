"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, canManageLeads } from "@/lib/session";
import {
  LEAD_KIND_LABEL,
  normalizeAlumni,
  normalizeKind,
  normalizeLinkedinUrl,
  normalizeProfileUrl,
  normalizeStatus,
  parseList,
  parseProfileLinks,
  parseTags,
} from "@/lib/company-leads";

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

/** Resultado de una acción sobre contactos: el formulario muestra el mensaje (o el motivo del rechazo). */
export type LeadResult = { ok: true; message: string } | { ok: false; error: string };

const NO_PERMISSION: LeadResult = { ok: false, error: "No tienes permiso para registrar contactos." };

/** Campos comunes del formulario de un contacto (sin el enlace, que se valida aparte). Si no se escribe el cargo,
 *  se usa el nombre del tipo. */
function leadFields(formData: FormData) {
  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const kind = normalizeKind(formData.get("kind"));
  return {
    name: text("name"),
    kind,
    role: text("role") || LEAD_KIND_LABEL[kind],
    status: normalizeStatus(formData.get("status")),
    alumni: normalizeAlumni(formData.get("alumni")),
    undergrad: text("undergrad").slice(0, 160) || null,
    postgrad: parseList(text("postgrad")),
    notes: text("notes") || null,
  };
}

/** Anexa uno o varios perfiles de LinkedIn a una empresa: el formulario trae el texto pegado (`links`: un enlace, o
 *  varios uno por línea) y el tipo de contacto. Con un solo enlace se usan también el nombre, el cargo y los demás datos
 *  del formulario; con varios, el nombre se deduce de cada enlace (se edita después). Sin enlace, se puede guardar a
 *  alguien solo con su nombre. Rechaza enlaces que no son un perfil y perfiles que ya están registrados. */
export async function addCompanyLeadsFromLinks(companyId: string, formData: FormData): Promise<LeadResult> {
  if (!(await canManageLeads())) return NO_PERMISSION;
  const company = await prisma.targetCompany.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) return { ok: false, error: "No encontré la empresa; recarga la página." };

  const text = (k: string) => String(formData.get(k) ?? "").trim();
  const { profiles, problems } = parseProfileLinks(text("links"));
  const { name: _name, role: _role, ...common } = leadFields(formData);
  const kind = common.kind;
  const typedName = text("name");
  const typedRole = text("role") || LEAD_KIND_LABEL[kind];

  if (profiles.length === 0) {
    if (problems.length > 0) return { ok: false, error: `${problems[0].raw}: ${problems[0].error}.` };
    if (!typedName) {
      return { ok: false, error: "Pega el enlace del perfil de LinkedIn (linkedin.com/in/…) o, al menos, escribe el nombre." };
    }
    await prisma.companyLead.create({ data: { companyId, ...common, name: typedName, role: typedRole, linkedinUrl: null } });
    revalidatePath("/aliados");
    return { ok: true, message: `Se agregó a ${typedName} (sin enlace todavía).` };
  }

  const existing = await prisma.companyLead.findMany({
    where: { linkedinUrl: { in: profiles.map((p) => p.url) } },
    select: { linkedinUrl: true, name: true, company: { select: { name: true } } },
  });
  const known = new Map(existing.map((e) => [e.linkedinUrl, e]));
  const fresh = profiles.filter((p) => !known.has(p.url));
  if (fresh.length === 0) {
    const d = known.get(profiles[0].url)!;
    return { ok: false, error: `Ese perfil ya está registrado: ${d.name} (${d.company.name}).` };
  }

  const single = profiles.length === 1;
  if (single && !typedName && !fresh[0].name) {
    return { ok: false, error: "No pude deducir el nombre desde el enlace: escríbelo en «Nombre»." };
  }

  await prisma.companyLead.createMany({
    data: fresh.map((p) => ({
      companyId,
      ...common,
      name: single ? typedName || p.name : p.name || "Sin nombre (editar)",
      role: single ? typedRole : LEAD_KIND_LABEL[kind],
      linkedinUrl: p.url,
    })),
  });
  revalidatePath("/aliados");

  const first = single ? typedName || fresh[0].name : "";
  let message = single ? `Se agregó a ${first}.` : `Se agregaron ${fresh.length} contactos.`;
  const skipped = profiles.length - fresh.length;
  if (skipped > 0) message += ` ${skipped} ya ${skipped === 1 ? "estaba registrado" : "estaban registrados"}.`;
  if (problems.length > 0) message += ` ${problems.length} ${problems.length === 1 ? "enlace se descartó" : "enlaces se descartaron"} por no ser un perfil.`;
  return { ok: true, message };
}

export async function updateCompanyLead(id: string, formData: FormData): Promise<LeadResult> {
  if (!(await canManageLeads())) return NO_PERMISSION;
  const { name, ...rest } = leadFields(formData);

  const rawUrl = String(formData.get("linkedinUrl") ?? "").trim();
  let linkedinUrl: string | null = null;
  if (rawUrl) {
    const r = normalizeProfileUrl(rawUrl);
    if ("error" in r) return { ok: false, error: `Enlace de LinkedIn: ${r.error}.` };
    linkedinUrl = r.url;
    const dup = await prisma.companyLead.findFirst({
      where: { linkedinUrl, NOT: { id } },
      select: { name: true, company: { select: { name: true } } },
    });
    if (dup) return { ok: false, error: `Ese perfil ya está registrado: ${dup.name} (${dup.company.name}).` };
  }

  await prisma.companyLead.update({
    where: { id },
    data: { ...(name.length > 0 ? { name } : {}), ...rest, linkedinUrl },
  });

  revalidatePath("/aliados");
  return { ok: true, message: "Contacto actualizado." };
}

/** Cambia solo el avance del contacto (selector en la fila). */
export async function setCompanyLeadStatus(id: string, status: string) {
  if (!(await canManageLeads())) return;
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
  if (!(await canManageLeads())) return;
  await prisma.companyLead.update({
    where: { id },
    data: { lastCheckedAt: new Date() },
  });
  revalidatePath("/aliados");
}
