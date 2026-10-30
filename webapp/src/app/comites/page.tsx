import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { isCommitteeKind, type CommitteeRow } from "@/lib/committees";
import { CommitteesBoard } from "@/components/committees-board";

export const dynamic = "force-dynamic";

/** Comités de Gestión: solo el máster (sin «Ver como»). La tabla es nueva; sin la migración, la pantalla avisa y el resto de la app sale. */
export default async function ComitesPage() {
  if (!(await canUseDeveloper())) redirect("/");

  let committees: CommitteeRow[] | null = null;
  try {
    const rows = await prisma.managementCommittee.findMany({ orderBy: { startsAt: "asc" } });
    committees = rows.filter((r) => isCommitteeKind(r.kind)).map((r) => ({ id: r.id, name: r.name, startsAt: r.startsAt.toISOString(), kind: r.kind as CommitteeRow["kind"] }));
  } catch {
    committees = null;
  }

  return <CommitteesBoard committees={committees} />;
}
