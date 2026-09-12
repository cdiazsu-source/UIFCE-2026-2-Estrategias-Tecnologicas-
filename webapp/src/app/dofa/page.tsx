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
        <p className="text-sm text-muted-foreground">{DOFA_META.contextualizacion}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fuentes del diagnóstico</p>
        <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-snug text-muted-foreground">
          {DOFA_META.fuentes.map((fuente, i) => (
            <li key={i} className="flex gap-1.5">
              <span>•</span>
              <span>{fuente}</span>
            </li>
          ))}
        </ul>
      </div>

      <DofaBoard />
    </div>
  );
}
