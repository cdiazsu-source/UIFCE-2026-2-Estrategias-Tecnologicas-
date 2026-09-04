"use client";

import { useState, useTransition } from "react";
import { Linkedin, Pencil, Plus, Trash2 } from "lucide-react";
import type { User, UserRole } from "@prisma/client";

import { addUser, deleteUser, updateUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersonAvatar } from "@/components/person-avatar";
import { PhotoField } from "@/components/photo-field";
import { USER_ROLE_LABEL, formatDateTime } from "@/lib/utils";
import { useCanEdit } from "@/components/access-context";

const ROLE_OPTIONS: UserRole[] = ["MASTER", "JUNIOR_ARTES", "JUNIOR_AUXILIAR", "COORDINADOR", "DIRECTOR", "EQUIPO"];

function RoleSelect({ name, defaultValue }: { name: string; defaultValue?: UserRole }) {
  return (
    <Select name={name} defaultValue={defaultValue ?? "JUNIOR_AUXILIAR"} className="w-44">
      {ROLE_OPTIONS.map((r) => (
        <option key={r} value={r}>
          {USER_ROLE_LABEL[r]}
        </option>
      ))}
    </Select>
  );
}

function UserRow({ user }: { user: User }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <form
            action={async (formData) => {
              await updateUser(user.id, formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <Input name="name" defaultValue={user.name} placeholder="Nombre" className="w-40" />
            <Input name="email" type="email" defaultValue={user.email} placeholder="Correo" className="w-56" />
            <RoleSelect name="role" defaultValue={user.role} />
            <Input name="area" defaultValue={user.area ?? ""} placeholder="Área (ej. ET)" className="w-28" />
            <div className="w-full sm:w-72">
              <PhotoField name="photoUrl" defaultValue={user.photoUrl} personName={user.name} />
            </div>
            <Input
              name="linkedinUrl"
              type="url"
              defaultValue={user.linkedinUrl ?? ""}
              placeholder="LinkedIn (URL)"
              className="w-56"
            />
            <Select name="active" defaultValue={String(user.active)} className="w-32">
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
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={user.active ? undefined : "opacity-55"}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={user.name} photoUrl={user.photoUrl} />
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5">
              {user.name}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:text-primary/80"
                  aria-label={`LinkedIn de ${user.name}`}
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </a>
              )}
            </span>
            {user.credentialKey && (
              <span className="text-xs font-normal text-muted-foreground">
                Acceso propio · última visita:{" "}
                {user.lastSeenAt ? formatDateTime(user.lastSeenAt) : "sin registro"}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <a href={`mailto:${user.email}`} className="hover:text-primary hover:underline">
          {user.email}
        </a>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{USER_ROLE_LABEL[user.role]}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{user.area ?? "—"}</TableCell>
      <TableCell>
        {user.active ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="secondary">Inactivo</Badge>
        )}
      </TableCell>
      <TableCell>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar persona"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => deleteUser(user.id))}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar persona"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function UsersTable({ users }: { users: User[] }) {
  const canEdit = useCanEdit();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar persona
          </Button>
        </div>
      )}

      {canEdit && showForm && (
        <form
          action={async (formData) => {
            await addUser(formData);
            (document.getElementById("user-add-form") as HTMLFormElement | null)?.reset();
          }}
          id="user-add-form"
          className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
        >
          <Input name="name" placeholder="Nombre" required className="w-40" />
          <Input name="email" type="email" placeholder="Correo" required className="w-56" />
          <RoleSelect name="role" />
          <Input name="area" placeholder="Área (ej. ET)" defaultValue="ET" className="w-28" />
          <div className="w-full sm:w-72">
            <PhotoField name="photoUrl" />
          </div>
          <Input name="linkedinUrl" type="url" placeholder="LinkedIn (URL)" className="w-56" />
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
