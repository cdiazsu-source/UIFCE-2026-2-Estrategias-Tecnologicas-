import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { loadCoordination } from "@/lib/coordination-data";
import { parseSnapshot, type CoordData, type MeetingSummary } from "@/lib/coordination";
import { CoordinationBoard } from "@/components/coordination-board";

export const dynamic = "force-dynamic";

/** Reunión coordinación: solo el máster (sin «Ver como»). `?reunion=<id>` abre una reunión guardada, solo lectura. */
export default async function ReunionPage({ searchParams }: { searchParams: { reunion?: string } }) {
  if (!(await canUseDeveloper())) redirect("/");

  // Reuniones guardadas: tabla nueva; sin la migración, el historial avisa y el resto sale.
  let meetings: MeetingSummary[] | null = null;
  try {
    const rows = await prisma.coordinationMeeting.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], select: { id: true, date: true, label: true } });
    meetings = rows.map((m) => ({ id: m.id, date: m.date.toISOString().slice(0, 10), label: m.label ?? "" }));
  } catch {
    meetings = null;
  }

  let data: CoordData | null = null;
  let viewing: MeetingSummary | null = null;
  if (searchParams.reunion && meetings) {
    const found = meetings.find((m) => m.id === searchParams.reunion);
    if (found) {
      try {
        const row = await prisma.coordinationMeeting.findUnique({ where: { id: found.id }, select: { snapshot: true } });
        data = parseSnapshot(row?.snapshot);
        if (data) viewing = found;
      } catch {
        data = null;
      }
    }
  }
  if (!data) data = await loadCoordination();

  // Plantillas con imagen o GIF para elegir en el modo diseño (sin traer la imagen: se pide aparte por /api/plantillas-imagen/<id>).
  let templates: { id: string; name: string; category: string }[] = [];
  if (!viewing) {
    try {
      templates = await prisma.template.findMany({
        where: { NOT: [{ screenshot: null }, { screenshot: "" }] },
        orderBy: [{ category: "asc" }, { order: "asc" }],
        select: { id: true, name: true, category: true },
      });
    } catch {
      templates = [];
    }
  }

  return <CoordinationBoard data={data} meetings={meetings} viewing={viewing} templates={templates} />;
}
