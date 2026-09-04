import Link from "next/link";
import { ArrowRight, AtSign, Check, ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export type NoteFeedItem = {
  kind: "note";
  id: string;
  body: string;
  author: string;
  authorRole: string | null;
  at: Date;
  projectId: string;
  projectTitle: string;
  /** Subtarea del checklist a la que se refiere la nota, si el autor la vinculó. */
  checklistItemText: string | null;
  checklistItemDone: boolean;
  /** Nombres de las personas etiquetadas en la nota. */
  mentions: string[];
};

export type CheckFeedItem = {
  kind: "check";
  id: string;
  text: string;
  at: Date;
  projectId: string;
  projectTitle: string;
  /** Siguiente subtarea pendiente de ese proyecto (la que "sigue"). */
  nextText: string | null;
  allDone: boolean;
};

export type FeedItem = NoteFeedItem | CheckFeedItem;

/** Cada entrada del feed es un enlace al proyecto: el texto se recorta para no
 *  deformar el panel y, al hacer clic, se abre el proyecto con la nota completa. */
function RowLink({
  projectId,
  accent,
  children,
}: {
  projectId: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={`/proyectos/${projectId}`}
        className={`block rounded-r-md border-l-2 ${accent} py-1 pl-3 pr-1 transition-colors hover:bg-muted/60`}
      >
        {children}
      </Link>
    </li>
  );
}

function ProjectTitle({ title }: { title: string }) {
  return <span className="block truncate text-xs font-semibold text-primary">{title}</span>;
}

function NoteRow({ item }: { item: NoteFeedItem }) {
  return (
    <RowLink projectId={item.projectId} accent="border-primary/30">
      <ProjectTitle title={item.projectTitle} />
      {item.checklistItemText && (
        <span className="mt-0.5 flex items-start gap-1 text-xs text-primary/90">
          <ListChecks className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            <span
              className={item.checklistItemDone ? "line-through" : undefined}
            >{item.checklistItemText}</span>
          </span>
        </span>
      )}
      <p className="mt-0.5 line-clamp-4 whitespace-pre-line break-words text-sm leading-snug">{item.body}</p>
      {item.mentions.length > 0 && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <AtSign className="h-3 w-3 shrink-0" aria-hidden />
          {item.mentions.join(", ")}
        </p>
      )}
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {[item.author, item.authorRole, formatDateTime(item.at)].filter(Boolean).join(" · ")}
      </p>
    </RowLink>
  );
}

function CheckRow({ item, showNext }: { item: CheckFeedItem; showNext: boolean }) {
  return (
    <RowLink projectId={item.projectId} accent="border-success/40">
      <ProjectTitle title={item.projectTitle} />
      <p className="mt-0.5 flex items-start gap-1.5 text-sm leading-snug">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        <span className="min-w-0 break-words">
          Subtarea completada:{" "}
          <span className="text-muted-foreground line-through">{item.text}</span>
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
      {showNext && item.nextText && (
        <span className="animate-et-blink mt-2 flex items-start gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5 text-xs">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 break-words">
            <span className="font-medium text-primary">Sigue:</span> {item.nextText}
          </span>
        </span>
      )}
      {showNext && !item.nextText && item.allDone && (
        <span className="mt-2 block text-xs font-medium text-success">Checklist del proyecto completo.</span>
      )}
    </RowLink>
  );
}

export function UpdatesFeed({ items }: { items: FeedItem[] }) {
  const nextShownFor = new Set<string>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas actualizaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay actividad registrada.</p>
        ) : (
          <ul className="-mr-1 flex max-h-[34rem] flex-col gap-3 overflow-y-auto pr-1">
            {items.map((item) => {
              if (item.kind === "note") return <NoteRow key={item.id} item={item} />;
              const showNext = !nextShownFor.has(item.projectId);
              if (showNext) nextShownFor.add(item.projectId);
              return <CheckRow key={item.id} item={item} showNext={showNext} />;
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
