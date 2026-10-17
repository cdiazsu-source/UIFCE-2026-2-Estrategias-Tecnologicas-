"use client";

import { useMemo, useState } from "react";
import { Check, Copy, FileText } from "lucide-react";

import { copyText } from "@/lib/copy-text";
import { buildProjectContextPrompt, type ProjectContext } from "@/lib/project-context-prompt";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Botón «Contexto para IA»: arma un prompt con el contexto de la Unidad y de este
 *  proyecto (datos, checklist y bitácora) para pegarlo en cualquier asistente de IA
 *  y ponerlo al día de inmediato. Es solo lectura: lo puede usar cualquier perfil. */
export function ProjectContextButton({ context }: { context: ProjectContext }) {
  const [open, setOpen] = useState(false);
  const [need, setNeed] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const prompt = useMemo(() => buildProjectContextPrompt(context, need), [context, need]);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => setOpen(true)}
        title="Prompt con el contexto de la Unidad y de este proyecto, para pegarlo en cualquier IA"
      >
        <FileText className="h-3.5 w-3.5" />
        Contexto para IA
      </Button>
    );
  }

  async function copy() {
    const ok = await copyText(prompt);
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border border-dashed border-input bg-card p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Contexto para IA</p>
        <p className="text-xs text-muted-foreground">
          Copia este prompt y pégalo en cualquier asistente de IA: ya lleva el contexto de la Unidad y del área, los
          datos del proyecto, el checklist con su avance y la bitácora reciente. Si quieres, escribe abajo qué necesitas
          y la IA arranca por ahí; si lo dejas vacío, te confirma lo que entendió y te pregunta en qué ayudar.
        </p>
      </div>

      <Textarea
        value={need}
        onChange={(e) => setNeed(e.target.value)}
        placeholder="Lo que necesito (opcional): por ejemplo, «redáctame el texto de la pieza», «revisa si el checklist está completo» o «prepárame un resumen para la reunión»."
        className="min-h-[72px]"
      />

      <details className="rounded-md border border-border bg-muted/30 text-xs">
        <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground">
          Ver el prompt completo ({prompt.length.toLocaleString("es-CO")} caracteres)
        </summary>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap border-t border-border px-3 py-2 font-sans leading-relaxed">
          {prompt}
        </pre>
      </details>

      <p className="text-xs text-muted-foreground">
        Incluye el contenido de la bitácora y los enlaces de las notas: revísalo antes de pegarlo en una IA externa.
      </p>

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
