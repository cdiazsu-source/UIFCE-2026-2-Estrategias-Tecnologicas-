"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { canRecordMetrics } from "@/lib/session";
import { PROFILE_QUESTION_KEYS } from "@/lib/linkedin-profile-questions";

/** Guarda (o borra, si queda vacía) la respuesta a una pregunta de la
 *  plantilla de perfil. Una llamada por pregunta — así el autoguardado no
 *  depende de mandar el formulario completo. Mismo permiso que el resto del
 *  tracker de LinkedIn: perfil completo y junior. */
export async function saveProfileAnswer(trackeeId: string, questionKey: string, rawAnswer: string) {
  if (!(await canRecordMetrics())) return;
  if (!PROFILE_QUESTION_KEYS.has(questionKey)) return;

  const trackee = await prisma.linkedInTrackee.findUnique({ where: { id: trackeeId }, select: { id: true } });
  if (!trackee) return;

  const answer = rawAnswer.trim();

  if (answer.length === 0) {
    await prisma.linkedInProfileAnswer.deleteMany({ where: { trackeeId, questionKey } });
  } else {
    await prisma.linkedInProfileAnswer.upsert({
      where: { trackeeId_questionKey: { trackeeId, questionKey } },
      create: { trackeeId, questionKey, answer },
      update: { answer },
    });
  }

  revalidatePath("/linkedin");
}
