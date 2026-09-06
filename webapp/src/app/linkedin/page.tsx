import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
] as const;

export default async function LinkedInPage() {
  const [trackees, people] = await Promise.all([
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
  ]);

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
          <InfoHint text="Seguimiento mensual del LinkedIn de cada persona del equipo y la Unidad, para la estrategia de marca empleadora. Una ficha por persona con su profile score (0–100), conexiones, seguidores, SSI, publicaciones, interacciones, recomendaciones y certificados. Cómo se usa: elige el mes y «Registrar medición» en cada ficha (lo hace el junior coordinador; el perfil junior puede crear y editar, borrar es del perfil completo). Todo se ingresa a mano. Las métricas de la PÁGINA de la Unidad están en la tarjeta de LinkedIn de Redes sociales, no aquí. Ejemplo: «Cesar Diaz · sep 2026 · profile score 70 · 520 conexiones · SSI 48»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.length} personas en seguimiento · {withData} con mediciones. Principio del semestre: calidad sobre
          cantidad.
        </p>
      </div>
      <LinkedInTracker trackees={data} people={people} />
    </div>
  );
}
