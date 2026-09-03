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
import type { SocialChannelStatus, SocialPlatform } from "@prisma/client";

import { addSocialChannel, deleteSocialChannel, updateSocialChannel } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { formatDate } from "@/lib/utils";

export type SocialChannelData = {
  id: string;
  platform: SocialPlatform;
  handle: string | null;
  url: string | null;
  status: SocialChannelStatus;
  official: boolean;
  followers: number | null;
  cadence: string | null;
  lastPostAt: Date | null;
  lastPostNote: string | null;
  nextAction: string | null;
  notes: string | null;
  responsible: { id: string; name: string } | null;
  project: { id: string; title: string } | null;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm">{children}</div>
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
            {channel.official && <Badge variant="outline">Oficializada</Badge>}
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
              <Select name="status" defaultValue={channel.status} className="w-36">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="official" defaultChecked={channel.official} className="h-4 w-4" />
                Oficializada
              </label>
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {channels.map((c) => (
            <ChannelCard key={c.id} channel={c} people={people} />
          ))}
        </div>
      )}
    </div>
  );
}
