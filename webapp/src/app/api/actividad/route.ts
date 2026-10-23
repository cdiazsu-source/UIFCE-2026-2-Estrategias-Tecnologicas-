import { NextResponse } from "next/server";

import { getTrackedWho, parseEvents, recordEvents } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** Recibe los lotes de la huella digital que manda `components/activity-tracker.tsx`. Solo guarda si la sesión es de un monitor Junior
 *  con su credencial propia; en cualquier otro caso responde 204 sin guardar nada. */
export async function POST(req: Request) {
  const who = await getTrackedWho();
  if (!who) return new NextResponse(null, { status: 204 });
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  try {
    await recordEvents(who, parseEvents(body));
  } catch {
    // La huella nunca debe romper la app (p. ej. si falta aplicar la migración).
  }
  return new NextResponse(null, { status: 204 });
}
