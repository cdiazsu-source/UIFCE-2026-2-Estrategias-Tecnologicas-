"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

import { buildDeveloperPrompt, type DeveloperSnapshot } from "@/lib/developer-prompt";
import { copyText } from "@/lib/copy-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const INCLUDES = [
  "Qué es el proyecto, quiénes lo usan y de dónde salen los proyectos (el CSV de planeación)",
  "Stack, despliegue y cómo verificar (tsc, build, dev)",
  "Árbol de carpetas y mapa de rutas",
  "Modelo de datos y reglas del seed",
  "Patrones de código: server actions, permisos, fechas, estilo, ocultar/expandir",
  "Acceso y seguridad (perfiles y Vista Junior; sin contraseñas)",
  "Reglas duras: identidad de git, migraciones a mano, repo público, CRLF",
  "Flujo de ejecución y cierre con el bloque de sincronización",
  "Estado en vivo (última migración, semestre vigente, volumen) y tu modificación",
];

/** Panel de «Desarrollador»: escribe la modificación y copia el prompt completo
 *  (contexto estructural + reglas + tu cambio) para Claude Code. */
export function DeveloperPromptPanel({ snapshot }: { snapshot: DeveloperSnapshot }) {
  const [change, setChange] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const prompt = useMemo(() => buildDeveloperPrompt(change, snapshot), [change, snapshot]);

  async function copy() {
    const ok = await copyText(prompt);
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Prompt para Claude Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">¿Qué modificación quieres hacer?</span>
            <Textarea
              value={change}
              onChange={(e) => setChange(e.target.value)}
              placeholder="Describe el cambio con tus palabras, aunque sea grande: qué quieres agregar o cambiar, para quién, en qué pantalla, cómo debe comportarse y cómo sabrás que quedó bien. La IA lo desplegará antes de ejecutarlo."
              className="min-h-[160px]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar prompt completo"}
            </Button>
            <span className="text-xs text-muted-foreground">{prompt.length.toLocaleString("es-CO")} caracteres</span>
            {failed && (
              <span className="text-xs text-destructive">
                No se pudo copiar automáticamente: abre «Ver el prompt completo» y cópialo a mano.
              </span>
            )}
          </div>

          <details className="rounded-md border border-border bg-muted/30 text-xs">
            <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground">Ver el prompt completo</summary>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-border px-3 py-2 font-sans leading-relaxed">
              {prompt}
            </pre>
          </details>

          <p className="text-xs text-muted-foreground">
            Pégalo en Claude Code abierto dentro de la carpeta del repositorio. El prompt le dice qué leer, cómo
            ejecutar, qué no tocar y cómo cerrar; tú solo lo pegas.
          </p>
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Qué incluye el prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
            {INCLUDES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
