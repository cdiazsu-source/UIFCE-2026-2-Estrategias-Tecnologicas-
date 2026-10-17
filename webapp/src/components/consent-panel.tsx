"use client";

import { useState, useTransition } from "react";
import { Check, Copy, FileSignature, FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  addConsentSignatory,
  deleteConsentSignatory,
  setConsentDriveAccess,
  setConsentPhotoReady,
  setConsentSigned,
  updateConsentDriveUrl,
  updateConsentSignatory,
} from "@/lib/actions/consent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonAvatar } from "@/components/person-avatar";
import { InfoHint } from "@/components/info-hint";
import { CollapseToggle, useCollapse } from "@/components/collapsible";
import { useCanManageConsent } from "@/components/access-context";
import { CONSENT_DOC_TEXT, CONSENT_PHOTO_REQUIREMENTS, consentTextFor } from "@/lib/consent";
import { formatDate } from "@/lib/utils";

export type ConsentRow = {
  id: string;
  name: string;
  signed: boolean;
  signedAt: Date | null;
  driveAccess: boolean;
  driveAccessAt: Date | null;
  photoReady: boolean;
  photoReadyAt: Date | null;
  driveFolderUrl: string | null;
  active: boolean;
  isET: boolean;
  photoUrl: string | null;
  color: string | null;
};

function DocBlock() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documento a firmar</p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(CONSENT_DOC_TEXT).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            });
          }}
          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar texto"}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-card p-3 text-xs leading-relaxed text-foreground">
        {CONSENT_DOC_TEXT}
      </pre>
      <p className="mt-2 text-xs text-muted-foreground">
        Los «XXX» los completa cada persona (nombre y cédula). Desde cada fila puedes copiar el texto con el nombre ya
        puesto.
      </p>
    </div>
  );
}

function Bar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const missing = total - done;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {done} / {total} · {pct}%{missing > 0 ? ` · faltan ${missing}` : " · completo"}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProgressChart({ rows }: { rows: ConsentRow[] }) {
  const total = rows.length;
  const signed = rows.filter((r) => r.signed).length;
  const drive = rows.filter((r) => r.driveAccess).length;
  const photo = rows.filter((r) => r.photoReady).length;
  const all = rows.filter((r) => r.signed && r.driveAccess && r.photoReady).length;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Avance del proyecto
        <InfoHint text="Cuántas personas cumplen cada ítem del checklist y cuántas faltan. «Todo listo» son las que ya firmaron, ya tienen acceso a su carpeta y ya tienen su foto lista. Las barras se actualizan al marcar cada fila abajo." />
      </p>
      <Bar label="Consentimientos firmados" done={signed} total={total} />
      <Bar label="Acceso a carpeta de Drive" done={drive} total={total} />
      <Bar label="Foto lista en la carpeta" done={photo} total={total} />
      <p className="text-xs text-muted-foreground">
        Todo listo (firmado, con acceso y con foto): <span className="font-medium text-foreground">{all}</span> de{" "}
        {total}
        {total - all > 0 ? ` · faltan ${total - all}` : ""}.
      </p>
      <p className="text-xs text-muted-foreground">Foto requerida: {CONSENT_PHOTO_REQUIREMENTS}</p>
    </div>
  );
}

function Toggle({
  on,
  onLabel,
  offLabel,
  at,
  disabled,
  title,
  onChange,
}: {
  on: boolean;
  onLabel: string;
  offLabel: string;
  at: Date | null;
  disabled: boolean;
  title?: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors disabled:cursor-default " +
        (on
          ? "border-success/40 bg-success/10 text-success"
          : "border-border text-muted-foreground " + (disabled ? "" : "hover:bg-accent"))
      }
      title={[title, at ? formatDate(at) : null].filter(Boolean).join(" · ") || undefined}
    >
      {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {on ? onLabel : offLabel}
    </button>
  );
}

function DriveButton({ row }: { row: ConsentRow }) {
  const canEdit = useCanManageConsent();
  const [editing, setEditing] = useState(false);

  if (editing && canEdit) {
    return (
      <form
        action={async (formData) => {
          await updateConsentDriveUrl(row.id, String(formData.get("driveFolderUrl") ?? ""));
          setEditing(false);
        }}
        className="flex items-center gap-1"
      >
        <Input
          name="driveFolderUrl"
          defaultValue={row.driveFolderUrl ?? ""}
          placeholder="https://drive.google.com/…"
          className="h-7 w-56 text-xs"
          autoFocus
        />
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    );
  }

  if (row.driveFolderUrl) {
    return (
      <span className="flex items-center gap-1">
        <a
          href={row.driveFolderUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs font-medium text-primary hover:bg-accent"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Abrir carpeta
        </a>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Editar enlace de la carpeta"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }

  if (canEdit) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-input px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
      >
        <Plus className="h-3.5 w-3.5" />
        Enlace de carpeta
      </button>
    );
  }

  return <span className="text-xs text-muted-foreground">Sin carpeta</span>;
}

function SignatoryRow({ row }: { row: ConsentRow }) {
  const canEdit = useCanManageConsent();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing && canEdit) {
    return (
      <li className="rounded-md border border-border p-3">
        <form
          action={async (formData) => {
            await updateConsentSignatory(row.id, formData);
            setEditing(false);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <Input name="name" defaultValue={row.name} placeholder="Nombre" className="w-56" />
          <Input
            name="driveFolderUrl"
            defaultValue={row.driveFolderUrl ?? ""}
            placeholder="Carpeta de Drive"
            className="w-64"
          />
          <Select name="active" defaultValue={String(row.active)} className="w-32">
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Select>
          <Button type="submit" size="sm">
            Guardar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md px-2 py-2 hover:bg-muted/50">
      <div className="flex min-w-[12rem] flex-1 items-center gap-2.5">
        <PersonAvatar name={row.name} photoUrl={row.photoUrl} ringColor={row.isET ? row.color : null} />
        <span className="text-sm font-medium">{row.name}</span>
      </div>

      <Toggle
        on={row.signed}
        onLabel="Firmó"
        offLabel="Sin firmar"
        at={row.signedAt}
        disabled={!canEdit || isPending}
        onChange={(next) => startTransition(() => setConsentSigned(row.id, next))}
      />
      <Toggle
        on={row.driveAccess}
        onLabel="Acceso a Drive"
        offLabel="Sin acceso"
        at={row.driveAccessAt}
        disabled={!canEdit || isPending}
        onChange={(next) => startTransition(() => setConsentDriveAccess(row.id, next))}
      />

      <Toggle
        on={row.photoReady}
        onLabel="Foto lista"
        offLabel="Sin foto"
        at={row.photoReadyAt}
        disabled={!canEdit || isPending}
        title={CONSENT_PHOTO_REQUIREMENTS}
        onChange={(next) => startTransition(() => setConsentPhotoReady(row.id, next))}
      />

      <DriveButton row={row} />

      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(consentTextFor(row.name)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          });
        }}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-accent"
        title="Copiar el documento con el nombre de esta persona"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Documento"}
      </button>

      {canEdit && (
        <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Editar integrante"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm(`¿Quitar a ${row.name} del panel de consentimientos?`)) return;
              startTransition(() => deleteConsentSignatory(row.id));
            }}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            aria-label="Quitar integrante"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </li>
  );
}

export function ConsentPanel({ signatories }: { signatories: ConsentRow[] }) {
  const canEdit = useCanManageConsent();
  const [adding, setAdding] = useState(false);
  const { open, toggle } = useCollapse("project:consentimientos");

  const active = signatories.filter((s) => s.active);
  const inactive = signatories.filter((s) => !s.active);

  return (
    <Card id="p-consentimientos" className="scroll-mt-20">
      <CardHeader className={open ? "" : "py-3"}>
        <CardTitle className="flex items-center gap-1.5">
          <CollapseToggle open={open} onToggle={toggle} label="los consentimientos" />
          <FileSignature className="h-4 w-4" />
          Consentimientos de uso de imagen
          <InfoHint text="Panel del proyecto: el documento a firmar, el avance (cuántas personas faltan por firmar, por recibir acceso a su carpeta y por tener su foto lista) y una fila por integrante para marcar «Firmó», «Acceso a Drive» y «Foto lista» (tipo carné, JPG, máx. 5 MB, dentro de su carpeta) y guardar el enlace a su carpeta. Con perfil completo se marcan los estados y se edita la lista. Ejemplo: «María Fernanda Celis · Firmó · Acceso a Drive · Foto lista · Abrir carpeta»." />
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="flex flex-col gap-4">
        <DocBlock />
        <ProgressChart rows={active} />

        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay integrantes en el panel.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {active.map((row) => (
              <SignatoryRow key={row.id} row={row} />
            ))}
          </ul>
        )}

        {inactive.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Inactivos ({inactive.length})</summary>
            <ul className="mt-2 flex flex-col divide-y divide-border">
              {inactive.map((row) => (
                <SignatoryRow key={row.id} row={row} />
              ))}
            </ul>
          </details>
        )}

        {canEdit && (
          <div>
            {adding ? (
              <form
                action={async (formData) => {
                  await addConsentSignatory(formData);
                  setAdding(false);
                }}
                className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
              >
                <Input name="name" placeholder="Nombre" required className="w-56" />
                <Input name="driveFolderUrl" placeholder="Carpeta de Drive (opcional)" className="w-64" />
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
                Agregar integrante
              </Button>
            )}
          </div>
        )}
      </CardContent>}
    </Card>
  );
}
