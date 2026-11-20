"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Building2, ExternalLink, FileText, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { addContact, deleteContact, updateContact } from "@/lib/actions/contacts";
import { CONMUTADOR, DEPENDENCY_EXTENSIONS, DEPENDENCY_FULL_NAME, DEPENDENCY_PRESETS, DEPENDENCY_SUGGESTIONS, ORGANIGRAMA_FILE, ORGANIGRAMA_URL, groupByDependency, normText, type DependencyGroup } from "@/lib/ally-dependencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersonAvatar } from "@/components/person-avatar";
import { InfoHint } from "@/components/info-hint";
import { CollapseAllControls, CollapseToggle, useCollapse } from "@/components/collapsible";
import { useCanEdit } from "@/components/access-context";

export type ContactItem = {
  id: string;
  name: string;
  role: string;
  dependency: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  projectId: string | null;
  notes: string | null;
  project: { id: string; title: string } | null;
};
export type ProjectOption = { id: string; title: string };

const LIST_ID = "dependency-options";

/** Campos compartidos por el alta y la edición. */
function ContactFields({ contact, projectOptions, defaultDependency }: { contact?: ContactItem; projectOptions: ProjectOption[]; defaultDependency?: string }) {
  return (
    <>
      <Input name="name" defaultValue={contact?.name} placeholder="Nombre" required className="w-40" />
      <Input name="dependency" defaultValue={contact?.dependency ?? defaultDependency ?? ""} list={LIST_ID} placeholder="Dependencia (ORI, CIID…)" className="w-44" aria-label="Dependencia" />
      <Input name="role" defaultValue={contact?.role} placeholder="Cargo / rol" required className="w-44" />
      <Input name="email" defaultValue={contact?.email ?? ""} placeholder="Correo" className="w-48" />
      <Input name="phone" defaultValue={contact?.phone ?? ""} placeholder="Teléfono" className="w-36" />
      <Input name="photoUrl" defaultValue={contact?.photoUrl ?? ""} placeholder="Foto: archivo en /avatares/ o URL" className="w-56" />
      <Select name="projectId" defaultValue={contact?.projectId ?? ""} className="w-52">
        <option value="">Sin proyecto vinculado</option>
        {projectOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </Select>
      <Input name="notes" defaultValue={contact?.notes ?? ""} placeholder="Notas" className="w-56" />
    </>
  );
}

function ContactRow({ contact, projectOptions }: { contact: ContactItem; projectOptions: ProjectOption[] }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <form
            action={async (formData) => {
              await updateContact(contact.id, formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <ContactFields contact={contact} projectOptions={projectOptions} />
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
          <Link href={`/proyectos/${contact.project.id}`} className="text-link hover:underline">
            {contact.project.title}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {contact.notes && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{contact.notes}</p>}
      </TableCell>
      <TableCell>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Editar aliado">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Eliminar a «${contact.name}» de los aliados?`)) startTransition(() => deleteContact(contact.id));
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar aliado"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

/** Una dependencia: se contrae con su flecha. Contraída por defecto; con una búsqueda activa se abre sola. */
function GroupBlock({
  group,
  projectOptions,
  forceOpen,
  onAdd,
}: {
  group: DependencyGroup<ContactItem>;
  projectOptions: ProjectOption[];
  forceOpen: boolean;
  onAdd: (dependency: string) => void;
}) {
  const canEdit = useCanEdit();
  const { open, toggle } = useCollapse(`aliados:dep:${group.name}`, false);
  const shown = open || forceOpen;
  const n = group.items.length;
  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <CollapseToggle open={shown} onToggle={toggle} label={group.name} />
        <h3 className="text-sm font-semibold">{group.name}</h3>
        {DEPENDENCY_FULL_NAME[group.name] && <span className="hidden truncate text-xs text-muted-foreground sm:inline">{DEPENDENCY_FULL_NAME[group.name]}</span>}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{n}</span>
        {canEdit && (
          <button
            type="button"
            onClick={() => onAdd(group.name)}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            title={`Agregar un aliado de ${group.name}`}
          >
            <Plus className="h-3 w-3" aria-hidden />
            Agregar
          </button>
        )}
      </div>
      {shown && (
        <div className="border-t border-border px-3 py-2">
          {DEPENDENCY_EXTENSIONS[group.name] && (
            <p className="pb-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Extensiones</span> (conmutador {CONMUTADOR}):{" "}
              {DEPENDENCY_EXTENSIONS[group.name].map((e, i) => (
                <span key={e.label}>
                  {i > 0 && " · "}
                  {e.label} <span className="tabular-nums text-foreground">{e.ext}</span>
                </span>
              ))}
            </p>
          )}
          {n === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Aún no hay aliados de esta dependencia.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo / rol</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Proyecto vinculado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((c) => (
                  <ContactRow key={c.id} contact={c} projectOptions={projectOptions} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

export function AllyDependenciesSection({ contacts, projectOptions }: { contacts: ContactItem[]; projectOptions: ProjectOption[] }) {
  const canEdit = useCanEdit();
  const { open, setOpen, toggle } = useCollapse("aliados:dependencias", false);
  const [q, setQ] = useState("");
  // null = formulario cerrado; el texto es la dependencia con la que arranca.
  const [formDep, setFormDep] = useState<string | null>(null);
  useEffect(() => {
    if (window.location.hash === "#aliados-dependencias") setOpen(true);
  }, [setOpen]);

  const nq = normText(q);
  const filtered = nq ? contacts.filter((c) => [c.name, c.role, c.dependency ?? "", c.notes ?? ""].some((f) => normText(f).includes(nq))) : contacts;
  const groups = groupByDependency(filtered).filter((g) => !nq || g.items.length > 0);
  const allGroups = groupByDependency(contacts);
  const depNames = allGroups.map((g) => g.name).filter((n) => n !== "Otros aliados");
  const withPeople = allGroups.filter((g) => g.items.length > 0).length;

  return (
    <div id="aliados-dependencias" className="flex scroll-mt-20 flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-1.5 text-lg font-bold">
          <CollapseToggle open={open} onToggle={toggle} label="aliados dependencias" />
          <Building2 className="h-5 w-5" aria-hidden />
          Aliados dependencias
          <InfoHint text="Oficinas y unidades de la Facultad o la Universidad con las que ET coordina: ORI, CIID, Vicedecanatura, Comunicaciones y las demás. Cómo se usa: abre una dependencia con su flecha para ver a sus aliados; con perfil completo, «Agregar aliado» (o el «Agregar» de la dependencia) y el lápiz de cada fila; puedes vincular cada aliado a un proyecto. Si la dependencia no está en la lista, escríbela en el campo «Dependencia» y aparecerá como un grupo nuevo. Ejemplo: «Sandra Carlos Vargas · Vicedecanatura · proyecto Semana UIFCE»." />
        </h2>
        <p className="text-sm text-muted-foreground">
          Oficinas y unidades de la Facultad y la Universidad que respaldan la gestión de ET: canales institucionales para la difusión, la cooperación y los recursos de nuestros proyectos.
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {contacts.length} {contacts.length === 1 ? "aliado" : "aliados"} en {withPeople} {withPeople === 1 ? "dependencia" : "dependencias"}
        </p>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="font-medium">Organigrama de la Facultad</span>
            <a href={ORGANIGRAMA_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
              Ver en el sitio de la Facultad
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
            </a>
            <a href={ORGANIGRAMA_FILE} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Ver el PDF (Acuerdo 028 de 2023)
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[13rem] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar aliado, cargo o dependencia…" className="pl-8" aria-label="Buscar aliado" />
            </div>
            {q && (
              <button type="button" onClick={() => setQ("")} className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent">
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
            <CollapseAllControls scope="aliados:dep" />
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setFormDep((d) => (d === null ? "" : null))}>
                <Plus className="h-3.5 w-3.5" />
                Agregar aliado
              </Button>
            )}
          </div>

          {canEdit && formDep !== null && (
            <form
              key={formDep}
              action={async (formData) => {
                await addContact(formData);
                setFormDep(null);
              }}
              className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
            >
              <ContactFields projectOptions={projectOptions} defaultDependency={formDep} />
              <Button type="submit" size="sm">
                Agregar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFormDep(null)}>
                Cancelar
              </Button>
            </form>
          )}
          <datalist id={LIST_ID}>
            {Array.from(new Set([...DEPENDENCY_PRESETS, ...depNames, ...DEPENDENCY_SUGGESTIONS])).map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          {groups.length === 0 ? (
            <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">Ningún aliado coincide con la búsqueda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((g) => (
                <GroupBlock key={g.name} group={g} projectOptions={projectOptions} forceOpen={!!nq} onAdd={(d) => setFormDep(d)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
