/**
 * Autenticación mínima: un acceso compartido (usuario + contraseña únicos) que
 * protege TODO el sitio. Diseñado para reemplazarse por enlace mágico por correo
 * + cuentas por persona sin tocar los call-sites:
 *
 *  - `verifyToken` / la cookie de sesión no cambian.
 *  - Hoy el `middleware.ts` protege TODO el sitio (páginas y POST de server
 *    actions): sin cookie válida → /login. Con acceso compartido, todo el que
 *    entra puede editar todo.
 *  - Mañana `getSession()` (src/lib/session.ts) devolverá
 *    { authed, kind: "user", userId, role } y cada server action de escritura
 *    llamará `requireSession()` + un `can(session, accion)` que aplique la matriz.
 *
 * Este módulo NO importa `next/headers` para poder usarse también en el
 * middleware (Edge). El acceso a cookies vive en src/lib/session.ts.
 *
 * Matriz de permisos objetivo (aún NO se aplica — con acceso compartido todos
 * pueden editar todo):
 *  - MASTER / COORDINADOR / DIRECTOR: editan todo.
 *  - JUNIOR_ARTES / JUNIOR_AUXILIAR: marcan y editan subtareas y dejan notas en
 *    cualquier proyecto; editan solo SUS proyectos de estudio; no borran
 *    proyectos ni tocan Equipo / Herramientas / Situación / Línea gráfica.
 */
export const SESSION_COOKIE = "et_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export const SITE_USER = process.env.SITE_USER || "UIFCE";
const SITE_PASSWORD = process.env.SITE_PASSWORD || "ET2026";
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

/** Comprueba usuario + contraseña del acceso compartido. */
export function checkCredentials(username: string, password: string): boolean {
  return username.trim() === SITE_USER && password === SITE_PASSWORD;
}

/** Token firmado para la cookie de sesión. */
export async function signToken(): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ v: 1, t: Date.now() })).buffer);
  return `${payload}.${await hmac(payload)}`;
}

/** Valida el token (firma + antigüedad). Sirve en Edge (middleware) y en Node. */
export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (sig !== (await hmac(payload))) return false;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.t !== "number") return false;
    return Date.now() - json.t < SESSION_MAX_AGE * 1000;
  } catch {
    return false;
  }
}
