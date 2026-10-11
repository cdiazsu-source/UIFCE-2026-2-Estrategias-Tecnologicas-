import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

/** Todo el sitio requiere sesión. Sin cookie válida → /login. */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifyToken(token)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Todo salvo: /login, assets de Next, iconos de pestaña (icon.png, apple-icon.png,
  // favicon.ico; el navegador los pide también antes de iniciar sesión) y las fotos
  // públicas de /avatares.
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|avatares).*)"],
};
