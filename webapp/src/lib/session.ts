import { cookies } from "next/headers";

import { type AccessLevel, DIRECTOR_WHO, isJuniorWho, SESSION_COOKIE, VIEW_COOKIE, verifyToken } from "@/lib/auth";

export type Session =
  | {
      authed: true;
      /** Nivel efectivo: "junior" si la Vista Junior está activa. */
      level: AccessLevel;
      who: string | null;
      /** Nivel real de la credencial (sin la Vista Junior). */
      realLevel: AccessLevel;
      /** true = está viendo la app como Junior. */
      viewingAsJunior: boolean;
      /** true = esta sesión puede activar la Vista Junior (máster: full y no director). */
      canUseJuniorView: boolean;
      /** true = es la credencial compartida del máster (usuario MASTER): full y sin
       *  identidad nominal. Es quien ve el apartado "Desarrollador". */
      isMaster: boolean;
      /** Clave del perfil Junior cuya vista se muestra («junior-artes» / «junior-et»):
       *  la del propio monitor si entró con su credencial, o la elegida por el máster en
       *  «Ver como». null = sin perfil Junior concreto (no se restringe nada por persona). */
      juniorKey: string | null;
    }
  | { authed: false };

/** Sesión actual (server components / server actions). */
export async function getSession(): Promise<Session> {
  const jar = cookies();
  const v = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!v) return { authed: false };

  const canUseJuniorView = v.level === "full" && v.who !== DIRECTOR_WHO;
  const viewValue = jar.get(VIEW_COOKIE)?.value ?? "";
  const viewingAsJunior = canUseJuniorView && (viewValue === "junior" || viewValue.startsWith("junior:"));
  const level: AccessLevel = viewingAsJunior ? "junior" : v.level;

  const isMaster = v.level === "full" && v.who === null;

  // Perfil Junior concreto: el del propio monitor, o el elegido en «Ver como».
  const viewKey = viewValue.startsWith("junior:") ? viewValue.slice("junior:".length) : null;
  const juniorKey =
    v.level === "junior" && isJuniorWho(v.who) ? v.who : viewingAsJunior && isJuniorWho(viewKey) ? viewKey : null;

  return {
    authed: true,
    level,
    who: v.who,
    realLevel: v.level,
    viewingAsJunior,
    canUseJuniorView,
    isMaster,
    juniorKey,
  };
}

/** ¿Puede entrar al apartado "Desarrollador"? Solo el máster (usuario MASTER) y
 *  con la Vista Junior apagada. Se valida en el servidor, no solo en el menú. */
export async function canUseDeveloper(): Promise<boolean> {
  const s = await getSession();
  return s.authed && s.isMaster && !s.viewingAsJunior;
}

/** ¿La sesión puede editar? Solo el perfil "full" (y con la Vista Junior apagada).
 *  El perfil "junior" ve todo pero solo hace lo que un monitor puede. */
export async function canEdit(): Promise<boolean> {
  const s = await getSession();
  return s.authed && s.level === "full";
}

/** Poner al inicio de cada server action de escritura (salvo las que el junior
 *  sí puede): si la sesión no puede editar, corta en silencio. */
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

/** ¿La sesión puede gestionar el panel de consentimientos de uso de imagen?
 *  Perfil completo y junior: los monitores lo manejan por completo. */
export async function canManageConsent(): Promise<boolean> {
  return (await getSession()).authed;
}
