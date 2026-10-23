import { NextResponse } from "next/server";

import { loadWelcome } from "@/lib/welcome";
import type { FootprintRange } from "@/lib/welcome-types";

export const dynamic = "force-dynamic";

const RANGES: FootprintRange[] = ["7", "30", "semestre"];

/** Datos de la capa de bienvenida de la sesión actual (ver lib/welcome.ts). `?rango=` solo cambia la huella del máster. */
export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("rango") ?? "7";
  const range = (RANGES as string[]).includes(param) ? (param as FootprintRange) : "7";
  const data = await loadWelcome(range);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
