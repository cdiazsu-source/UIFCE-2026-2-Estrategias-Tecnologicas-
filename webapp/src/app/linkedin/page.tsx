import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { LinkedInTracker, type OrgSummary, type TrackeeData } from "@/components/linkedin-tracker";

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
] as const;

export default async function LinkedInPage() {
  const [trackees, people, liChannel] = await Promise.all([
    prisma.linkedInTrackee.findMany({
      orderBy: { order: "asc" },
      include: {
        user: { select: { photoUrl: true, color: true, area: true } },
        snapshots: { orderBy: { month: "asc" } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.socialChannel.findUnique({
      where: { platform: "LINKEDIN" },
      select: {
        handle: true,
        url: true,
        followers: true,
        metrics: { orderBy: { at: "desc" }, take: 1 },
      },
    }),
  ]);

  const liMetric = liChannel?.metrics[0] ?? null;
  const org: OrgSummary = liChannel
    ? {
        handle: liChannel.handle,
        url: liChannel.url,
        followers: liMetric?.liFollowers ?? liChannel.followers ?? null,
        metricAt: liMetric?.at ?? null,
        metrics: [
          { label: "Visualizaciones del perfil", value: liMetric?.liProfileViews ?? null },
          { label: "Impresiones de publicaciones", value: liMetric?.liPostImpressions ?? null },
          { label: "Interacciones", value: liMetric?.liInteractions ?? null },
          { label: "Apariciones en búsquedas", value: liMetric?.liSearchAppearances ?? null },
        ],
      }
    : null;

  const data: TrackeeData[] = trackees.map((t) => ({
    id: t.id,
    name: t.name,
    linkedinUrl: t.linkedinUrl,
    area: t.area,
    level: t.level,
    active: t.active,
    isET: t.area === "ET" || t.user?.area === "ET",
    photoUrl: t.user?.photoUrl ?? null,
    color: t.user?.color ?? null,
    snapshots: t.snapshots.map((s) => {
      const values: Record<string, number | boolean | null> = {};
      for (const k of VALUE_KEYS) values[k] = s[k];
      values.uifceExperience = s.uifceExperience;
      values.creatorMode = s.creatorMode;
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
      <Link
        href="/redes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Redes sociales
      </Link>

      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Seguimiento del equipo en LinkedIn
          <InfoHint text="Seguimiento mensual del LinkedIn del equipo, para la marca empleadora. Primero, la página de la Unidad (resumen de solo lectura; se edita en Redes sociales). Luego una ficha por persona —Dirección, Coordinación, Liderazgo, Máster y el resto— con profile score (0–100), conexiones, seguidores, SSI, publicaciones, interacciones, recomendaciones y certificados. Cómo se usa: elige el mes, filtra por área si buscas a alguien, y «Registrar medición» en cada ficha (lo hace el junior coordinador; el perfil junior crea y edita, borrar es del perfil completo). El enlace de LinkedIn de cada persona lo puede agregar cualquiera con sesión. Todo se ingresa a mano. Ejemplo: «Cesar Diaz · sep 2026 · profile score 70 · 520 conexiones · SSI 48»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.length} personas en seguimiento · {withData} con mediciones. Principio del semestre: calidad sobre
          cantidad.
        </p>
      </div>
      <LinkedInTracker trackees={data} people={people} org={org} />
    </div>
  );
}
