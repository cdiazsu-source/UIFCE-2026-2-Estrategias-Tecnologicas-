"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AtSign,
  ExternalLink,
  Instagram,
  Linkedin,
  Pencil,
  Plus,
  Radio,
  Trash2,
  Youtube,
} from "lucide-react";
import type { SocialChannelStatus, SocialOfficialStatus, SocialPlatform } from "@prisma/client";

import {
  addSocialChannel,
  addSocialInteraction,
  deleteSocialChannel,
  deleteSocialInteraction,
  updateSocialChannel,
  updateSocialInteraction,
} from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { SocialMetricsPanel, type SocialMetricData } from "@/components/social-metrics";
import { formatDate } from "@/lib/utils";

export type SocialInteractionData = {
  id: string;
  at: Date;
  title: string;
  detail: string | null;
  followers: number | null;
  reach: number | null;
  interactions: number | null;
  url: string | null;
};

export type SocialChannelData = {
  id: string;
  platform: SocialPlatform;
  handle: string | null;
  url: string | null;
  status: SocialChannelStatus;
  officialStatus: SocialOfficialStatus;
  followers: number | null;
  cadence: string | null;
  lastPostAt: Date | null;
  lastPostNote: string | null;
  nextAction: string | null;
  notes: string | null;
  responsible: { id: string; name: string } | null;
  project: { id: string; title: string } | null;
  interactions: SocialInteractionData[];
  metrics: SocialMetricData[];
};

const PLATFORM_LABEL: Record<SocialPlatform, string> = {
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  X: "X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
};

const PLATFORM_ORDER: SocialPlatform[] = ["INSTAGRAM", "LINKEDIN", "X", "TIKTOK", "YOUTUBE", "FACEBOOK"];

function PlatformIcon({ platform }: { platform: SocialPlatform }) {
  const cls = "h-4 w-4";
  if (platform === "INSTAGRAM") return <Instagram className={cls} />;
  if (platform === "LINKEDIN") return <Linkedin className={cls} />;
  if (platform === "YOUTUBE") return <Youtube className={cls} />;
  if (platform === "TIKTOK") return <Radio className={cls} />;
  return <AtSign className={cls} />;
}

const STATUS_LABEL: Record<SocialChannelStatus, string> = {
  ACTIVA: "Activa",
  EN_RIESGO: "En riesgo",
  EN_TRAMITE: "En trámite",
  INACTIVA: "Inactiva",
  PERDIDA: "Perdida",
};

const STATUS_VARIANT: Record<SocialChannelStatus, "success" | "warning" | "secondary" | "destructive"> = {
  ACTIVA: "success",
  EN_RIESGO: "warning",
  EN_TRAMITE: "warning",
  INACTIVA: "secondary",
  PERDIDA: "destructive",
};

const STATUS_OPTIONS: SocialChannelStatus[] = ["ACTIVA", "EN_RIESGO", "EN_TRAMITE", "INACTIVA", "PERDIDA"];

const OFFICIAL_LABEL: Record<SocialOfficialStatus, string> = {
  OFICIALIZADA: "Oficializada",
  EN_TRAMITE: "Oficialización en trámite",
  SIN_OFICIALIZAR: "Sin oficializar",
};

const OFFICIAL_VARIANT: Record<SocialOfficialStatus, "success" | "warning" | "outline"> = {
  OFICIALIZADA: "success",
  EN_TRAMITE: "warning",
  SIN_OFICIALIZAR: "outline",
};

const OFFICIAL_OPTIONS: SocialOfficialStatus[] = ["OFICIALIZADA", "EN_TRAMITE", "SIN_OFICIALIZAR"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function num(n: number | null): string {
  return n != null ? n.toLocaleString("es-CO") : "—";
}

function InteractionFields({ it }: { it?: SocialInteractionData }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input
          name="at"
          type="date"
          defaultValue={(it ? it.at : new Date()).toISOString().slice(0, 10)}
          className="w-40"
        />
        <Input name="title" defaultValue={it?.title ?? ""} placeholder="Qué pasó (una línea)" required className="min-w-[14rem] flex-1" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input name="followers" type="number" min={0} defaultValue={it?.followers ?? ""} placeholder="Seguidores" className="w-32" />
        <Input name="reach" type="number" min={0} defaultValue={it?.reach ?? ""} placeholder="Alcance" className="w-32" />
        <Input name="interactions" type="number" min={0} defaultValue={it?.interactions ?? ""} placeholder="Interacciones" className="w-32" />
        <Input name="url" defaultValue={it?.url ?? ""} placeholder="Enlace" className="min-w-[10rem] flex-1" />
      </div>
      <Textarea name="detail" defaultValue={it?.detail ?? ""} placeholder="Detalle (opcional)" className="min-h-[48px]" />
    </>
  );
}

function InteractionRow({ it }: { it: SocialInteractionData }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="rounded-md border border-border p-3">
        <form
          action={async (formData) => {
            const u = await updateSocialInteraction(it.id, formData);
            if (u) undo(u);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <InteractionFields it={it} />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </li>
    );
  }

  const stats = [
    it.followers != null ? `${num(it.followers)} seg.` : null,
    it.reach != null ? `${num(it.reach)} alcance` : null,
    it.interactions != null ? `${num(it.interactions)} interacc.` : null,
  ].filter(Boolean);

  return (
    <li className="group relative rounded-md border-l-2 border-primary/30 py-1.5 pl-3 pr-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{formatDate(it.at)}</span>
        {canEdit && (
          <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar interacción"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm("¿Eliminar esta interacción?")) return;
                startTransition(async () => {
                  const u = await deleteSocialInteraction(it.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar interacción"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
      <p className="text-sm leading-snug">
        {it.url ? (
          <a href={it.url} target="_blank" rel="noreferrer" className="hover:underline">
            {it.title}
          </a>
        ) : (
          it.title
        )}
      </p>
      {stats.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">{stats.join(" · ")}</p>}
      {it.detail && <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">{it.detail}</p>}
    </li>
  );
}

function Interactions({ channel }: { channel: SocialChannelData }) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(false);

  const items = channel.interactions;
  const shown = open ? items : items.slice(0, 3);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Interacciones y trazabilidad ({items.length})
          <InfoHint text="Bitácora de números e hitos de la cuenta, con fecha, para ver su evolución. Cómo se usa: con perfil completo, «Registrar» un dato (fecha, título y, opcional, seguidores / alcance / interacciones / enlace / detalle). Se ordena del más reciente al más antiguo. Ejemplo: «12 sep 2026 · Reel de bienvenida al semestre · 1.240 alcance · 96 interacciones»." />
        </p>
        {canEdit && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Registrar
          </Button>
        )}
      </div>

      {canEdit && adding && (
        <form
          action={async (formData) => {
            await addSocialInteraction(channel.id, formData);
            setAdding(false);
          }}
          className="mt-2 flex flex-col gap-2 rounded-md border border-dashed border-input p-3"
        >
          <InteractionFields />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Aún no hay interacciones registradas.</p>
      ) : (
        <>
          <ul className="mt-2 flex flex-col gap-2">
            {shown.map((it) => (
              <InteractionRow key={it.id} it={it} />
            ))}
          </ul>
          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-2 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {open ? "Ver menos" : `Ver todas (${items.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ChannelCard({
  channel,
  people,
}: {
  channel: SocialChannelData;
  people: { id: string; name: string }[];
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dash = <span className="text-muted-foreground">—</span>;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <PlatformIcon platform={channel.platform} />
              {PLATFORM_LABEL[channel.platform]}
            </span>
            <Badge variant={STATUS_VARIANT[channel.status]}>{STATUS_LABEL[channel.status]}</Badge>
            <Badge variant={OFFICIAL_VARIANT[channel.officialStatus]}>
              {OFFICIAL_LABEL[channel.officialStatus]}
            </Badge>
          </div>
          {channel.handle && (
            <span className="text-xs text-muted-foreground">
              {channel.url ? (
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                >
                  {channel.handle}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                channel.handle
              )}
            </span>
          )}
        </div>
        {canEdit && !editing && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar cuenta"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`¿Eliminar la cuenta de ${PLATFORM_LABEL[channel.platform]}?`)) return;
                startTransition(async () => {
                  const u = await deleteSocialChannel(channel.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar cuenta"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {editing ? (
          <form
            action={async (formData) => {
              const u = await updateSocialChannel(channel.id, formData);
              if (u) undo(u);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex flex-wrap gap-2">
              <Input name="handle" defaultValue={channel.handle ?? ""} placeholder="@usuario" className="w-40" />
              <Input name="url" defaultValue={channel.url ?? ""} placeholder="URL del perfil" className="min-w-[12rem] flex-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select name="status" defaultValue={channel.status} className="w-36" aria-label="Estado">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
              <Select
                name="officialStatus"
                defaultValue={channel.officialStatus}
                className="w-52"
                aria-label="Oficialización"
              >
                {OFFICIAL_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {OFFICIAL_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                name="followers"
                type="number"
                min={0}
                defaultValue={channel.followers ?? ""}
                placeholder="Seguidores"
                className="w-32"
              />
              <Input
                name="lastPostAt"
                type="date"
                defaultValue={channel.lastPostAt ? channel.lastPostAt.toISOString().slice(0, 10) : ""}
                className="w-40"
              />
            </div>
            <Input name="cadence" defaultValue={channel.cadence ?? ""} placeholder="Cadencia objetivo" />
            <Input name="lastPostNote" defaultValue={channel.lastPostNote ?? ""} placeholder="Qué fue la última publicación" />
            <Select name="responsibleId" defaultValue={channel.responsible?.id ?? ""} className="w-full sm:w-64">
              <option value="">Sin responsable</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Textarea name="nextAction" defaultValue={channel.nextAction ?? ""} placeholder="Próximo paso" className="min-h-[56px]" />
            <Textarea name="notes" defaultValue={channel.notes ?? ""} placeholder="Notas" className="min-h-[56px]" />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Seguidores">
                {channel.followers != null ? channel.followers.toLocaleString("es-CO") : dash}
              </Field>
              <Field label="Cadencia objetivo">{channel.cadence || dash}</Field>
              <Field label="Última publicación">
                {channel.lastPostAt ? (
                  <span>
                    {formatDate(channel.lastPostAt)}
                    {channel.lastPostNote ? ` · ${channel.lastPostNote}` : ""}
                  </span>
                ) : (
                  dash
                )}
              </Field>
              <Field label="Responsable">{channel.responsible?.name || dash}</Field>
              <Field label="Próximo paso">
                <span className="whitespace-pre-line">{channel.nextAction || dash}</span>
              </Field>
              <Field label="Proyecto vinculado">
                {channel.project ? (
                  <Link href={`/proyectos/${channel.project.id}`} className="text-primary hover:underline">
                    {channel.project.title}
                  </Link>
                ) : (
                  dash
                )}
              </Field>
              {channel.notes && (
                <div className="sm:col-span-2">
                  <Field label="Notas">
                    <span className="whitespace-pre-line text-muted-foreground">{channel.notes}</span>
                  </Field>
                </div>
              )}
            </div>
            <Interactions channel={channel} />
            {(channel.platform === "INSTAGRAM" || channel.platform === "LINKEDIN") && (
              <SocialMetricsPanel
                channel={{ id: channel.id, platform: channel.platform, metrics: channel.metrics }}
                people={people}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SocialPanel({
  channels,
  people,
}: {
  channels: SocialChannelData[];
  people: { id: string; name: string }[];
}) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);

  const present = new Set(channels.map((c) => c.platform));
  const missing = PLATFORM_ORDER.filter((p) => !present.has(p));

  return (
    <div className="flex flex-col gap-4">
      {canEdit && missing.length > 0 && (
        <div>
          {adding ? (
            <form
              action={async (formData) => {
                await addSocialChannel(formData);
                setAdding(false);
              }}
              className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-input p-3"
            >
              <Select name="platform" defaultValue={missing[0]} className="w-44">
                {missing.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABEL[p]}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm">
                Agregar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </form>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              Agregar cuenta
            </Button>
          )}
        </div>
      )}

      {channels.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Todavía no hay cuentas registradas.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {channels.map((c) => (
            <ChannelCard key={c.id} channel={c} people={people} />
          ))}
        </div>
      )}
    </div>
  );
}
