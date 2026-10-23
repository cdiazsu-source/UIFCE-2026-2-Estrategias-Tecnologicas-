import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { loadCoordination } from "@/lib/coordination-data";
import { isSlideKey, parseSnapshot, type CoordData, type CoordTeam, type MeetingSummary, type TeamMember } from "@/lib/coordination";
import { USER_ROLE_LABEL } from "@/lib/utils";
import { CoordinationBoard } from "@/components/coordination-board";

export const dynamic = "force-dynamic";

/** Reunión coordinación: solo el máster (sin «Ver como»). `?reunion=<id>` abre una reunión guardada, solo lectura. */
export default async function ReunionPage({ searchParams }: { searchParams: { reunion?: string; pagina?: string; presentar?: string } }) {
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

  // Para el modo diseño: todos los proyectos (para agregar a una sección) y todas las plantillas (para enlazar sus imágenes).
  let projectOptions: { id: string; title: string; status: string }[] = [];
  let linkTemplates: { id: string; name: string; category: string }[] = [];
  if (!viewing) {
    try {
      projectOptions = await prisma.project.findMany({ orderBy: { sourceOrder: "asc" }, select: { id: true, title: true, status: true } });
      linkTemplates = await prisma.template.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }], select: { id: true, name: true, category: true } });
    } catch {
      projectOptions = [];
      linkTemplates = [];
    }
  }

  // Integrantes del área (máster primero) para la portada y el banner. Siempre en vivo: la foto no se guarda en las reuniones.
  let team: CoordTeam = { master: null, members: [] };
  try {
    const rows = await prisma.user.findMany({
      where: { active: true, area: "ET", role: { in: ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, photoUrl: true },
    });
    const all: (TeamMember & { role: string })[] = rows.map((u) => ({ id: u.id, name: u.name, role: u.role, roleLabel: USER_ROLE_LABEL[u.role] ?? u.role, photoUrl: u.photoUrl }));
    const strip = ({ role: _role, ...m }: TeamMember & { role: string }): TeamMember => m;
    const master = all.find((u) => u.role === "MASTER");
    team = { master: master ? strip(master) : null, members: all.filter((u) => u.role !== "MASTER").map(strip) };
  } catch {
    team = { master: null, members: [] };
  }

  const page = searchParams.pagina ?? "";
  return (
    <CoordinationBoard
      data={data}
      meetings={meetings}
      viewing={viewing}
      templates={templates}
      projectOptions={projectOptions}
      linkTemplates={linkTemplates}
      team={team}
      initialSlide={isSlideKey(page) ? page : "portada"}
      initialPresenting={searchParams.presentar === "1"}
    />
  );
}
