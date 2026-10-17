"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Copy, ListPlus } from "lucide-react";

import { addChecklistItems } from "@/lib/actions/checklist";
import { parseChecklistLines } from "@/lib/checklist-lines";
import { buildChecklistSeedPrompt, type ChecklistSeedContext } from "@/lib/checklist-seed-prompt";
import { copyText } from "@/lib/copy-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Panel «Semilla de checklist»: paso 1, arma un prompt con TODO el contexto del
 *  proyecto + la idea de checklist y se copia a otra IA; paso 2, se pega aquí la
 *  lista que devuelve y se agrega a la checklist de una vez. */
export function ChecklistSeedPanel({
  projectId,
  context,
  onClose,
}: {
  projectId: string;
  context: ChecklistSeedContext;
  onClose: () => void;
}) {
  const [idea, setIdea] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pasted, setPasted] = useState("");
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const prompt = useMemo(() => buildChecklistSeedPrompt(context, idea), [context, idea]);
  const lines = useMemo(() => parseChecklistLines(pasted), [pasted]);

  async function copy() {
    const ok = await copyText(prompt);
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function add() {
    startTransition(async () => {
      const r = await addChecklistItems(projectId, pasted);
      setResult(r);
      if (r.added > 0) setPasted("");
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-dashed border-input bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Semilla de checklist</p>
        <p className="text-xs text-muted-foreground">
          Cuenta tu idea de checklist con tus palabras, copia el prompt y pégalo en tu asistente de IA. Ya lleva todo
          el contexto de este proyecto (qué se debe hacer, qué se espera, fundamento, responsable, la checklist actual y
          las últimas notas) y te devuelve las subtareas listas para pegar abajo.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1. Tu idea y el prompt</p>
        <Textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Mi idea de checklist: qué parte quiero desglosar, qué falta, con quién se cruza, fechas límite, si quiero varias opciones…"
          className="min-h-[88px]"
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
          {failed && (
            <span className="text-xs text-destructive">
              No se pudo copiar automáticamente: abre «Ver el prompt completo» y cópialo a mano.
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2. Pegar lista</p>
        <Textarea
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            setResult(null);
          }}
          placeholder={"Pega aquí la respuesta de la IA (una opción de checklist). Se aceptan numeradas (1. …) o con guion (- …); los encabezados y las cercas de código se ignoran."}
          className="min-h-[88px]"
        />
        {lines.length > 0 && (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <p className="mb-1 font-medium">
              Se agregarán {lines.length} {lines.length === 1 ? "subtarea" : "subtareas"} al final de la checklist:
            </p>
            <ol className="list-decimal pl-5 leading-relaxed text-muted-foreground">
              {lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={add} disabled={isPending || lines.length === 0}>
            <ListPlus className="h-3.5 w-3.5" />
            {isPending ? "Agregando…" : lines.length > 0 ? `Agregar ${lines.length} a la checklist` : "Agregar a la checklist"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          {result && (
            <span className="text-xs text-muted-foreground">
              {result.added > 0
                ? `Listo: ${result.added} ${result.added === 1 ? "subtarea agregada" : "subtareas agregadas"}`
                : "No se agregó nada"}
              {result.skipped > 0 ? ` (${result.skipped} ya existían)` : ""}.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
