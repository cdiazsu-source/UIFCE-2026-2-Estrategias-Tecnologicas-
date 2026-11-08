import { prisma } from "@/lib/prisma";
import { HerramientasTabs } from "@/components/herramientas-tabs";
import { InfoHint } from "@/components/info-hint";
import type { SeatData } from "@/components/lab-room-preview";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });
  const sala1Seats: Record<number, SeatData> = {};
  try {
    const labSeats = await prisma.labSeat.findMany({
      where: { room: "sala1" },
      include: { comments: { orderBy: { createdAt: "desc" } } },
    });
    for (const s of labSeats) {
      sala1Seats[s.number] = {
        name: s.name ?? undefined,
        software: s.software,
        pending: s.pending,
        wallpaper: s.wallpaper ?? undefined,
        assetTag1: s.assetTag1 ?? undefined,
        assetTag2: s.assetTag2 ?? undefined,
        comments: s.comments.map((c) => ({
          id: c.id,
          author: c.author ?? undefined,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        })),
      };
    }
  } catch {
    // Migración de códigos/comentarios aún sin aplicar: se muestran solo los campos anteriores.
    const old = await prisma.labSeat.findMany({
      where: { room: "sala1" },
      select: { number: true, name: true, software: true, wallpaper: true },
    });
    for (const s of old) {
      sala1Seats[s.number] = {
        name: s.name ?? undefined,
        software: s.software,
        pending: [],
        wallpaper: s.wallpaper ?? undefined,
        comments: [],
      };
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Herramientas y licencias
          <InfoHint text="Qué software tiene el área y las salas de cómputo, y en dónde. «UIFCE» son las licencias del área (edita quien tiene perfil completo, como antes). «Sala 1/2/3» son las salas de la unidad: Sala 1 ya tiene su plano real, no simétrico (el salón no es cuadrado) — Bloque #1 (izquierda): 4 filas rectas de 5/6/6/6 equipos; Bloque #2 (derecha): mesa independiente del profesor y filas curvas de 4/6/7 que siguen la ventana en diagonal; entrada abajo a la izquierda y proyector/board en la pared inferior. El proyector se alimenta del equipo que esté conectado en ese momento. Con perfil completo, click en un equipo o en el proyector abre una ficha (arriba a la derecha del esquema) para ponerle nombre, marcar qué software tiene licenciado y trackear qué fondo de pantalla o contenido promocional muestra — cada pantalla es una vitrina publicitaria de la unidad (QR a Linktree, redes, aplicativos, web)." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Licencias del área y disponibilidad de software por sala de cómputo.
        </p>
      </div>
      <HerramientasTabs tools={tools} sala1Seats={sala1Seats} />
    </div>
  );
}
