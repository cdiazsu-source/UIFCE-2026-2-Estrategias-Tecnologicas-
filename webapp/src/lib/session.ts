import { cookies } from "next/headers";

import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export type Session = { authed: true; kind: "shared" } | { authed: false };

/** Sesión actual (server components / server actions). */
export async function getSession(): Promise<Session> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return (await verifyToken(token)) ? { authed: true, kind: "shared" } : { authed: false };
}

/** Úsalo al principio de cada server action que escribe. Con acceso compartido
 *  solo exige estar logueado; luego aplicará la matriz por rol. */
export async function requireSession(): Promise<Extract<Session, { authed: true }>> {
  const s = await getSession();
  if (!s.authed) throw new Error("No autenticado");
  return s;
}
