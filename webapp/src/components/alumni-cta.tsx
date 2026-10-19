import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { alumniProgress } from "@/lib/alumni";

/** Acceso grande al tracker de egresados, siempre visible en el encabezado del proyecto «Tracker de egresados UIFCE».
 *  `statuses` son los estados de los egresados ya registrados (para mostrar cómo va). */
export function AlumniCta({ statuses }: { statuses: string[] }) {
  const p = alumniProgress(statuses);
  return (
    <section
      aria-label="Ir al tracker de egresados"
      className="flex flex-col items-stretch gap-4 rounded-xl border border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-base font-semibold">Aquí se hace el seguimiento</p>
        <p className="text-sm text-muted-foreground">
          Agrega a los antiguos monitores (copiando sus nombres de los directorios), encuentra su LinkedIn y registra dónde trabajan hoy.
          {p.total > 0
            ? ` Van ${p.total} ${p.total === 1 ? "egresado registrado" : "egresados registrados"}, ${p.verified} con su situación verificada.`
            : " Todavía no hay egresados registrados."}
        </p>
      </div>
      <Button asChild size="lg" className="h-14 shrink-0 px-8 text-base">
        <Link href="/egresados">
          <GraduationCap className="h-5 w-5" aria-hidden />
          Ir al tracker de egresados
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
