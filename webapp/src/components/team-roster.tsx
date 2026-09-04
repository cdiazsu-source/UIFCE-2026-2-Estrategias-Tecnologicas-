"use client";

import { useState } from "react";
import { Linkedin, Pencil } from "lucide-react";

import { updateUserLinkedin } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PersonAvatar } from "@/components/person-avatar";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";
import { USER_ROLE_LABEL } from "@/lib/utils";

export type RosterMember = {
  id: string;
  name: string;
  role: string;
  photoUrl: string | null;
  linkedinUrl: string | null;
};

function MemberCard({ member }: { member: RosterMember }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  const roleLabel = USER_ROLE_LABEL[member.role] ?? member.role;

  if (editing) {
    return (
      <li className="rounded-md border border-border p-3">
        <p className="mb-1.5 text-sm font-medium">{member.name}</p>
        <form
          action={async (formData) => {
            await updateUserLinkedin(member.id, formData);
            setEditing(false);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <Input
            name="linkedinUrl"
            type="url"
            defaultValue={member.linkedinUrl ?? ""}
            placeholder="https://www.linkedin.com/in/…"
            className="h-8 min-w-[14rem] flex-1 text-sm"
          />
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
    <li className="group relative">
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
      {canEdit && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
          aria-label={`Editar LinkedIn de ${member.name}`}
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
        <InfoHint text="El equipo de ET que ejecuta los proyectos (máster y monitores). Cómo se usa: clic en una persona abre su LinkedIn; con perfil completo, el lápiz permite pegar o cambiar ese enlace. Ejemplo: «Cesar Diaz · Máster · linkedin.com/in/…»." />
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {people.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </ul>
    </div>
  );
}
