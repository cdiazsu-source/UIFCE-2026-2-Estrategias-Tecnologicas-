"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ROLES: UserRole[] = ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR", "COORDINADOR", "DIRECTOR"];

function parseRole(raw: FormDataEntryValue | null): UserRole {
  const value = String(raw ?? "");
  return (ROLES as string[]).includes(value) ? (value as UserRole) : "JUNIOR_AUXILIAR";
}

export async function addUser(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return;

  const area = String(formData.get("area") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const role = parseRole(formData.get("role"));

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      area: area.length > 0 ? area : null,
      photoUrl: photoUrl.length > 0 ? photoUrl : null,
      active: formData.get("active") !== "false",
    },
  });

  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
}

export async function updateUser(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const area = String(formData.get("area") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const role = parseRole(formData.get("role"));

  await prisma.user.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      ...(email.length > 0 ? { email } : {}),
      role,
      area: area.length > 0 ? area : null,
      photoUrl: photoUrl.length > 0 ? photoUrl : null,
      active: formData.get("active") !== "false",
    },
  });

  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
}

export async function deleteUser(id: string) {
  await prisma.user.delete({ where: { id } });
  revalidatePath("/equipo");
  revalidatePath("/proyectos-de-estudio");
}
