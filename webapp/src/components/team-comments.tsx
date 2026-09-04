"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";

import {
  addTeamComment,
  deleteTeamComment,
  toggleTeamCommentReviewed,
} from "@/lib/actions/team-comments";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { formatDateTime, USER_ROLE_LABEL } from "@/lib/utils";

export type TeamCommentAuthor = { id: string; name: string; role: string };
export type TeamCommentData = {
  id: string;
  body: string;
  author: string;
  authorRole: string | null;
  reviewed: boolean;
  createdAt: Date;
};

function CommentRow({ comment }: { comment: TeamCommentData }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [isPending, startTransition] = useTransition();

  return (
    <li
      className={`rounded-md border-l-2 p-3 ${
        comment.reviewed ? "border-success/40 bg-muted/30" : "border-primary/40 bg-muted/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="whitespace-pre-line break-words text-sm leading-snug">{comment.body}</p>
        {comment.reviewed && <Badge variant="success">Revisado</Badge>}
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {[comment.author, comment.authorRole, formatDateTime(comment.createdAt)].filter(Boolean).join(" · ")}
        </p>
        {canEdit && (
          <div className="flex gap-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const u = await toggleTeamCommentReviewed(comment.id, !comment.reviewed);
                  if (u) undo(u);
                })
              }
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              {comment.reviewed ? "Marcar pendiente" : "Marcar revisado"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm("¿Eliminar este comentario?")) return;
                startTransition(async () => {
                  const u = await deleteTeamComment(comment.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar comentario"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export function TeamComments({
  comments,
  authors,
}: {
  comments: TeamCommentData[];
  authors: TeamCommentAuthor[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showReviewed, setShowReviewed] = useState(false);

  const pending = comments.filter((c) => !c.reviewed);
  const reviewed = comments.filter((c) => c.reviewed);
  const shown = showReviewed ? comments : pending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Añade un comentario al equipo de ET
          <InfoHint text="Un buzón para comentarios e ideas del equipo. Cómo se usa: escribe el comentario y elige quién eres de la lista (solo personas registradas en Equipo). Por defecto se ven los pendientes; con perfil completo se marca cada uno como «revisado» y se puede borrar (con Deshacer). Ejemplo: «Propuesta: unificar el pie de página de las piezas TV antes de la Semana UIFCE.»" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {authors.length === 0 ? (
          <p className="rounded-md border border-dashed border-input p-3 text-sm text-muted-foreground">
            Primero agrega personas en la sección{" "}
            <a href="/equipo" className="text-primary hover:underline">
              Equipo
            </a>
            .
          </p>
        ) : (
          <form
            ref={formRef}
            action={async (formData) => {
              await addTeamComment(formData);
              formRef.current?.reset();
            }}
            className="flex flex-col gap-2"
          >
            <Textarea name="body" placeholder="Escribe tu comentario o idea para el equipo…" required />
            <div className="flex flex-wrap items-center gap-2">
              <Select name="authorId" defaultValue="" required className="w-64">
                <option value="" disabled>
                  ¿Quién eres?
                </option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {USER_ROLE_LABEL[a.role] ?? a.role}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm">
                Enviar
              </Button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            {pending.length} sin revisar{reviewed.length > 0 ? ` · ${reviewed.length} revisados` : ""}
          </span>
          {reviewed.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReviewed((s) => !s)}
              className="rounded px-2 py-0.5 hover:bg-accent hover:text-accent-foreground"
            >
              {showReviewed ? "Ocultar revisados" : "Ver revisados"}
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay comentarios sin revisar.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((c) => (
              <CommentRow key={c.id} comment={c} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
