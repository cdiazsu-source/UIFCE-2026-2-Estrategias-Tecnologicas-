import { prisma } from "@/lib/prisma";
import { HerramientasTabs } from "@/components/herramientas-tabs";
import { InfoHint } from "@/components/info-hint";
import type { SeatData } from "@/components/lab-room-preview";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });
  const labSeats = await prisma.labSeat.findMany({ where: { room: "sala1" } });

  const sala1Seats: Record<number, SeatData> = {};
  for (const s of labSeats) {
    sala1Seats[s.number] = { name: s.name ?? undefined, software: s.software, wallpaper: s.wallpaper ?? undefined };
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Herramientas y licencias
          <InfoHint text="Qué software tiene el área y las salas de cómputo, y en dónde. «UIFCE» son las licencias del área (edita quien tiene perfil completo, como antes). «Sala 1/2/3» son las salas de la unidad: Sala 1 ya tiene su disposición física real, no simétrica (el salón no es cuadrado) — columna A: 3 filas de 4/6/7 equipos, los primeros 4 en media luna frente a la mesa independiente del profesor (junto al pasillo y al tablero), con el resto de filas de esa columna justo detrás; columna B: 4 filas de 5/6/6/6 en línea recta, separada de la A por un pasillo. El tablero es en realidad un proyector, alimentado por el equipo que esté conectado en ese momento. Con perfil completo, click en un equipo o en el tablero abre una ficha (arriba a la derecha del esquema) para ponerle nombre, marcar qué software tiene licenciado y trackear qué fondo de pantalla o contenido promocional muestra — cada pantalla es una vitrina publicitaria de la unidad (QR a Linktree, redes, aplicativos, web)." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Licencias del área y disponibilidad de software por sala de cómputo.
        </p>
      </div>
      <HerramientasTabs tools={tools} sala1Seats={sala1Seats} />
    </div>
  );
}
