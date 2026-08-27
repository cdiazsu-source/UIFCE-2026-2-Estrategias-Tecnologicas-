import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";

const OBJETIVOS_2026_2 = [
  "Restablecer y consolidar la presencia en los canales oficiales: recuperar o recrear Instagram, priorizar LinkedIn, poner en marcha TikTok y cerrar la oficialización de YouTube.",
  "Sostener una producción de contenido constante y con estándar de calidad, bajo un calendario editorial único y con licencias institucionales de diseño y edición.",
  "Ejecutar la primera edición de la Semana UIFCE —Hackatón, microtaller y conferencia— y racionalizar los microtalleres priorizando la asistencia efectiva y la certificación de participación.",
  "Formalizar la gobernanza y la memoria del área: Términos y Condiciones, repositorio documental permanente y propuesta de repositorio compartido a Gestión del Conocimiento.",
  "Incorporar inteligencia artificial como palanca de eficiencia operativa, para sostener la calidad sin aumentar la carga del equipo.",
  "Garantizar el acompañamiento a las demás áreas de la UIFCE con niveles de servicio (SLA) definidos y un canal único de solicitudes.",
];

export function AreaOverview() {
  return (
    <section>
      <Card>
        <CardHeader className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            El área
            <InfoHint text="Ficha institucional del área: su mandato dentro de la UIFCE y los objetivos definidos para el semestre 2026-2 en la planeación de inicio de semestre." />
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
              aliados, mediante contenido y experiencias de calidad. Durante el semestre 2026-2 opera bajo el principio
              rector <span className="font-medium text-foreground">&ldquo;calidad sobre cantidad&rdquo;</span>.
            </p>
            <p className="text-muted-foreground">
              Modelo operativo: una máster responsable del área, con monitores de artes y auxiliares, y un esquema de
              acompañamiento a las demás áreas con niveles de servicio definidos.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objetivos 2026-2</p>
            <ol className="flex flex-col gap-2 text-sm leading-snug">
              {OBJETIVOS_2026_2.map((objetivo, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span>{objetivo}</span>
                </li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
