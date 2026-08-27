import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export type FeedItem = {
  id: string;
  body: string;
  author: string;
  authorRole: string | null;
  createdAt: Date;
  projectId: string;
  projectTitle: string;
};

export function UpdatesFeed({ items }: { items: FeedItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas actualizaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay notas registradas en ningún proyecto.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.id} className="border-l-2 border-primary/30 pl-3">
                <Link href={`/proyectos/${item.projectId}`} className="text-xs font-semibold text-primary hover:underline">
                  {item.projectTitle}
                </Link>
                <p className="mt-0.5 whitespace-pre-line text-sm leading-snug">{item.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.author, item.authorRole, formatDateTime(item.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
