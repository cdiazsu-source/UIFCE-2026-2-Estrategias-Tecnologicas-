"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { SESSION_MAX_AGE, VIEW_COOKIE } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { viewProfile } from "@/lib/view-profiles";

/** «Ver como»: la app se muestra tal como la ve otro perfil (Junior Artes, Junior ET,
 *  Dirección o Coordinación). La clave es la de `VIEW_PROFILES`. Solo la puede usar quien
 *  tiene `canViewAs` (máster, Lina, Santi; no el director). */
export async function viewAs(key: string) {
  const s = await getSession();
  if (!s.authed || !s.canViewAs || !viewProfile(key)) return;

  cookies().set(VIEW_COOKIE, `as:${key}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  revalidatePath("/", "layout");
}

/** Vuelve a la vista propia (borra la cookie de «Ver como»). */
export async function exitViewAs() {
  const s = await getSession();
  if (!s.authed || !s.canViewAs) return;

  cookies().delete(VIEW_COOKIE);
  revalidatePath("/", "layout");
}
