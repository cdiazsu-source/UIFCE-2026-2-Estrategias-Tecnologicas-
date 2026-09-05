"use client";

import { useState } from "react";
import { AlertTriangle, Linkedin, Pencil } from "lucide-react";

import { updateUserContact } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/person-avatar";
import { PhotoField } from "@/components/photo-field";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";
import { personColor } from "@/lib/person-color";
import { USER_ROLE_LABEL } from "@/lib/utils";

export type RosterMember = {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
  linkedinUrl: string | null;
  color: string | null;
  /** Proyectos activos en «❗ Atención Inmediata» donde tiene alguna subtarea. */
  urgentCount: number;
};

/** Atajo titilante en el color de la persona: lleva al panel filtrado a sus
 *  proyectos que requieren atención (?focus=<id>). */
function FocusPill({ member }: { member: RosterMember }) {
  const color = personColor(member);
  return (
    <a
      href={`/?focus=${member.id}#proyectos`}
      className="animate-et-blink inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
      {member.urgentCount} {member.urgentCount === 1 ? "requiere" : "requieren"} tu atención
    </a>
  );
}

function MemberCard({ member }: { member: RosterMember }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  const roleLabel = USER_ROLE_LABEL[member.role] ?? member.role;

  if (editing) {
    return (
      <li className="rounded-md border border-border p-3">
        <p className="mb-2 text-sm font-medium">{member.name}</p>
        <form
          action={async (formData) => {
            await updateUserContact(member.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <PhotoField personName={member.name} defaultValue={member.photoUrl} />
          <Input
            name="linkedinUrl"
            type="url"
            defaultValue={member.linkedinUrl ?? ""}
            placeholder="LinkedIn: https://www.linkedin.com/in/…"
            className="h-8 text-sm"
          />
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

  const inner = (
    <>
      <PersonAvatar name={member.name} photoUrl={member.photoUrl} size="md" />
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate text-sm font-medium">
          {member.name}
          {member.linkedinUrl && <Linkedin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
        </p>
        <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
      </div>
    </>
  );

  return (
    <li className="group relative flex flex-col gap-1.5">
      {member.linkedinUrl ? (
        <a
          href={member.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
        >
          {inner}
        </a>
      ) : (
        <div className="flex items-center gap-3 rounded-md border border-border p-3">{inner}</div>
      )}
      {member.urgentCount > 0 && <FocusPill member={member} />}
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
          aria-label={`Editar foto y LinkedIn de ${member.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

export function TeamRoster({ people }: { people: RosterMember[] }) {
  if (people.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Integrantes
        <InfoHint text="El equipo de ET que ejecuta los proyectos (máster y monitores). Cómo se usa: clic en una persona abre su LinkedIn; con perfil completo, el lápiz permite subir o cambiar su foto (se comprime en el navegador) y pegar su enlace de LinkedIn. Ejemplo: «Cesar Diaz · Máster · linkedin.com/in/…»." />
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {people.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </ul>
    </div>
  );
}
