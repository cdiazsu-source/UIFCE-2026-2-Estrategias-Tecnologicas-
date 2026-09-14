import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";

/** Estrategias Tecnológicas / Difusión y visibilidad que ET efectivamente usa
 *  este semestre — contenido fijo y corporativo, igual criterio que el DOFA:
 *  una síntesis ejecutiva, no una lista editable a diario. Si el canal o el
 *  frente cambia de fondo entre semestres, se actualiza aquí a mano. */
const ET_STRATEGIES: string[] = [
  "Instagram (@ui_fce): contenido corto — hacks informáticos y reels",
  "LinkedIn institucional: posicionamiento prioritario del semestre",
  "TikTok: canal nuevo, mismo formato de contenido corto",
  "YouTube: cierre de la oficialización institucional",
  "Micrositio y Blog UIFCE como cara digital permanente de la Unidad",
  "MicroTalleres y MicroEventos: Semana UIFCE y Hackatón Bizagi",
  "Difusión física: fachadas, carteleras y stands intervenidos",
  "Alianza con Comunicaciones e Imagen Institucional: correo masivo y validación de piezas",
];

export function EtStrategiesCard() {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Difusión y visibilidad — 2026-2S
          <InfoHint text="Los frentes concretos de Estrategias Tecnológicas para este semestre: qué canales y qué formatos se usan, sin entrar en el detalle operativo de cada proyecto (eso vive en la sección Proyectos). Contenido fijo, se actualiza a mano si cambia de fondo entre semestres." />
        </p>
        <CardTitle className="text-lg">ET</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2 text-sm leading-snug">
          {ET_STRATEGIES.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
