"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { InfoHint } from "@/components/info-hint";
import { ALLIED_SUPPORTS, SUPPORT_SEMESTERS, type AlliedSupport } from "@/lib/academic-allies-data";
import { COMMON_COURSES, PROGRAMS, PROGRAM_ORDER, type Component, type Course, type Program, type ProgramKey } from "@/lib/mallas-data";

/** «Aliados académicos»: los profesores que han pedido Apoyos Académicos y cómo se ubican en las mallas de Economía, Administración
 *  y Contaduría. Los datos son estáticos (`lib/academic-allies-data.ts`, generado desde el Excel de asignaciones; `lib/mallas-data.ts`),
 *  así que la sección funciona sin migración. Solo lectura para todos los perfiles. */

type View = "profesores" | "mallas" | "comunes";

const VIEWS: { id: View; label: string }[] = [
  { id: "profesores", label: "Profesores" },
  { id: "mallas", label: "Mallas" },
  { id: "comunes", label: "Asignaturas comunes" },
];

const PROGRAM_LABEL: Record<AlliedSupport["pg"], string> = {
  economia: "Economía",
  administracion: "Administración",
  contaduria: "Contaduría",
  otro: "Otro",
};

const CURRENT = "26-2";

/** Apoyos por programa y nombre exacto de asignatura de la malla. */
const SUPPORT_INDEX: Record<string, AlliedSupport[]> = {};
for (const a of ALLIED_SUPPORTS) {
  if (!a.m) continue;
  const k = `${a.pg}|${a.m}`;
  (SUPPORT_INDEX[k] ??= []).push(a);
}

function norm(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function romanOf(pg: ProgramKey, name: string): string {
  const p = PROGRAMS[pg];
  const i = p.sems.findIndex((s) => s.some((c) => c[0] === name));
  return i < 0 ? "" : p.roman[i];
}

function totalSessions(a: AlliedSupport) {
  return Object.values(a.s).reduce((n, v) => n + (v ?? 0), 0);
}

const COMPONENT_STYLE: Record<Component, string> = {
  F: "bg-[#E6E6FF] text-[#000066]",
  D: "bg-primary text-primary-foreground",
  L: "border border-border bg-card text-muted-foreground",
};

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function CountPill({ n, current }: { n?: number; current?: boolean }) {
  if (!n) return <span className="text-muted-foreground/50">·</span>;
  return (
    <span
      className={cn(
        "inline-block min-w-[1.5rem] rounded-full px-2 text-center text-xs tabular-nums",
        current ? "bg-brand-accent font-semibold text-brand-accent-foreground" : "bg-muted text-foreground",
      )}
    >
      {n}
    </span>
  );
}

function SupportTable({ rows, third }: { rows: { a: AlliedSupport; third: string }[]; third: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-2 py-1.5 font-medium">Profesor</th>
            <th className="px-2 py-1.5 font-medium">Asignatura</th>
            <th className="px-2 py-1.5 font-medium">{third}</th>
            <th className="px-2 py-1.5 font-medium">Software</th>
            {SUPPORT_SEMESTERS.map((s) => (
              <th key={s} className="px-2 py-1.5 text-center font-medium">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ a, third: t }, i) => (
            <tr key={`${a.p}-${a.c}-${i}`} className="border-t border-border align-top">
              <td className="px-2 py-2 font-medium">{a.p}</td>
              <td className="px-2 py-2">{a.c}</td>
              <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{t}</td>
              <td className="px-2 py-2 text-xs text-muted-foreground">{a.w.join(", ")}</td>
              {SUPPORT_SEMESTERS.map((s) => (
                <td key={s} className="px-2 py-2 text-center">
                  <CountPill n={a.s[s]} current={s === CURRENT} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfessorsView() {
  const [only26, setOnly26] = useState(false);
  const [pg, setPg] = useState<AlliedSupport["pg"] | "todos">("todos");
  const [q, setQ] = useState("");

  const professors = new Set(ALLIED_SUPPORTS.map((a) => a.p)).size;
  const sessions = ALLIED_SUPPORTS.reduce((n, a) => n + totalSessions(a), 0);
  const state: Record<string, number> = {};
  for (const a of ALLIED_SUPPORTS) for (const [k, v] of Object.entries(a.e)) state[k] = (state[k] ?? 0) + (v ?? 0);

  const nq = norm(q.trim());
  const list = useMemo(
    () =>
      ALLIED_SUPPORTS.filter(
        (a) =>
          (!only26 || a.s[CURRENT]) &&
          (pg === "todos" || a.pg === pg) &&
          (!nq || [a.p, a.c, ...a.w].some((f) => norm(f).includes(nq))),
      ),
    [only26, pg, nq],
  );

  const withMalla = list.filter((a) => a.m);
  const withoutMalla = list.filter((a) => !a.m);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <Stat value={professors} label="profesores aliados" />
        <Stat value={sessions} label="sesiones desde 2025-2" />
        <Stat
          value={`${state.DICTADA ?? 0} / ${state.ASIGNADA ?? 0} / ${state["SIN ASIGNAR"] ?? 0}`}
          label="2026-2: dictadas / asignadas / sin asignar"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar profesor, asignatura o software…" className="pl-8" aria-label="Buscar aliado académico" />
        </div>
        <Chip active={only26} onClick={() => setOnly26((v) => !v)}>
          Solo 2026-2
        </Chip>
        {(["todos", "contaduria", "administracion", "economia"] as const).map((k) => (
          <Chip key={k} active={pg === k} onClick={() => setPg(k)}>
            {k === "todos" ? "Todos los programas" : PROGRAM_LABEL[k]}
          </Chip>
        ))}
      </div>

      {list.length === 0 && <p className="text-sm text-muted-foreground">Ningún aliado coincide con ese filtro.</p>}

      {PROGRAM_ORDER.map((k) => {
        const rows = withMalla
          .filter((a) => a.pg === k)
          .sort((x, y) => PROGRAMS[k].roman.indexOf(romanOf(k, x.m!)) - PROGRAMS[k].roman.indexOf(romanOf(k, y.m!)) || x.c.localeCompare(y.c));
        if (!rows.length) return null;
        return (
          <div key={k} className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">{PROGRAMS[k].name}</h3>
            <SupportTable third="Semestre en la malla" rows={rows.map((a) => ({ a, third: romanOf(k, a.m!) }))} />
          </div>
        );
      })}

      {withoutMalla.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">Sin asignatura en la malla</h3>
          <p className="text-xs text-muted-foreground">
            Áreas, escuelas, semilleros, seminarios y asignaturas que no aparecen en el plan de estudios de su programa.
          </p>
          <SupportTable
            third="Programa"
            rows={withoutMalla.sort((x, y) => x.c.localeCompare(y.c)).map((a) => ({ a, third: PROGRAM_LABEL[a.pg] }))}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Cada número es la cantidad de sesiones de apoyo del semestre; en amarillo, las de 2026-2. Los nombres que venían escritos de varias formas
        se unificaron (por ejemplo «Ernesto Mejía» y «Gerardo Mejía»). Solo se muestra el nombre del profesor, sin datos de contacto.
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function CourseCard({ c, pg, showCodes }: { c: Course; pg: ProgramKey; showCodes: boolean }) {
  const [name, credits, code, comp, flag, sub] = c;
  const list = SUPPORT_INDEX[`${pg}|${name}`];
  const have = new Set<string>();
  list?.forEach((a) => Object.keys(a.s).forEach((s) => have.add(s)));
  const sems = SUPPORT_SEMESTERS.filter((s) => have.has(s));
  const title = list?.map((a) => `${a.p} (${a.w.join(", ")})`).join("; ");
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 break-words rounded-md px-2 py-1.5 text-xs leading-snug",
        COMPONENT_STYLE[comp],
        flag === 1 && "outline-dashed outline-1 -outline-offset-4 outline-current",
        flag === "tall" && "min-h-[7.5rem] flex-1 justify-center text-center",
      )}
    >
      <b className="font-medium">{name}</b>
      {sub && <span className="text-[11px] opacity-75">{sub}</span>}
      {(credits > 0 || (showCodes && code)) && (
        <span className="text-[11px] tabular-nums opacity-75">
          {credits > 0 ? `${credits} cr` : ""}
          {showCodes && code ? ` · ${code}` : ""}
        </span>
      )}
      {sems.length > 0 && (
        <span
          title={title}
          className={cn(
            "mt-0.5 w-fit rounded-full border px-2 text-[10.5px]",
            have.has(CURRENT) ? "border-brand-accent bg-brand-accent font-semibold text-brand-accent-foreground" : "border-current",
          )}
        >
          Apoyo {sems.join(" · ")}
        </span>
      )}
    </div>
  );
}

function MallaView() {
  const [key, setKey] = useState<ProgramKey>("contaduria");
  const [showCodes, setShowCodes] = useState(false);
  const P: Program = PROGRAMS[key];
  const sum = (t: Component) => P.sems.reduce((n, s) => n + s.filter((c) => c[3] === t).reduce((m, c) => m + c[1], 0), 0);
  const total = P.sems.reduce((n, s) => n + s.reduce((m, c) => m + c[1], 0), 0);
  const ing = P.ing.reduce((n, i) => n + i[1], 0);
  const withSupport = P.sems.flat().filter((c) => SUPPORT_INDEX[`${key}|${c[0]}`]).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {PROGRAM_ORDER.map((k) => (
          <Chip key={k} active={key === k} onClick={() => setKey(k)}>
            {PROGRAMS[k].tab}
          </Chip>
        ))}
        <button type="button" onClick={() => setShowCodes((v) => !v)} className="ml-auto text-xs text-primary underline underline-offset-2">
          {showCodes ? "Ocultar códigos" : "Mostrar códigos"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <Key swatch="bg-[#E6E6FF]" label={`Fundamentación ${sum("F")}`} />
        <Key swatch="bg-primary" label={`Disciplinar ${sum("D")}`} />
        <Key swatch="border border-border bg-card" label={`Libre elección ${sum("L")}`} />
        <Key swatch="bg-brand-accent" label={`Idiomas${ing ? ` ${ing}` : ""}`} />
        <span>
          Amarillo: apoyo en 2026-2 · {withSupport} {withSupport === 1 ? "asignatura con apoyo" : "asignaturas con apoyo"} desde 2025-2
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[68rem] grid-cols-10 gap-2">
          {P.sems.map((s, i) => (
            <section key={i} className="flex min-w-0 flex-col gap-1.5">
              <h3 className="flex items-baseline justify-between text-sm font-semibold">
                {P.roman[i]}
                <span className="text-xs font-normal tabular-nums text-muted-foreground">{s.reduce((n, c) => n + c[1], 0)} cr</span>
              </h3>
              {s.map((c, j) => (
                <CourseCard key={j} c={c} pg={key} showCodes={showCodes} />
              ))}
              {i < 4 && (
                <div className="rounded-md bg-brand-accent px-2 py-1.5 text-xs leading-snug text-brand-accent-foreground">
                  <b className="font-medium">{P.ing[i][0]}</b>
                  {P.ing[i][1] > 0 && <span className="block text-[11px] tabular-nums opacity-75">{P.ing[i][1]} cr</span>}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-3">
        <Stat value={total} label="créditos del programa" />
        {ing > 0 && <Stat value={ing} label="créditos de inglés" />}
        {ing > 0 && <Stat value={total + ing} label="total de la carrera" />}
        <Stat value={10} label="semestres" />
      </div>
      <p className="text-xs text-muted-foreground">{P.note} Las asignaturas con borde punteado son optativas.</p>
    </div>
  );
}

function Key({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <i className={cn("inline-block h-3.5 w-3.5 rounded", swatch)} aria-hidden />
      {label}
    </span>
  );
}

function CommonView() {
  const groups: { title: string; rows: typeof COMMON_COURSES }[] = [
    { title: "Están en los tres programas", rows: COMMON_COURSES.slice(0, 7) },
    { title: "Administración y Contaduría", rows: COMMON_COURSES.slice(7, 11) },
    { title: "Economía y Contaduría", rows: COMMON_COURSES.slice(11) },
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        El semestre en que cada programa dicta la asignatura. Una visita a una asignatura de primer semestre llega a los tres programas a la vez.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="px-2 py-1.5 font-medium">Asignatura</th>
              {PROGRAM_ORDER.map((k) => (
                <th key={k} className="px-2 py-1.5 font-medium">
                  {PROGRAMS[k].tab === "Administración de Empresas" ? "Administración" : PROGRAMS[k].tab}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.title} title={g.title} rows={g.rows} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Se compararon por nombre. Macroeconomía I y Microeconomía I están en los tres programas, pero cambian de semestre.
      </p>
    </div>
  );
}

function GroupRows({ title, rows }: { title: string; rows: typeof COMMON_COURSES }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="px-2 pb-1 pt-4 text-xs font-semibold text-primary">
          {title}
        </td>
      </tr>
      {rows.map(([name, sems]) => (
        <tr key={name} className="border-t border-border">
          <td className="px-2 py-2">{name}</td>
          {sems.map((s, i) => (
            <td key={i} className="px-2 py-2">
              {s ? <span className="inline-block min-w-[2rem] rounded-full bg-muted px-2.5 text-center text-xs font-medium tabular-nums">{s}</span> : <span className="text-xs text-muted-foreground/60">no está</span>}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AcademicAlliesSection() {
  const [view, setView] = useState<View>("profesores");
  return (
    <div id="aliados-academicos" className="flex scroll-mt-20 flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-1.5 text-lg font-bold">
          <GraduationCap className="h-5 w-5" aria-hidden />
          Aliados académicos
          <InfoHint text="Profesores que han pedido Apoyos Académicos a la UIFCE y las asignaturas donde lo hicieron, ubicadas en las mallas de Economía, Administración y Contaduría. Cómo se usa: en «Profesores» se busca por nombre, asignatura o software; en «Mallas» se ve en qué semestre de cada carrera hay apoyo (en amarillo, el de 2026-2); en «Asignaturas comunes», qué materias comparten los programas. Para convocar a un evento, conviene empezar por un profesor con apoyo este semestre." />
        </h2>
        <p className="text-sm text-muted-foreground">
          Red de profesores aliados por programa curricular, con los apoyos académicos de 2025-2 a 2026-2.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Vista de aliados académicos">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => setView(v.id)}
            className={cn(
              "press rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              view === v.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === "profesores" && <ProfessorsView />}
      {view === "mallas" && <MallaView />}
      {view === "comunes" && <CommonView />}
    </div>
  );
}
