"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Linkedin, Pencil, Plus, Trash2 } from "lucide-react";

import {
  addCompanyLead,
  addTargetCompany,
  deleteCompanyLead,
  deleteTargetCompany,
  markCompanyLeadChecked,
  updateCompanyLead,
  updateTargetCompany,
} from "@/lib/actions/target-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";
import { formatDateTime } from "@/lib/utils";

export type CompanyLeadData = {
  id: string;
  name: string;
  role: string;
  linkedinUrl: string | null;
  notes: string | null;
  lastCheckedAt: string | null;
};

export type TargetCompanyData = {
  id: string;
  name: string;
  notes: string | null;
  leads: CompanyLeadData[];
};

function LeadRow({ lead }: { lead: CompanyLeadData }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateCompanyLead(lead.id, formData);
          setEditing(false);
        }}
        className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-2"
      >
        <Input name="name" defaultValue={lead.name} placeholder="Nombre" className="w-40" />
        <Input name="role" defaultValue={lead.role} placeholder="Cargo (ejecutivo, reclutador…)" className="w-48" />
        <Input
          name="linkedinUrl"
          type="url"
          defaultValue={lead.linkedinUrl ?? ""}
          placeholder="URL de LinkedIn"
          className="w-56"
        />
        <Input name="notes" defaultValue={lead.notes ?? ""} placeholder="Notas" className="w-48" />
        <Button type="submit" size="sm">
          Guardar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-medium">
          {lead.linkedinUrl ? (
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary hover:underline"
            >
              {lead.name}
            </a>
          ) : (
            <span>{lead.name}</span>
          )}
          {lead.linkedinUrl && <Linkedin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
        </p>
        <p className="text-xs text-muted-foreground">
          {lead.role}
          {lead.notes ? ` · ${lead.notes}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden />
          {lead.lastCheckedAt ? `Revisado: ${formatDateTime(lead.lastCheckedAt)}` : "Sin revisar aún"}
        </span>
        {canEdit && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => startTransition(() => markCompanyLeadChecked(lead.id))}
            >
              <Check className="h-3.5 w-3.5" />
              Marcar revisado hoy
            </Button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar contacto"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => deleteCompanyLead(lead.id))}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar contacto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: TargetCompanyData }) {
  const canEdit = useCanEdit();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      {editingCompany ? (
        <form
          action={async (formData) => {
            await updateTargetCompany(company.id, formData);
            setEditingCompany(false);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <Input name="name" defaultValue={company.name} placeholder="Empresa" className="w-48" />
          <Input name="notes" defaultValue={company.notes ?? ""} placeholder="Notas" className="w-56" />
          <Button type="submit" size="sm">
            Guardar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCompany(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold">{company.name}</h3>
            {company.notes && <p className="text-xs text-muted-foreground">{company.notes}</p>}
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setEditingCompany(true)}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                aria-label="Editar empresa"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => deleteTargetCompany(company.id))}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar empresa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {company.leads.length === 0 && (
          <p className="text-xs text-muted-foreground">Aún no hay perfiles registrados.</p>
        )}
        {company.leads.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}
      </div>

      {canEdit &&
        (showLeadForm ? (
          <form
            action={async (formData) => {
              await addCompanyLead(company.id, formData);
              setShowLeadForm(false);
            }}
            className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-2"
          >
            <Input name="name" placeholder="Nombre" required className="w-40" />
            <Input name="role" placeholder="Cargo (ejecutivo, reclutador…)" required className="w-48" />
            <Input name="linkedinUrl" type="url" placeholder="URL de LinkedIn" className="w-56" />
            <Input name="notes" placeholder="Notas" className="w-48" />
            <Button type="submit" size="sm">
              Agregar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowLeadForm(false)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setShowLeadForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar contacto
          </Button>
        ))}
    </div>
  );
}

export function CompanyLeadsSection({ companies }: { companies: TargetCompanyData[] }) {
  const canEdit = useCanEdit();
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-1.5 text-lg font-bold">
          Empresas de interés
          <InfoHint text="Perfiles de LinkedIn de personas vinculadas a empresas donde le interesaría trabajar al equipo (ejecutivos, reclutadores, referidos…), agrupados por empresa. «Marcar revisado hoy» deja constancia de cuándo se volvió a mirar ese perfil, para no perder de vista los que llevan tiempo sin revisión." />
        </h2>
        <p className="text-sm text-muted-foreground">
          Ej. Mastercard: sus ejecutivos, reclutadores y otros perfiles de interés, con la fecha de la última revisión.
        </p>
      </div>

      {canEdit &&
        (showCompanyForm ? (
          <form
            action={async (formData) => {
              await addTargetCompany(formData);
              setShowCompanyForm(false);
            }}
            className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
          >
            <Input name="name" placeholder="Nombre de la empresa" required className="w-48" />
            <Input name="notes" placeholder="Notas" className="w-56" />
            <Button type="submit" size="sm">
              Agregar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowCompanyForm(false)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <Button size="sm" variant="outline" className="self-start" onClick={() => setShowCompanyForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar empresa
          </Button>
        ))}

      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay empresas registradas.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
