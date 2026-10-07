"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

import { buildProjectSeedPrompt } from "@/lib/project-seed-prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCanEdit } from "@/components/access-context";

/** Botón «Semilla de proyecto»: arma un prompt con el contexto de ET y el formato
 *  que pide el tracker. Se pega en un asistente de IA y devuelve el proyecto listo
 *  para el formulario «Nuevo proyecto» (incluida la checklist). */
export function ProjectSeedPromptButton() {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const prompt = useMemo(() => buildProjectSeedPrompt(idea), [idea]);

  if (!canEdit) return null;

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="h-3.5 w-3.5" />
        Semilla de proyecto
      </Button>
    );
  }

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(prompt);
      ok = true;
    } catch {
      // Sin permiso de portapapeles (iframe, navegador antiguo): copia por selección.
      const area = document.createElement("textarea");
      area.value = prompt;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
    }
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border border-dashed border-input bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Semilla de proyecto</p>
        <p className="text-xs text-muted-foreground">
          Describe tu idea con tus palabras (puede estar sin pulir), copia el prompt y pégalo en tu asistente de IA.
          Ya lleva el contexto de ET y te devuelve título corporativo, qué se debe hacer, qué se espera, fundamento y
          una checklist ordenada, lista para copiar al formulario «Nuevo proyecto».
        </p>
      </div>

      <Textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Mi idea: qué es, por qué surge, qué queremos lograr y cómo sabremos que salió bien, quién lo haría, fechas, con qué áreas se cruza…"
        className="min-h-[96px]"
      />

      <details className="rounded-md border border-border bg-muted/30 text-xs">
        <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground">
          Ver el prompt completo ({prompt.length.toLocaleString("es-CO")} caracteres)
        </summary>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t border-border px-3 py-2 font-sans leading-relaxed">
          {prompt}
        </pre>
      </details>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar prompt"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cerrar
        </Button>
        {failed && (
          <span className="text-xs text-destructive">
            No se pudo copiar automáticamente: abre «Ver el prompt completo» y cópialo a mano.
          </span>
        )}
      </div>
    </div>
  );
}
