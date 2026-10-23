"use server";

import { revalidatePath } from "next/cache";

import { replaceProjectTemplates } from "@/lib/project-templates-data";
import { blockedForJunior } from "@/lib/session";
import type { HoursResult } from "@/lib/actions/hours";

/** Enlaza plantillas a un proyecto desde su página (perfil completo). Sus imágenes salen en el proyecto y en «Reunión coordinación». */
export async function setTemplatesForProject(projectId: string, templateIds: string[]): Promise<HoursResult> {
  if (await blockedForJunior()) return { ok: false, error: "Solo el perfil completo enlaza plantillas." };
  try {
    await replaceProjectTemplates(projectId, Array.isArray(templateIds) ? templateIds : []);
  } catch {
    return { ok: false, error: "No se pudo guardar. ¿Ya se aplicó la migración de plantillas por proyecto (db:deploy)?" };
  }
  revalidatePath(`/proyectos/${projectId}`);
  revalidatePath("/reunion");
  return { ok: true };
}
