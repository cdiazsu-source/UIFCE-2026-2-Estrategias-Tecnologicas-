import { cookies } from "next/headers";

import { type AccessLevel, SESSION_COOKIE, VIEW_COOKIE, verifyToken } from "@/lib/auth";
import { DIRECTOR_WHO, isJuniorWho, viewProfile } from "@/lib/view-profiles";

export type Session =
  | {
      authed: true;
      /** Nivel efectivo: el del perfil que se está viendo con «Ver como» (un Junior ve como
       *  monitor; dirección y coordinación, con acceso completo). */
      level: AccessLevel;
      /** Identidad REAL de la credencial (para registrar la última visita). */
      who: string | null;
      /** Identidad efectiva: la del perfil que se ve con «Ver como», si hay uno; si no, `who`.
       *  Sirve para preseleccionar a la persona en «¿Quién eres?». */
      viewWho: string | null;
      /** Nivel real de la credencial (sin «Ver como»). */
      realLevel: AccessLevel;
      /** true = está usando «Ver como» (la app se muestra como la ve otro perfil). */
      viewing: boolean;
      /** Clave del perfil que se ve con «Ver como» (ver lib/view-profiles.ts), si hay uno concreto. */
      viewKey: string | null;
      /** true = esta sesión puede usar «Ver como» (máster, Lina y Santi: acceso completo y
       *  no es el director). */
      canViewAs: boolean;
      /** true = es la credencial compartida del máster (usuario MASTER): full y sin
       *  identidad nominal. Es quien ve el apartado "Desarrollador". */
      isMaster: boolean;
      /** Clave del perfil Junior cuya vista se muestra («junior-artes» / «junior-et»):
       *  la del propio monitor si entró con su credencial, o la elegida en «Ver como».
       *  null = sin perfil Junior concreto (no se restringe nada por persona). */
      juniorKey: string | null;
    }
  | { authed: false };

/** Sesión actual (server components / server actions). */
export async function getSession(): Promise<Session> {
  const jar = cookies();
  const v = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!v) return { authed: false };

  const canViewAs = v.level === "full" && v.who !== DIRECTOR_WHO;

  // Cookie «Ver como»: «as:<clave>» (actual); «junior:<clave>» y «junior» son de la versión anterior.
  const viewValue = canViewAs ? (jar.get(VIEW_COOKIE)?.value ?? "") : "";
  const profile = viewValue.startsWith("as:")
    ? viewProfile(viewValue.slice(3))
    : viewValue.startsWith("junior:")
      ? viewProfile(viewValue.slice("junior:".length))
      : null;
  // «junior» a secas: la vista de monitor sin un monitor concreto.
  const viewing = profile !== null || viewValue === "junior";
  const level: AccessLevel = profile ? profile.level : viewing ? "junior" : v.level;

  const isMaster = v.level === "full" && v.who === null;

  // Perfil Junior concreto: el del propio monitor, o el elegido en «Ver como».
  const juniorKey =
    v.level === "junior" && isJuniorWho(v.who) ? v.who : profile && isJuniorWho(profile.key) ? profile.key : null;

  return {
    authed: true,
    level,
    who: v.who,
    viewWho: profile ? profile.key : v.who,
    realLevel: v.level,
    viewing,
    viewKey: profile ? profile.key : null,
    canViewAs,
    isMaster,
    juniorKey,
  };
}

/** ¿Puede entrar al apartado "Desarrollador"? Solo el máster (usuario MASTER) y
 *  con «Ver como» apagado. Se valida en el servidor, no solo en el menú. */
export async function canUseDeveloper(): Promise<boolean> {
  const s = await getSession();
  return s.authed && s.isMaster && !s.viewing;
}

/** ¿La sesión puede editar? Solo el perfil "full" (y con «Ver como» un Junior apagado).
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

/** ¿La sesión puede registrar y actualizar contactos de «Empresas de interés» (anexar perfiles de LinkedIn, cambiar su
 *  avance, marcarlos revisados)? Perfil completo y Junior: el proyecto de rastreo de contactos lo lleva un Junior. Borrar
 *  contactos y gestionar las empresas sigue siendo del perfil completo. */
export async function canManageLeads(): Promise<boolean> {
  return (await getSession()).authed;
}

/** ¿La sesión puede planear y registrar horas del equipo (/horas)? Solo el máster (credencial MASTER) con «Ver como» apagado:
 *  los monitores Junior, la dirección y la coordinación consultan su contador. Se valida en el servidor, no solo en la pantalla. */
export async function canManageHours(): Promise<boolean> {
  const s = await getSession();
  return s.authed && s.isMaster && s.level === "full";
}
