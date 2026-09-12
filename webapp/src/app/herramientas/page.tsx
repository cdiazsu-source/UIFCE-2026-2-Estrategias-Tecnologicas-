import { prisma } from "@/lib/prisma";
import { HerramientasTabs } from "@/components/herramientas-tabs";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Herramientas y licencias
          <InfoHint text="Qué software tiene el área y las salas de cómputo, y en dónde. «UIFCE» son las licencias del área (edita quien tiene perfil completo, como antes). «Sala 1/2/3» son las salas de la unidad: Sala 1 ya tiene su disposición física real, no simétrica — columna A: 3 filas de 4/6/7 equipos (los primeros 4 en circunferencia alrededor de la mesa independiente del profesor, junto al pasillo y al tablero); columna B: 4 filas de 5/6/6/6 en línea recta, separada de la A por un pasillo — elige un programa y se iluminan los equipos donde está instalado, aunque esa parte (qué software hay en cada equipo) todavía es de ejemplo." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Licencias del área y disponibilidad de software por sala de cómputo.
        </p>
      </div>
      <HerramientasTabs tools={tools} />
    </div>
  );
}
