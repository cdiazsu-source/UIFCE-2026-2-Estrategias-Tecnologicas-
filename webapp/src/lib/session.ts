import { cookies } from "next/headers";

import { type AccessLevel, SESSION_COOKIE, verifyToken } from "@/lib/auth";

export type Session =
  | { authed: true; level: AccessLevel; who: string | null }
  | { authed: false };

/** Sesión actual (server components / server actions). */
export async function getSession(): Promise<Session> {
  const v = await verifyToken(cookies().get(SESSION_COOKIE)?.value);
  return v ? { authed: true, level: v.level, who: v.who } : { authed: false };
}

/** ¿La sesión puede editar? Solo el perfil "full". El perfil "junior" ve todo
 *  pero solo agrega notas de bitácora. */
export async function canEdit(): Promise<boolean> {
  const s = await getSession();
  return s.authed && s.level === "full";
}

/** Poner al inicio de cada server action de escritura (salvo agregar notas):
 *  si la sesión no puede editar, corta en silencio. */
export async function blockedForJunior(): Promise<boolean> {
  return !(await canEdit());
}

/** ¿La sesión puede registrar mediciones de KPIs de redes? A diferencia del
 *  resto de escrituras, aquí el perfil "junior" SÍ tiene permiso (crear y
 *  editar); el borrado sigue reservado al perfil completo. Cualquier sesión
 *  autenticada (completa o junior) puede registrar. */
export async function canRecordMetrics(): Promise<boolean> {
  return (await getSession()).authed;
}

/** ¿La sesión puede gestionar el checklist (crear / editar / reordenar / marcar
 *  subtareas)? El perfil completo y el junior sí. El junior tiene una
 *  restricción extra: como responsable solo puede poner a un monitor Junior
 *  (se aplica en src/lib/actions/checklist.ts) y no puede borrar. */
export async function canManageChecklist(): Promise<boolean> {
  return (await getSession()).authed;
}
