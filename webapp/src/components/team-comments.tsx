"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, CornerDownRight, Trash2 } from "lucide-react";

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

/** El texto sin enviar se guarda aquí para que no se pierda si se cierra la
 *  página o se olvida pulsar «Enviar». Es por navegador; se borra al publicar. */
const DRAFT_KEY = "et:team-comment-draft";

export type TeamCommentAuthor = { id: string; name: string; role: string };
export type TeamCommentData = {
  id: string;
  body: string;
  author: string;
  authorRole: string | null;
  reviewed: boolean;
  parentId: string | null;
  createdAt: Date;
};

/** Desplegable «¿Quién eres?» compartido por el formulario principal y las
 *  respuestas. */
function AuthorSelect({ authors }: { authors: TeamCommentAuthor[] }) {
  return (
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
  );
}

/** Formulario compacto para responder a un comentario. */
function ReplyForm({
  parentId,
  authors,
  onDone,
}: {
  parentId: string;
  authors: TeamCommentAuthor[];
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const res = await addTeamComment(formData);
        if (res?.ok) {
          formRef.current?.reset();
          onDone();
        }
      }}
      className="mt-2 flex flex-col gap-2"
    >
      <input type="hidden" name="parentId" value={parentId} />
      <Textarea
        name="body"
        placeholder="Escribe tu respuesta…"
        required
        className="min-h-[56px]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <AuthorSelect authors={authors} />
        <Button type="submit" size="sm">
          Responder
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function CommentRow({
  comment,
  replies,
  authors,
  isReply = false,
}: {
  comment: TeamCommentData;
  replies?: TeamCommentData[];
  authors: TeamCommentAuthor[];
  isReply?: boolean;
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [isPending, startTransition] = useTransition();
  const [replying, setReplying] = useState(false);

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
        <div className="flex gap-1">
          {!isReply && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              Responder
            </button>
          )}
          {canEdit && (
            <>
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
                  const extra = replies && replies.length > 0
                    ? ` Sus ${replies.length} respuesta(s) quedarán como comentarios sueltos.`
                    : "";
                  if (!window.confirm(`¿Eliminar este comentario?${extra}`)) return;
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
            </>
          )}
        </div>
      </div>

      {replying && (
        <ReplyForm parentId={comment.id} authors={authors} onDone={() => setReplying(false)} />
      )}

      {replies && replies.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
          {replies.map((r) => (
            <CommentRow key={r.id} comment={r} authors={authors} isReply />
          ))}
        </ul>
      )}
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
  const [draft, setDraft] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restaurar el borrador guardado (si lo hay) al abrir la página.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setDraft(saved);
    } catch {
      /* localStorage no disponible: seguimos sin borrador */
    }
    setDraftLoaded(true);
  }, []);

  // Guardar en cada cambio: sobrevive a recargar o cerrar la pestaña.
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      if (draft.trim()) localStorage.setItem(DRAFT_KEY, draft);
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* sin persistencia; no es crítico */
    }
  }, [draft, draftLoaded]);

  // Separar comentarios raíz de respuestas. Una respuesta cuyo padre ya no está
  // (se borró) se muestra como comentario raíz.
  const ids = new Set(comments.map((c) => c.id));
  const repliesByParent = new Map<string, TeamCommentData[]>();
  for (const c of comments) {
    if (c.parentId && ids.has(c.parentId)) {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }
  for (const arr of repliesByParent.values()) {
    arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  const topLevel = comments.filter((c) => !c.parentId || !ids.has(c.parentId));

  const pending = topLevel.filter((c) => !c.reviewed);
  const reviewed = topLevel.filter((c) => c.reviewed);
  const shown = showReviewed ? topLevel : pending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Añade un comentario al equipo de ET
          <InfoHint text="Un buzón para comentarios e ideas del equipo. Cómo se usa: escribe el comentario y elige quién eres de la lista (solo personas registradas en Equipo). Cualquiera puede responder a un comentario con «Responder». Por defecto se ven los pendientes; con perfil completo se marca cada uno como «revisado» y se puede borrar (con Deshacer). Ejemplo: «Propuesta: unificar el pie de página de las piezas TV antes de la Semana UIFCE.»" />
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
              const res = await addTeamComment(formData);
              if (res?.ok) {
                formRef.current?.reset();
                setDraft("");
                try {
                  localStorage.removeItem(DRAFT_KEY);
                } catch {
                  /* nada que limpiar */
                }
              }
            }}
            className="flex flex-col gap-2"
          >
            <Textarea
              name="body"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe tu comentario o idea para el equipo…"
              required
            />
            <div className="flex flex-wrap items-center gap-2">
              <AuthorSelect authors={authors} />
              <Button type="submit" size="sm">
                Enviar
              </Button>
            </div>
            {draft.trim() && (
              <p className="text-xs text-muted-foreground">
                Borrador guardado en este navegador; no se pierde si cierras la página. Pulsa «Enviar» para publicarlo.
              </p>
            )}
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
              <CommentRow
                key={c.id}
                comment={c}
                replies={repliesByParent.get(c.id)}
                authors={authors}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
