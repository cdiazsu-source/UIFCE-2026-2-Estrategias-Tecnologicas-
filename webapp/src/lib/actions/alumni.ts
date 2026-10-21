"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { blockedForJunior, canManageLeads } from "@/lib/session";
import { normalizeProfileUrl } from "@/lib/company-leads";
import { canonicalDegree, foldName, mergeCohorts, normalizeAlumniStatus, parseAlumniRows } from "@/lib/alumni";

const PATH = "/egresados";

/** Resultado de una acción del tracker: el formulario muestra el mensaje (o el motivo del rechazo). */
export type AlumniResult = { ok: true; message: string } | { ok: false; error: string };

const NO_PERMISSION: AlumniResult = { ok: false, error: "No tienes permiso para registrar egresados." };

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Agrega uno o varios egresados desde lo que se pega (ver `parseAlumniRows`): un nombre por línea o filas copiadas de la
 *  hoja de cálculo. El semestre y el área del formulario se aplican a todos. Si alguien ya está registrado (mismo nombre o
 *  mismo perfil de LinkedIn), no se duplica: solo se le suma el semestre, porque una misma persona suele aparecer en varios
 *  directorios. */
export async function addAlumniBulk(formData: FormData): Promise<AlumniResult> {
  if (!(await canManageLeads())) return NO_PERMISSION;

  const { rows, problems } = parseAlumniRows(text(formData, "text"));
  if (rows.length === 0) {
    return { ok: false, error: problems[0] ?? "Pega al menos un nombre (uno por línea) o filas copiadas de la hoja de cálculo." };
  }
  const cohort = text(formData, "cohort").slice(0, 40) || null;
  const area = text(formData, "area").slice(0, 40) || null;
  // Carrera elegida en el formulario: se aplica a quienes no la traen en la fila que se pegó.
  const defaultDegree = canonicalDegree(text(formData, "degree"));

  const existing = await prisma.alumnus.findMany({ select: { id: true, name: true, cohort: true, degree: true, linkedinUrl: true } });
  const byName = new Map(existing.map((e) => [foldName(e.name), e]));
  const byLink = new Map(existing.filter((e) => e.linkedinUrl).map((e) => [e.linkedinUrl as string, e]));

  const toCreate: typeof rows = [];
  const seenNow = new Set<string>();
  let merged = 0;
  for (const r of rows) {
    const key = foldName(r.name);
    if (seenNow.has(key)) continue;
    seenNow.add(key);
    const match = byName.get(key) ?? (r.linkedinUrl ? byLink.get(r.linkedinUrl) : undefined);
    if (match) {
      const next = mergeCohorts(match.cohort, cohort);
      const degree = match.degree ?? r.degree ?? defaultDegree;
      if (next !== match.cohort || degree !== match.degree) {
        await prisma.alumnus.update({ where: { id: match.id }, data: { cohort: next, degree } });
        match.cohort = next;
        match.degree = degree;
        merged++;
      }
      continue;
    }
    toCreate.push(r);
  }

  if (toCreate.length > 0) {
    await prisma.alumnus.createMany({
      data: toCreate.map((r) => ({
        name: r.name,
        cohort,
        area,
        degree: r.degree ?? defaultDegree,
        currentCompany: r.company,
        currentRole: r.role,
        linkedinUrl: r.linkedinUrl,
        // Con empresa o cargo ya anotados, se considera que su situación quedó verificada.
        status: r.company || r.role ? "VERIFICADO" : "POR_RASTREAR",
      })),
    });
  }
  revalidatePath(PATH);

  const skipped = rows.length - toCreate.length;
  if (toCreate.length === 0 && merged === 0) {
    return { ok: false, error: skipped === 1 ? "Esa persona ya está registrada." : "Esas personas ya están registradas." };
  }
  let message = toCreate.length === 1 ? "Se agregó 1 egresado." : `Se agregaron ${toCreate.length} egresados.`;
  if (skipped > 0) message += ` ${skipped} ya ${skipped === 1 ? "estaba registrado" : "estaban registrados"}${merged > 0 ? ` (a ${merged} se le completó el semestre o la carrera)` : ""}.`;
  if (problems.length > 0) message += ` ${problems.length} ${problems.length === 1 ? "línea se descartó" : "líneas se descartaron"}.`;
  return { ok: true, message };
}

export async function updateAlumnus(id: string, formData: FormData): Promise<AlumniResult> {
  if (!(await canManageLeads())) return NO_PERMISSION;
  const name = text(formData, "name");
  if (!name) return { ok: false, error: "El nombre no puede quedar vacío." };

  const rawUrl = text(formData, "linkedinUrl");
  let linkedinUrl: string | null = null;
  if (rawUrl) {
    const r = normalizeProfileUrl(rawUrl);
    if ("error" in r) return { ok: false, error: `Enlace de LinkedIn: ${r.error}.` };
    linkedinUrl = r.url;
    const dup = await prisma.alumnus.findFirst({ where: { linkedinUrl, NOT: { id } }, select: { name: true } });
    if (dup) return { ok: false, error: `Ese perfil ya está registrado: ${dup.name}.` };
  }

  await prisma.alumnus.update({
    where: { id },
    data: {
      name: name.slice(0, 120),
      cohort: text(formData, "cohort").slice(0, 40) || null,
      area: text(formData, "area").slice(0, 40) || null,
      degree: canonicalDegree(text(formData, "degree")),
      currentCompany: text(formData, "currentCompany").slice(0, 160) || null,
      currentRole: text(formData, "currentRole").slice(0, 160) || null,
      linkedinUrl,
      status: normalizeAlumniStatus(formData.get("status")),
      notes: text(formData, "notes") || null,
    },
  });
  revalidatePath(PATH);
  return { ok: true, message: "Egresado actualizado." };
}

/** Cambia solo el estado del egresado (selector en la fila). */
export async function setAlumnusStatus(id: string, status: string) {
  if (!(await canManageLeads())) return;
  await prisma.alumnus.update({ where: { id }, data: { status: normalizeAlumniStatus(status) } });
  revalidatePath(PATH);
}

/** Deja constancia de que se volvió a revisar a esta persona ahora mismo. */
export async function markAlumnusChecked(id: string) {
  if (!(await canManageLeads())) return;
  await prisma.alumnus.update({ where: { id }, data: { lastCheckedAt: new Date() } });
  revalidatePath(PATH);
}

export async function deleteAlumnus(id: string) {
  if (await blockedForJunior()) return;
  await prisma.alumnus.delete({ where: { id } });
  revalidatePath(PATH);
}
