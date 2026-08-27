import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

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

function ProjectLink({ id, title }: { id: string; title: string }) {
  return (
    <Link href={`/proyectos/${id}`} className="text-xs font-semibold text-primary hover:underline">
      {title}
    </Link>
  );
}

function NoteRow({ item }: { item: NoteFeedItem }) {
  return (
    <li className="border-l-2 border-primary/30 pl-3">
      <ProjectLink id={item.projectId} title={item.projectTitle} />
      <p className="mt-0.5 whitespace-pre-line text-sm leading-snug">{item.body}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {[item.author, item.authorRole, formatDateTime(item.at)].filter(Boolean).join(" · ")}
      </p>
    </li>
  );
}

function CheckRow({ item, showNext }: { item: CheckFeedItem; showNext: boolean }) {
  return (
    <li className="border-l-2 border-success/40 pl-3">
      <ProjectLink id={item.projectId} title={item.projectTitle} />
      <p className="mt-0.5 flex items-start gap-1.5 text-sm leading-snug">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        <span>
          Subtarea completada: <span className="text-muted-foreground line-through">{item.text}</span>
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.at)}</p>
      {showNext && item.nextText && (
        <p className="animate-et-blink mt-2 flex items-start gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5 text-xs">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-medium text-primary">Sigue:</span> {item.nextText}
          </span>
        </p>
      )}
      {showNext && !item.nextText && item.allDone && (
        <p className="mt-2 text-xs font-medium text-success">Checklist del proyecto completo.</p>
      )}
    </li>
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
          <ul className="flex flex-col gap-4">
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
