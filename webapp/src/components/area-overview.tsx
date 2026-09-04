import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { SemesterObjectives } from "@/components/semester-objectives";

export function AreaOverview({
  semester,
}: {
  semester: { id: string; label: string; objectives: string[] } | null;
}) {
  return (
    <section>
      <Card>
        <CardHeader className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            El área
            <InfoHint text="Ficha institucional del área: su mandato dentro de la UIFCE y los objetivos del semestre. Cómo se usa: los objetivos se editan con el lápiz (uno por línea) y son distintos por semestre — cambian con las pestañas de Proyectos." />
          </p>
          <CardTitle className="text-lg">Estrategias Tecnológicas — Unidad de Informática (UIFCE)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.25fr_1fr]">
          <div className="flex flex-col gap-3 text-sm leading-relaxed">
            <p>
              Estrategias Tecnológicas (ET) es una de las siete áreas de la Unidad de Informática de la Facultad de
              Ciencias Económicas (UIFCE) de la Universidad Nacional de Colombia. Tiene a su cargo la comunicación digital
              y la difusión de la Unidad: los canales y redes oficiales, las piezas gráficas y audiovisuales, el
              micrositio, y los microtalleres y eventos.
            </p>
            <p>
              Su propósito es posicionar institucionalmente a la UIFCE ante la comunidad académica, los egresados y los
              aliados, mediante contenido y experiencias de calidad, bajo el principio rector{" "}
              <span className="font-medium text-foreground">&ldquo;calidad sobre cantidad&rdquo;</span>.
            </p>
            <p className="text-muted-foreground">
              Modelo operativo: una máster responsable del área, con monitores de artes y auxiliares, y un esquema de
              acompañamiento a las demás áreas con niveles de servicio definidos.
            </p>
          </div>

          <SemesterObjectives semester={semester} />
        </CardContent>
      </Card>
    </section>
  );
}
