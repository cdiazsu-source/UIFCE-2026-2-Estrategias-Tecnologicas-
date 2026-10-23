"use client";

import { useMemo, useState } from "react";
import { Check, Copy, X } from "lucide-react";

import { buildDeveloperPrompt, type DeveloperSnapshot } from "@/lib/developer-prompt";
import {
  DEV_CHANGE_KINDS,
  DEV_MODULES,
  DEV_MODULE_GROUPS,
  hasFocus,
  type DevProjectOption,
} from "@/lib/developer-modules";
import { copyText } from "@/lib/copy-text";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const INCLUDES = [
  "Qué es el proyecto, quiénes lo usan y de dónde salen los proyectos (el CSV de planeación)",
  "Stack, despliegue y cómo verificar (tsc, build, dev)",
  "Árbol de carpetas y mapa de rutas",
  "Modelo de datos y reglas del seed",
  "Patrones de código: server actions, permisos, fechas, estilo, ocultar/expandir",
  "Acceso y seguridad (perfiles y Vista Junior; sin contraseñas)",
  "Reglas duras: identidad de git, migraciones a mano, repo público, CRLF",
  "Flujo de ejecución y cierre con el bloque de sincronización",
  "Foco opcional: módulo, apartados y proyecto con sus archivos, modelos y permisos, y cómo estructurar el tipo de cambio",
  "Estado en vivo (última migración, semestre vigente, volumen) y tu modificación",
];

/** Máximo de proyectos que se listan a la vez en el selector (se filtra escribiendo). */
const PROJECT_LIST_MAX = 60;

function Chip({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Panel de «Desarrollador»: elige dónde se aplica el cambio (módulo, apartados, proyecto y tipo de
 *  estructuración), escribe la modificación y copia el prompt completo para Claude Code. */
export function DeveloperPromptPanel({ snapshot, projects }: { snapshot: DeveloperSnapshot; projects: DevProjectOption[] }) {
  const [change, setChange] = useState("");
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [sectionKeys, setSectionKeys] = useState<string[]>([]);
  const [kindIds, setKindIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId]);
  const focus = useMemo(() => ({ moduleIds, sectionKeys, kindIds, project }), [moduleIds, sectionKeys, kindIds, project]);
  const prompt = useMemo(() => buildDeveloperPrompt(change, snapshot, focus), [change, snapshot, focus]);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  function toggleModule(id: string) {
    if (moduleIds.includes(id)) setSectionKeys((keys) => keys.filter((k) => !k.startsWith(`${id}:`)));
    setModuleIds((ids) => toggle(ids, id));
  }

  const q = projectQuery.trim().toLowerCase();
  const matches = useMemo(() => {
    const found = q ? projects.filter((p) => `${p.title} ${p.category} ${p.id}`.toLowerCase().includes(q)) : projects;
    return found.slice(0, PROJECT_LIST_MAX);
  }, [projects, q]);

  async function copy() {
    const ok = await copyText(prompt);
    setFailed(!ok);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function clearFocus() {
    setModuleIds([]);
    setSectionKeys([]);
    setKindIds([]);
    setProjectId("");
    setProjectQuery("");
  }

  const selectedModules = DEV_MODULES.filter((m) => moduleIds.includes(m.id));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>Prompt para Claude Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <section className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">¿Dónde se aplica? <span className="font-normal text-muted-foreground">(opcional)</span></h2>
              {hasFocus(focus) && (
                <button type="button" onClick={clearFocus} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" /> Quitar el foco
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Elige lo que vas a estructurar y el prompt le entrega a la IA sus archivos, modelos, permisos y apartados reales.
            </p>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Módulo o pantalla</span>
              {DEV_MODULE_GROUPS.map((group) => (
                <div key={group} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-full text-[11px] uppercase tracking-wide text-muted-foreground/80 sm:w-36">{group}</span>
                  {DEV_MODULES.filter((m) => m.group === group).map((m) => (
                    <Chip key={m.id} active={moduleIds.includes(m.id)} onClick={() => toggleModule(m.id)} title={m.route}>
                      {m.label}
                    </Chip>
                  ))}
                </div>
              ))}
            </div>

            {selectedModules.map((m) => (
              <div key={m.id} className="flex flex-col gap-1.5 rounded-md border border-border bg-background p-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium">{m.label}</span>
                  <code className="text-[11px] text-muted-foreground">{m.route}</code>
                </div>
                <p className="text-xs text-muted-foreground">{m.summary.replace(/`/g, "")}</p>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Apartados (marca los que cambian)</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {m.sections.map((s) => {
                      const key = `${m.id}:${s.id}`;
                      return (
                        <label key={key} title={s.detail} className="flex cursor-pointer items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={sectionKeys.includes(key)}
                            onChange={() => setSectionKeys((keys) => toggle(keys, key))}
                            className="h-3.5 w-3.5 accent-[hsl(var(--primary))]"
                          />
                          {s.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Un proyecto concreto del tracker</span>
              {project ? (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs">
                  <span className="font-medium">{project.title}</span>
                  <span className="text-muted-foreground">
                    {project.category} · {project.statusLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProjectId("")}
                    className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Quitar
                  </button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                  <Input
                    value={projectQuery}
                    onChange={(e) => setProjectQuery(e.target.value)}
                    placeholder="Buscar proyecto…"
                    aria-label="Buscar proyecto"
                    disabled={projects.length === 0}
                  />
                  <Select
                    value=""
                    onChange={(e) => setProjectId(e.target.value)}
                    aria-label="Proyecto en foco"
                    disabled={projects.length === 0}
                  >
                    <option value="">
                      {projects.length === 0
                        ? "No se pudieron leer los proyectos"
                        : `Elegir proyecto (${matches.length}${matches.length === PROJECT_LIST_MAX ? "+" : ""} de ${projects.length})`}
                    </option>
                    {matches.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — {p.category}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {project && (
                <p className="text-[11px] text-muted-foreground">
                  Se incluye también el detalle de proyecto (/proyectos/[id]) y, si este proyecto lleva un panel propio, cómo está enganchado.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Tipo de estructuración</span>
              <div className="flex flex-wrap gap-1.5">
                {DEV_CHANGE_KINDS.map((k) => (
                  <Chip key={k.id} active={kindIds.includes(k.id)} onClick={() => setKindIds((ids) => toggle(ids, k.id))} title={k.hint}>
                    {k.label}
                  </Chip>
                ))}
              </div>
            </div>
          </section>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">¿Qué modificación quieres hacer?</span>
            <Textarea
              value={change}
              onChange={(e) => setChange(e.target.value)}
              placeholder="Describe el cambio con tus palabras, aunque sea grande: qué quieres agregar o cambiar, para quién, en qué pantalla, cómo debe comportarse y cómo sabrás que quedó bien. La IA lo desplegará antes de ejecutarlo."
              className="min-h-[160px]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar prompt completo"}
            </Button>
            <span className="text-xs text-muted-foreground">{prompt.length.toLocaleString("es-CO")} caracteres</span>
            {failed && (
              <span className="text-xs text-destructive">
                No se pudo copiar automáticamente: abre «Ver el prompt completo» y cópialo a mano.
              </span>
            )}
          </div>

          <details className="rounded-md border border-border bg-muted/30 text-xs">
            <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground">Ver el prompt completo</summary>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-border px-3 py-2 font-sans leading-relaxed">
              {prompt}
            </pre>
          </details>

          <p className="text-xs text-muted-foreground">
            Pégalo en Claude Code abierto dentro de la carpeta del repositorio. El prompt le dice qué leer, cómo
            ejecutar, qué no tocar y cómo cerrar; tú solo lo pegas.
          </p>
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Qué incluye el prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
            {INCLUDES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
