"use client";

import { useRef, useState, useTransition } from "react";
import { CornerDownRight, Trash2 } from "lucide-react";

import { addStudyComment, deleteStudyComment } from "@/lib/actions/study-comments";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { formatDateTime, USER_ROLE_LABEL } from "@/lib/utils";

export type StudyCommentAuthor = { id: string; name: string; role: string };
export type StudyCommentTarget = { id: string; title: string; ownerName: string };
export type StudyCommentData = {
  id: string;
  studyProjectId: string;
  body: string;
  author: string;
  authorRole: string | null;
  parentId: string | null;
  createdAt: Date;
};

function TargetSelect({ targets }: { targets: StudyCommentTarget[] }) {
  return (
    <Select name="studyProjectId" defaultValue="" required className="w-72">
      <option value="" disabled>
        ¿Sobre qué PE es esto?
      </option>
      {targets.map((t) => (
        <option key={t.id} value={t.id}>
          {t.title} — {t.ownerName}
        </option>
      ))}
    </Select>
  );
}

function AuthorSelect({ authors }: { authors: StudyCommentAuthor[] }) {
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

/** Formulario compacto para responder (la vía de coordinación/máster para
 *  dejar una sugerencia sobre la actualización de un Junior). */
function ReplyForm({
  studyProjectId,
  parentId,
  authors,
  onDone,
}: {
  studyProjectId: string;
  parentId: string;
  authors: StudyCommentAuthor[];
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const res = await addStudyComment(formData);
        if (res?.ok) {
          formRef.current?.reset();
          onDone();
        }
      }}
      className="mt-2 flex flex-col gap-2"
    >
      <input type="hidden" name="studyProjectId" value={studyProjectId} />
      <input type="hidden" name="parentId" value={parentId} />
      <Textarea name="body" placeholder="Tu sugerencia o respuesta…" required className="min-h-[56px]" />
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
  targetTitle,
  replies,
  authors,
  isReply = false,
}: {
  comment: StudyCommentData;
  targetTitle?: string;
  replies?: StudyCommentData[];
  authors: StudyCommentAuthor[];
  isReply?: boolean;
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [isPending, startTransition] = useTransition();
  const [replying, setReplying] = useState(false);

  return (
    <li className="rounded-md border-l-2 border-primary/40 bg-muted/40 p-3">
      {targetTitle && (
        <Badge variant="outline" className="mb-1.5">
          {targetTitle}
        </Badge>
      )}
      <p className="whitespace-pre-line break-words text-sm leading-snug">{comment.body}</p>
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
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm("¿Eliminar esta actualización?")) return;
                startTransition(async () => {
                  const u = await deleteStudyComment(comment.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar actualización"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {replying && (
        <ReplyForm
          studyProjectId={comment.studyProjectId}
          parentId={comment.id}
          authors={authors}
          onDone={() => setReplying(false)}
        />
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

export function StudyComments({
  comments,
  authors,
  targets,
}: {
  comments: StudyCommentData[];
  authors: StudyCommentAuthor[];
  targets: StudyCommentTarget[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const ids = new Set(comments.map((c) => c.id));
  const repliesByParent = new Map<string, StudyCommentData[]>();
  for (const c of comments) {
    if (c.parentId && ids.has(c.parentId)) {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }
  for (const arr of repliesByParent.values()) arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const topLevel = comments
    .filter((c) => !c.parentId || !ids.has(c.parentId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const titleById = new Map(targets.map((t) => [t.id, `${t.title} — ${t.ownerName}`]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          Añade una actualización/comentario respecto a tu PE
          <InfoHint text="Espacio del proyecto de estudio (PE) de cada Junior: avances, preguntas, dificultades o descubrimientos sobre TU proyecto. Solo comentan aquí Junior, Coordinación y Máster. Cómo se usa: escribe la actualización, elige de qué PE es y quién eres; cualquiera de esos roles puede «Responder» — así es como coordinación o el máster dejan una sugerencia sobre lo que escribió un Junior. Ejemplo: un Junior cuenta un hallazgo del Corte 1 y el máster responde con una sugerencia concreta." />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {authors.length === 0 || targets.length === 0 ? (
          <p className="rounded-md border border-dashed border-input p-3 text-sm text-muted-foreground">
            Hace falta al menos un proyecto de estudio y una persona con rol Junior, Coordinación o Máster en{" "}
            <a href="/equipo" className="text-primary hover:underline">
              Equipo
            </a>
            .
          </p>
        ) : (
          <form
            ref={formRef}
            action={async (formData) => {
              const res = await addStudyComment(formData);
              if (res?.ok) formRef.current?.reset();
            }}
            className="flex flex-col gap-2"
          >
            <Textarea name="body" placeholder="Avance, pregunta, dificultad o descubrimiento de tu PE…" required />
            <div className="flex flex-wrap items-center gap-2">
              <TargetSelect targets={targets} />
              <AuthorSelect authors={authors} />
              <Button type="submit" size="sm">
                Publicar
              </Button>
            </div>
          </form>
        )}

        {topLevel.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay actualizaciones.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {topLevel.map((c) => (
              <CommentRow
                key={c.id}
                comment={c}
                targetTitle={titleById.get(c.studyProjectId)}
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
