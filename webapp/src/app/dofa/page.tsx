import { DofaBoard } from "@/components/dofa-board";
import { InfoHint } from "@/components/info-hint";
import { DOFA_META } from "@/lib/dofa-data";

export default function DofaPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Diagnóstico DOFA
          <InfoHint text="Diagnóstico DOFA del área, construido a partir de los informes de gestión, las bases de Power BI y el Manual de MicroTalleres y MicroEventos vigente. Cómo se usa: click en un cuadrante para ver o contraer sus hallazgos; al hacer click también se resaltan abajo las casillas del cruce estratégico en las que participa. La barra de arriba resume cuántos hallazgos tiene cada cuadrante." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Área de Estrategias Tecnológicas — Unidad de Informática (UIFCE), Facultad de Ciencias Económicas,
          Universidad Nacional de Colombia, sede Bogotá.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Elaborado por {DOFA_META.elaboradoPor} · Última actualización: {DOFA_META.ultimaActualizacion} · Director
          de la Unidad: {DOFA_META.director}.
        </p>
      </div>

      <p className="rounded-md border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        {DOFA_META.objetivo}
      </p>

      <DofaBoard />
    </div>
  );
}
