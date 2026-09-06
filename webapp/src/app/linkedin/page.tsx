import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { LinkedInTracker, type TrackeeData } from "@/components/linkedin-tracker";

export const dynamic = "force-dynamic";

const VALUE_KEYS = [
  "profileScore",
  "connections",
  "followers",
  "ssi",
  "postsLast30",
  "engagementLast30",
  "recommendations",
  "certsPublished",
  "pageViews",
  "impressions",
] as const;

export default async function LinkedInPage() {
  const [trackees, people] = await Promise.all([
    prisma.linkedInTrackee.findMany({
      orderBy: [{ kind: "desc" }, { order: "asc" }],
      include: {
        user: { select: { photoUrl: true, color: true } },
        snapshots: { orderBy: { month: "asc" } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const data: TrackeeData[] = trackees.map((t) => ({
    id: t.id,
    kind: t.kind,
    name: t.name,
    linkedinUrl: t.linkedinUrl,
    area: t.area,
    level: t.level,
    active: t.active,
    photoUrl: t.user?.photoUrl ?? null,
    color: t.user?.color ?? null,
    snapshots: t.snapshots.map((s) => {
      const values: Record<string, number | boolean | null> = {};
      for (const k of VALUE_KEYS) values[k] = s[k];
      values.uifceExperience = s.uifceExperience;
      values.creatorMode = s.creatorMode;
      values.engagementRate = s.engagementRate;
      return {
        id: s.id,
        month: s.month,
        note: s.note,
        recordedByName: s.recordedByName,
        values,
      };
    }),
  }));

  const withData = data.filter((t) => t.snapshots.length > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          LinkedIn
          <InfoHint text="Seguimiento mensual de LinkedIn de la Unidad y del equipo, para la estrategia de marca empleadora. Arriba, la página institucional (seguidores, visitas, impresiones, tasa de interacción). Abajo, una ficha por persona con su profile score (0–100), conexiones, seguidores, SSI, publicaciones, interacciones, recomendaciones y certificados. Cómo se usa: elige el mes, «Registrar medición» en cada ficha (lo hace el junior coordinador; el perfil junior puede crear y editar, borrar es del perfil completo). Todo se ingresa a mano — no consume APIs. Ejemplo: «Cesar Diaz · sep 2026 · profile score 70 · 520 conexiones · SSI 48»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.length} en seguimiento · {withData} con mediciones. Principio del semestre: calidad sobre cantidad.
        </p>
      </div>
      <LinkedInTracker trackees={data} people={people} />
    </div>
  );
}
