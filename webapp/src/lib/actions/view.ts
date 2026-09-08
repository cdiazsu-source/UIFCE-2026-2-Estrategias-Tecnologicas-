"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { SESSION_MAX_AGE, VIEW_COOKIE } from "@/lib/auth";
import { getSession } from "@/lib/session";

/** Activa o desactiva la "Vista Junior". Solo la puede usar el máster (sesión
 *  completa que no es la del director). */
export async function setJuniorView(on: boolean) {
  const s = await getSession();
  if (!s.authed || !s.canUseJuniorView) return;

  const jar = cookies();
  if (on) {
    jar.set(VIEW_COOKIE, "junior", {
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
