"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blockedForJunior } from "@/lib/session";

const ROLES: UserRole[] = ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR", "COORDINADOR", "DIRECTOR", "EQUIPO"];

function parseRole(raw: FormDataEntryValue | null): UserRole {
  const value = String(raw ?? "");
  return (ROLES as string[]).includes(value) ? (value as UserRole) : "JUNIOR_AUXILIAR";
}

function optStr(fd: FormData, k: string): string | null {
  const v = String(fd.get(k) ?? "").trim();
  return v.length > 0 ? v : null;
}

/** photoUrl del formulario: URL, nombre de archivo de /avatares/, o data URL
 *  (foto comprimida en el navegador). Descarta un data URL sin comprimir. */
function photoFromForm(fd: FormData): string | null {
  const v = optStr(fd, "photoUrl");
  if (v && v.startsWith("data:") && v.length > 400_000) return null;
  return v;
}

export async function addUser(formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return;

  const area = String(formData.get("area") ?? "").trim();
  const role = parseRole(formData.get("role"));

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      area: area.length > 0 ? area : null,
      photoUrl: photoFromForm(formData),
      linkedinUrl: optStr(formData, "linkedinUrl"),
      active: formData.get("active") !== "false",
    },
  });

  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
  revalidatePath("/");
}

export async function updateUser(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const area = String(formData.get("area") ?? "").trim();
  const role = parseRole(formData.get("role"));

  await prisma.user.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      ...(email.length > 0 ? { email } : {}),
      role,
      area: area.length > 0 ? area : null,
      photoUrl: photoFromForm(formData),
      linkedinUrl: optStr(formData, "linkedinUrl"),
      active: formData.get("active") !== "false",
    },
  });

  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
  revalidatePath("/");
}

/** Foto y LinkedIn de una persona (desde el roster del panel principal).
 *  photoUrl acepta una URL, un nombre de archivo de /avatares/, o un data URL
 *  (foto subida y comprimida en el navegador). */
export async function updateUserContact(id: string, formData: FormData) {
  if (await blockedForJunior()) return;
  await prisma.user.update({
    where: { id },
    data: { photoUrl: photoFromForm(formData), linkedinUrl: optStr(formData, "linkedinUrl") },
  });
  revalidatePath("/");
  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
}

export async function deleteUser(id: string) {
  if (await blockedForJunior()) return;
  await prisma.user.delete({ where: { id } });
  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
}
