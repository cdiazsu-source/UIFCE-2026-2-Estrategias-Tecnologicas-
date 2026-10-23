import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Imagen o GIF de la captura de una plantilla, para «Reunión coordinación». La captura se guarda como data URL, enlace o archivo de /public;
 *  aquí se entrega como imagen. Solo con sesión. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session.authed) return new NextResponse(null, { status: 401 });

  let src: string | null = null;
  try {
    src = (await prisma.template.findUnique({ where: { id: params.id }, select: { screenshot: true } }))?.screenshot ?? null;
  } catch {
    src = null;
  }
  if (!src) return new NextResponse(null, { status: 404 });

  const data = /^data:(image\/[\w.+-]+);base64,([\s\S]+)$/.exec(src);
  if (data) {
    return new NextResponse(Buffer.from(data[2], "base64"), { headers: { "Content-Type": data[1], "Cache-Control": "private, max-age=300" } });
  }
  if (/^https?:\/\//i.test(src) || (src.startsWith("/") && !src.startsWith("//"))) {
    return NextResponse.redirect(new URL(src, req.url));
  }
  return new NextResponse(null, { status: 404 });
}
