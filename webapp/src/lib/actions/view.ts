"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isJuniorWho, SESSION_MAX_AGE, VIEW_COOKIE } from "@/lib/auth";
import { getSession } from "@/lib/session";

/** Fija (o borra) la cookie de la Vista Junior. Solo la puede usar quien tiene
 *  `canUseJuniorView` (máster, Lina, Santi; no el director). */
async function writeView(value: string | null) {
  const s = await getSession();
  if (!s.authed || !s.canUseJuniorView) return;

  const jar = cookies();
  if (value) {
    jar.set(VIEW_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  } else {
    jar.delete(VIEW_COOKIE);
  }
  revalidatePath("/", "layout");
}

/** Activa o desactiva la "Vista Junior" general (la app con los permisos de un
 *  monitor Junior, sin un monitor concreto). */
export async function setJuniorView(on: boolean) {
  await writeView(on ? "junior" : null);
}

/** «Ver como» un monitor concreto: la clave es la del perfil («junior-artes» /
 *  «junior-et»). Se ve exactamente lo que ve ese monitor: su saludo, sus proyectos
 *  asignados primero y solo su proyecto de estudio. */
export async function viewAsJunior(key: string) {
  if (!isJuniorWho(key)) return;
  await writeView(`junior:${key}`);
}
