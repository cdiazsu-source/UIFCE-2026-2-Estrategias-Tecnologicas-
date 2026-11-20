"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { addAllyNote, deleteAllyNote, updateAllyEmail } from "@/lib/actions/academic-allies";
import type { AllyInfo } from "@/lib/convocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCanEdit, useCanManageLeads } from "@/components/access-context";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });
}

/** Ficha de un profesor aliado: correo (lo edita el perfil completo) y notas de contacto (las agrega cualquier sesión). */
export function AllyDetail({ ally }: { ally: AllyInfo }) {
  const canEdit = useCanEdit();
  const canNote = useCanManageLeads();
  const [email, setEmail] = useState(ally.email ?? "");
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Correo</span>
        {canEdit ? (
          <>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo institucional del profesor"
              className="h-8 max-w-xs"
              aria-label={`Correo de ${ally.name}`}
            />
            <Button type="button" size="sm" variant="outline" disabled={pending || email === (ally.email ?? "")} onClick={() => start(() => updateAllyEmail(ally.id, email))}>
              Guardar correo
            </Button>
          </>
        ) : (
          <span>{ally.email ?? "Sin registrar"}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Notas de contacto ({ally.notes.length})</span>
        {ally.notes.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay notas. Anota quién habló con el profesor y qué quedó acordado.</p>}
        {ally.notes.map((n) => (
          <div key={n.id} className="flex items-start gap-2 rounded-md bg-card px-2.5 py-1.5">
            <p className="flex-1 whitespace-pre-wrap">
              {n.body}
              <span className="ml-2 text-xs text-muted-foreground">
                {n.author} · {when(n.at)}
              </span>
            </p>
            {canEdit && (
              <button type="button" aria-label="Eliminar nota" title="Eliminar nota" disabled={pending} onClick={() => start(() => deleteAllyNote(n.id))} className="press text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {canNote && (
          <div className="flex flex-col gap-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Escribe una nota…" aria-label={`Nueva nota sobre ${ally.name}`} />
            <div>
              <Button
                type="button"
                size="sm"
                disabled={pending || !body.trim()}
                onClick={() =>
                  start(async () => {
                    await addAllyNote(ally.id, body);
                    setBody("");
                  })
                }
              >
                Agregar nota
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
