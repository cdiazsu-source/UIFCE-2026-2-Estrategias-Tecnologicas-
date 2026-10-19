import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LEADS_PER_COMPANY_GOAL, leadsGoal } from "@/lib/company-leads";
import { cn } from "@/lib/utils";

/** Avance del proyecto de rastreo de contactos: barra de progreso total frente a la meta (mínimo
 *  `LEADS_PER_COMPANY_GOAL` personas por empresa), el estado de cada empresa y el acceso a «Empresas de interés». */
export function LeadsGoalPanel({ companies }: { companies: { name: string; count: number }[] }) {
  const g = leadsGoal(companies.map((c) => c.count));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">
            {g.have} de {g.total} contactos mínimos{" "}
            <span className="font-normal text-muted-foreground">({LEADS_PER_COMPANY_GOAL} por empresa)</span>
          </p>
          <p className="text-2xl font-bold tabular-nums">{g.percent}%</p>
        </div>
        <Progress value={g.percent} className="mt-2 h-3" aria-label="Avance total del rastreo de contactos" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {g.companiesDone} de {g.companies} empresas ya tienen al menos {LEADS_PER_COMPANY_GOAL} personas registradas.
        </p>
      </div>

      {companies.length > 0 && (
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => {
            const done = c.count >= LEADS_PER_COMPANY_GOAL;
            return (
              <li
                key={c.name}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs",
                  done ? "border-success/40 bg-success/10" : "border-border",
                )}
              >
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {c.count}/{LEADS_PER_COMPANY_GOAL}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Acceso grande a «Empresas de interés» (Aliados), siempre visible en el encabezado del proyecto de rastreo. */
export function LeadsCta() {
  return (
    <section
      aria-label="Ir a Empresas de interés"
      className="flex flex-col items-stretch gap-4 rounded-xl border border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-base font-semibold">Empresas de interés</p>
        <p className="text-sm text-muted-foreground">
          Registra y da seguimiento a los contactos de cada empresa: reclutadores, gerentes, recursos humanos y otros perfiles.
        </p>
      </div>
      <Button asChild size="lg" className="h-14 shrink-0 px-8 text-base">
        <Link href="/aliados#empresas-interes">
          <Building2 className="h-5 w-5" aria-hidden />
          Ir a Empresas de interés
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
