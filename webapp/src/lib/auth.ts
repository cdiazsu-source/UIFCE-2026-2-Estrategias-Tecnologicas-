/**
 * Autenticación mínima: acceso compartido con dos perfiles + credenciales
 * nominales para personas puntuales. Protege TODO el sitio (middleware.ts):
 * sin cookie válida → /login.
 *
 *  - Perfil "full"   (usuario UIFCE / contraseña ET2026): edita todo.
 *  - Perfil "junior" (usuario UIFCE / contraseña TEAM):   ve todo, solo agrega
 *    notas de bitácora. El resto es de solo lectura.
 *  - Credenciales nominales (ver NAMED_CREDENTIALS): acceso total ("full"),
 *    pero identificado — su cookie lleva `who` y el layout registra su
 *    última visita en User.lastSeenAt (por credentialKey). Hoy: el director
 *    y, como colaboradores de Coordinación, Lina y Santi.
 *
 * El nivel y la identidad viajan firmados en la cookie. Diseñado para pasar más
 * adelante a enlace mágico por correo + cuentas por persona sin tocar los
 * call-sites.
 *
 * Este módulo NO importa `next/headers` para poder usarse también en el
 * middleware (Edge). El acceso a cookies vive en src/lib/session.ts.
 */
export const SESSION_COOKIE = "et_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/** Cookie de "Vista Junior": si vale "junior" y la sesión real es completa y no
 *  es la del director, la app se comporta como si fuera perfil junior (para que
 *  el máster pueda revisar qué ven y qué pueden hacer los monitores). */
export const VIEW_COOKIE = "et_view";

export type AccessLevel = "full" | "junior";

/** Resultado de validar credenciales: nivel de acceso y, si la credencial es
 *  nominal, una clave estable de identidad (`who`) que casa con
 *  User.credentialKey. Las credenciales compartidas devuelven who = null. */
export type CredentialCheck = { level: AccessLevel; who: string | null };

export const SITE_USER = process.env.SITE_USER || "UIFCE";
const PASS_FULL = process.env.SITE_PASSWORD || "ET2026";
const PASS_JUNIOR = process.env.SITE_PASSWORD_JUNIOR || "TEAM";

/** Clave de identidad del director; debe coincidir con User.credentialKey.
 *  Se mantiene aparte (no solo como entrada de NAMED_CREDENTIALS) porque
 *  session.ts la usa para excluir al director de la "Vista Junior". */
export const DIRECTOR_WHO = "henry-sarmiento";

/** Credenciales nominales: cada una da acceso "full" pero identificado — el
 *  usuario distingue mayúsculas. Todas configurables por entorno en Vercel
 *  (SITE_USER_<X> / SITE_PASSWORD_<X>) sin tocar el código. `who` debe
 *  coincidir con el User.credentialKey de la persona (ver prisma/seed.ts). */
const NAMED_CREDENTIALS: { user: string; pass: string; who: string }[] = [
  { user: process.env.SITE_USER_DIRECTOR || "HENRY", pass: process.env.SITE_PASSWORD_DIRECTOR || "UIFCEUNAL310.", who: DIRECTOR_WHO },
  { user: process.env.SITE_USER_LINA || "LINA", pass: process.env.SITE_PASSWORD_LINA || "ET", who: "lina-sanabria" },
  { user: process.env.SITE_USER_SANTI || "SANTI", pass: process.env.SITE_PASSWORD_SANTI || "ET", who: "santiago-parra" },
];

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

/** Devuelve nivel + identidad si usuario+contraseña son válidos, o null. */
export function checkCredentials(username: string, password: string): CredentialCheck | null {
  const user = username.trim();

  for (const cred of NAMED_CREDENTIALS) {
    if (user === cred.user && password === cred.pass) return { level: "full", who: cred.who };
  }
  if (user === SITE_USER) {
    if (password === PASS_FULL) return { level: "full", who: null };
    if (password === PASS_JUNIOR) return { level: "junior", who: null };
  }
  return null;
}

/** Token firmado para la cookie de sesión, con el nivel de acceso y el `who`. */
export async function signToken(level: AccessLevel, who: string | null): Promise<string> {
  const payload = b64url(
    enc.encode(JSON.stringify({ v: 2, t: Date.now(), a: level, w: who ?? null })).buffer,
  );
  return `${payload}.${await hmac(payload)}`;
}

export type VerifiedToken = { level: AccessLevel; who: string | null };

/** Nivel + identidad del token si es válido (firma + antigüedad), o null.
 *  Sirve en Edge (middleware) y en Node. Acepta tokens v1 (sin `who`). */
export async function verifyToken(token: string | undefined | null): Promise<VerifiedToken | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (sig !== (await hmac(payload))) return null;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.t !== "number") return null;
    if (Date.now() - json.t >= SESSION_MAX_AGE * 1000) return null;
    return {
      level: json.a === "junior" ? "junior" : "full",
      who: typeof json.w === "string" && json.w.length > 0 ? json.w : null,
    };
  } catch {
    return null;
  }
}
