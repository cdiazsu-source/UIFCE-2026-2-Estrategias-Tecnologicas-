import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";
import { SEARCH_MIN_CHARS, SEARCH_PER_GROUP, searchModules, searchTerms, snippet, type SearchHit } from "@/lib/search";

export const dynamic = "force-dynamic";

/** Cada palabra debe aparecer (en alguno de los campos); las palabras se combinan con Y. */
function matchAll(terms: string[], fields: string[]) {
  return { AND: terms.map((t) => ({ OR: fields.map((f) => ({ [f]: { contains: t, mode: "insensitive" as const } })) })) };
}

/** Una consulta que falla (tabla ausente, BD lenta) no tumba la búsqueda: ese grupo queda vacío. */
async function safe<T>(run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch {
    return [];
  }
}

/** Buscador global: módulos, proyectos, subtareas, bitácora, proyectos de estudio, empresas, plantillas y herramientas.
 *  Solo con sesión. El Junior ve los mismos proyectos que en el panel, pero de estudio únicamente el suyo. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session.authed) return NextResponse.json({ hits: [] }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q") ?? "";
  const terms = searchTerms(q.slice(0, 80));
  if (q.trim().length < SEARCH_MIN_CHARS || terms.length === 0) return NextResponse.json({ hits: [] }, { headers: { "Cache-Control": "no-store" } });

  const isJunior = !!session.juniorKey;
  const canUseDeveloper = session.isMaster && !session.viewing;
  const take = SEARCH_PER_GROUP;

  const [projects, items, notes, study, companies, templates, tools] = await Promise.all([
    safe(() =>
      prisma.project.findMany({
        where: {
          OR: [
            matchAll(terms, ["title", "description", "expectedOutcome", "category", "location"]),
            { AND: terms.map((t) => ({ tags: { has: t.toLowerCase() } })) },
          ],
        },
        orderBy: [{ status: "asc" }, { sourceOrder: "asc" }],
        take,
        select: { id: true, title: true, category: true, status: true, description: true },
      }),
    ),
    safe(() =>
      prisma.checklistItem.findMany({
        where: matchAll(terms, ["text"]),
        orderBy: { updatedAt: "desc" },
        take,
        select: { id: true, text: true, done: true, project: { select: { id: true, title: true } } },
      }),
    ),
    safe(() =>
      prisma.projectNote.findMany({
        where: matchAll(terms, ["body"]),
        orderBy: { createdAt: "desc" },
        take,
        select: { id: true, body: true, author: true, project: { select: { id: true, title: true } } },
      }),
    ),
    safe(async () => {
      let ownerId: string | undefined;
      if (isJunior) {
        const me = session.viewWho ? await prisma.user.findFirst({ where: { credentialKey: session.viewWho }, select: { id: true } }) : null;
        if (!me) return [];
        ownerId = me.id;
      }
      return prisma.studyProject.findMany({
        where: { ...(ownerId ? { ownerId } : {}), ...matchAll(terms, ["title", "description", "schedule"]) },
        take,
        select: { id: true, title: true, description: true, owner: { select: { name: true } } },
      });
    }),
    safe(() => prisma.targetCompany.findMany({ where: matchAll(terms, ["name", "sector", "notes"]), orderBy: { order: "asc" }, take, select: { id: true, name: true, sector: true } })),
    safe(() => prisma.template.findMany({ where: matchAll(terms, ["name", "category", "description", "format", "notes"]), orderBy: { order: "asc" }, take, select: { id: true, name: true, category: true } })),
    safe(() => prisma.tool.findMany({ where: matchAll(terms, ["name", "notes", "location"]), take, select: { id: true, name: true, notes: true } })),
  ]);

  const hits: SearchHit[] = [
    ...searchModules(terms, { isJunior, canUseDeveloper }),
    ...projects.map((p): SearchHit => ({ id: `p-${p.id}`, group: "proyectos", title: p.title, detail: `${p.category} · ${PROJECT_STATUS_LABEL[p.status] ?? p.status}`, href: `/proyectos/${p.id}` })),
    ...items.map((i): SearchHit => ({ id: `s-${i.id}`, group: "subtareas", title: snippet(i.text, terms, 90), detail: `${i.done ? "Hecha" : "Pendiente"} · ${i.project.title}`, href: `/proyectos/${i.project.id}` })),
    ...notes.map((n): SearchHit => ({ id: `n-${n.id}`, group: "notas", title: snippet(n.body, terms, 90), detail: `${n.author} · ${n.project.title}`, href: `/proyectos/${n.project.id}` })),
    ...study.map((s): SearchHit => ({ id: `e-${s.id}`, group: "estudio", title: s.title, detail: s.owner.name, href: "/proyectos-de-estudio" })),
    ...companies.map((c): SearchHit => ({ id: `c-${c.id}`, group: "empresas", title: c.name, detail: c.sector, href: "/aliados#empresas-interes" })),
    ...templates.map((t): SearchHit => ({ id: `t-${t.id}`, group: "plantillas", title: t.name, detail: t.category, href: "/plantillas" })),
    ...tools.map((t): SearchHit => ({ id: `h-${t.id}`, group: "herramientas", title: t.name, detail: t.notes ? snippet(t.notes, terms, 80) : null, href: "/herramientas" })),
  ];
  return NextResponse.json({ hits }, { headers: { "Cache-Control": "no-store" } });
}
