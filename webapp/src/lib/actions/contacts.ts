"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function addContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  if (!name || !role) return;

  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  await prisma.contact.create({
    data: {
      name,
      role,
      email: email.length > 0 ? email : null,
      phone: phone.length > 0 ? phone : null,
      notes: notes.length > 0 ? notes : null,
      projectId: projectId.length > 0 ? projectId : null,
    },
  });

  revalidatePath("/contactos");
}

export async function updateContact(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  await prisma.contact.update({
    where: { id },
    data: {
      ...(name.length > 0 ? { name } : {}),
      ...(role.length > 0 ? { role } : {}),
      email: email.length > 0 ? email : null,
      phone: phone.length > 0 ? phone : null,
      notes: notes.length > 0 ? notes : null,
      projectId: projectId.length > 0 ? projectId : null,
    },
  });

  revalidatePath("/contactos");
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contactos");
}
