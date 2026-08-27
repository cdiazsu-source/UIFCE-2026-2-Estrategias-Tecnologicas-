/**
 * Autenticación mínima: acceso compartido con dos perfiles, ambos con el mismo
 * usuario. Protege TODO el sitio (middleware.ts): sin cookie válida → /login.
 *
 *  - Perfil "full"  (contraseña ET2026): edita todo.
 *  - Perfil "junior" (contraseña TEAM):  ve todo, pero solo puede agregar notas
 *    de bitácora a los proyectos. El resto es de solo lectura.
 *
 * El nivel viaja firmado en la cookie. Diseñado para pasar más adelante a enlace
 * mágico por correo + cuentas por persona sin tocar los call-sites: `getSession()`
 * pasará a devolver { userId, role } y `canEdit()` aplicará la matriz por rol.
 *
 * Este módulo NO importa `next/headers` para poder usarse también en el
 * middleware (Edge). El acceso a cookies vive en src/lib/session.ts.
 */
export const SESSION_COOKIE = "et_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export type AccessLevel = "full" | "junior";

export const SITE_USER = process.env.SITE_USER || "UIFCE";
const PASS_FULL = process.env.SITE_PASSWORD || "ET2026";
const PASS_JUNIOR = process.env.SITE_PASSWORD_JUNIOR || "TEAM";
const SECRET = process.env.AUTH_SECRET || "et-en-marcha-dev-secret-cambiar-en-vercel";

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  let s = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(sig);
}

/** Devuelve el nivel de acceso si usuario+contraseña son válidos, o null. */
export function checkCredentials(username: string, password: string): AccessLevel | null {
  if (username.trim() !== SITE_USER) return null;
  if (password === PASS_FULL) return "full";
  if (password === PASS_JUNIOR) return "junior";
  return null;
}

/** Token firmado para la cookie de sesión, con el nivel de acceso. */
export async function signToken(level: AccessLevel): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ v: 1, t: Date.now(), a: level })).buffer);
  return `${payload}.${await hmac(payload)}`;
}

/** Nivel de acceso del token si es válido (firma + antigüedad), o null.
 *  Sirve en Edge (middleware) y en Node. */
export async function verifyToken(token: string | undefined | null): Promise<AccessLevel | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sig !== (await hmac(payload))) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.t !== "number") return null;
    if (Date.now() - json.t >= SESSION_MAX_AGE * 1000) return null;
    return json.a === "junior" ? "junior" : "full";
  } catch {
    return null;
  }
}
