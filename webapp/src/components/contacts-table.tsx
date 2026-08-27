"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Contact } from "@prisma/client";

import { addContact, deleteContact, updateContact } from "@/lib/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersonAvatar } from "@/components/person-avatar";

export type ContactWithProject = Contact & { project: { id: string; title: string } | null };
export type ProjectOption = { id: string; title: string };

function ContactRow({ contact, projectOptions }: { contact: ContactWithProject; projectOptions: ProjectOption[] }) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={6}>
          <form
            action={async (formData) => {
              await updateContact(contact.id, formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <Input name="name" defaultValue={contact.name} placeholder="Nombre" className="w-40" />
            <Input name="role" defaultValue={contact.role} placeholder="Rol / institución" className="w-48" />
            <Input name="email" defaultValue={contact.email ?? ""} placeholder="Correo" className="w-48" />
            <Input name="phone" defaultValue={contact.phone ?? ""} placeholder="Teléfono" className="w-36" />
            <Input
              name="photoUrl"
              defaultValue={contact.photoUrl ?? ""}
              placeholder="Foto: archivo en /avatares/ o URL"
              className="w-56"
            />
            <Select name="projectId" defaultValue={contact.projectId ?? ""} className="w-52">
              <option value="">Sin proyecto vinculado</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
            <Input name="notes" defaultValue={contact.notes ?? ""} placeholder="Notas" className="w-56" />
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
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <PersonAvatar name={contact.name} photoUrl={contact.photoUrl} />
          <span>{contact.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{contact.role}</TableCell>
      <TableCell className="text-muted-foreground">
        {contact.email && <div>{contact.email}</div>}
        {contact.phone && <div>{contact.phone}</div>}
        {!contact.email && !contact.phone && "—"}
      </TableCell>
      <TableCell>
        {contact.project ? (
          <Link href={`/proyectos/${contact.project.id}`} className="text-primary hover:underline">
            {contact.project.title}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-xs text-muted-foreground">{contact.notes ?? "—"}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Editar contacto">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => startTransition(() => deleteContact(contact.id))}
            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Eliminar contacto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ContactsTable({
  contacts,
  projectOptions,
}: {
  contacts: ContactWithProject[];
  projectOptions: ProjectOption[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-3.5 w-3.5" />
          Agregar contacto
        </Button>
      </div>

      {showForm && (
        <form
          action={async (formData) => {
            await addContact(formData);
            (document.getElementById("contact-add-form") as HTMLFormElement | null)?.reset();
          }}
          id="contact-add-form"
          className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
        >
          <Input name="name" placeholder="Nombre" required className="w-40" />
          <Input name="role" placeholder="Rol / institución" required className="w-48" />
          <Input name="email" placeholder="Correo" className="w-48" />
          <Input name="phone" placeholder="Teléfono" className="w-36" />
          <Input name="photoUrl" placeholder="Foto: archivo en /avatares/ o URL" className="w-56" />
          <Select name="projectId" defaultValue="" className="w-52">
            <option value="">Sin proyecto vinculado</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
          <Input name="notes" placeholder="Notas" className="w-56" />
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Rol / institución</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Proyecto vinculado</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} projectOptions={projectOptions} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
