import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { SocialPanel, type SocialChannelData } from "@/components/social-panel";

export const dynamic = "force-dynamic";

const PLATFORM_RANK: Record<string, number> = {
  INSTAGRAM: 0,
  LINKEDIN: 1,
  X: 2,
  TIKTOK: 3,
  YOUTUBE: 4,
  FACEBOOK: 5,
};

export default async function RedesPage() {
  const [channels, people] = await Promise.all([
    prisma.socialChannel.findMany({
      include: {
        responsible: { select: { id: true, name: true } },
        project: { select: { id: true, title: true } },
        interactions: { orderBy: { at: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const data: SocialChannelData[] = [...channels]
    .sort((a, b) => (a.order - b.order) || (PLATFORM_RANK[a.platform] - PLATFORM_RANK[b.platform]))
    .map((c) => ({
      id: c.id,
      platform: c.platform,
      handle: c.handle,
      url: c.url,
      status: c.status,
      officialStatus: c.officialStatus,
      followers: c.followers,
      cadence: c.cadence,
      lastPostAt: c.lastPostAt,
      lastPostNote: c.lastPostNote,
      nextAction: c.nextAction,
      notes: c.notes,
      responsible: c.responsible ? { id: c.responsible.id, name: c.responsible.name } : null,
      project: c.project ? { id: c.project.id, title: c.project.title } : null,
      interactions: c.interactions.map((it) => ({
        id: it.id,
        at: it.at,
        title: it.title,
        detail: it.detail,
        followers: it.followers,
        reach: it.reach,
        interactions: it.interactions,
        url: it.url,
      })),
    }));

  const activas = data.filter((c) => c.status === "ACTIVA").length;
  const enRiesgo = data.filter((c) => c.status === "EN_RIESGO" || c.status === "PERDIDA").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Redes sociales
          <InfoHint text="Panel de control de las cuentas institucionales: estado operativo, oficialización, seguidores, última publicación, cadencia, responsable y próximo paso. Cómo se usa: con perfil completo, el lápiz de cada cuenta edita todos los campos y «Agregar cuenta» suma una plataforma. Todo se edita a mano — no consume APIs. Ejemplo: «Instagram · @ui_fce · En trámite · Oficialización en trámite»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.length} {data.length === 1 ? "cuenta" : "cuentas"} · {activas} activas · {enRiesgo} en riesgo o perdidas.
          Principio del semestre: calidad sobre cantidad.
        </p>
      </div>
      <SocialPanel channels={data} people={people} />
    </div>
  );
}
