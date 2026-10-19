"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Circle, Clock, ExternalLink, GraduationCap, Linkedin, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import {
  addCompanyLead,
  addTargetCompany,
  deleteCompanyLead,
  deleteTargetCompany,
  markCompanyLeadChecked,
  setCompanyLeadStatus,
  updateCompanyLead,
  updateTargetCompany,
} from "@/lib/actions/target-companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { InfoHint } from "@/components/info-hint";
import { initials } from "@/components/person-avatar";
import { useCanEdit } from "@/components/access-context";
import {
  LEAD_KIND_LABEL,
  LEAD_KIND_ORDER,
  LEAD_KINDS,
  LEAD_STATUSES,
  LEADS_PER_COMPANY_GOAL,
  leadsGoal,
  linkedinCompanySearchUrl,
  linkedinSearchUrl,
  resolveLogo,
  type LeadKind,
  ALUMNI_BADGE,
  companyCoverage,
  GOAL_SLOTS,
  isAlumni,
  LEAD_ALUMNI,
  linkedinAlumniSearchUrl,
} from "@/lib/company-leads";
import { cn, formatDateTime } from "@/lib/utils";

export type CompanyLeadData = {
  id: string;
  name: string;
  role: string;
  kind: string;
  status: string;
  /** NONE, UNAL o FCE: egresado de la Universidad Nacional o de su Facultad de Ciencias Económicas. */
  alumni: string;
  linkedinUrl: string | null;
  /** Formación (del perfil público): pregrado y especialización(es). */
  undergrad: string | null;
  postgrad: string[];
  notes: string | null;
  lastCheckedAt: string | null;
};

export type TargetCompanyData = {
  id: string;
  name: string;
  sector: string | null;
  logoUrl: string | null;
  /** Página oficial de la empresa en LinkedIn (Colombia). */
  linkedinUrl: string | null;
  tags: string[];
  notes: string | null;
  leads: CompanyLeadData[];
};

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "outline"> = {
  POR_CONTACTAR: "secondary",
  CONEXION_ENVIADA: "warning",
  CONECTADO: "success",
  EN_CONVERSACION: "success",
  SIN_RESPUESTA: "outline",
};

/** Logo de la empresa (archivo en /public/logos/ o URL); si no hay o no carga, sus iniciales. */
function CompanyLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl && logoUrl.trim() && !failed ? resolveLogo(logoUrl.trim()) : null;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`Logo de ${name}`}
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-md border border-border bg-white object-contain p-1"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary"
    >
      {initials(name)}
    </span>
  );
}

/** Insignia de egresado: FCE con el amarillo de acento (la más cercana a la Unidad) y UNAL en azul suave. */
function AlumniBadge({ alumni }: { alumni: string }) {
  if (!isAlumni(alumni)) return null;
  const fce = alumni === "FCE";
  return (
    <span
      title={fce ? "Egresado de la Facultad de Ciencias Económicas (UNAL)" : "Egresado de la Universidad Nacional de Colombia"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        fce ? "bg-brand-accent text-brand-accent-foreground" : "border border-primary/30 bg-primary/10 text-primary",
      )}
    >
      <GraduationCap className="h-3 w-3" aria-hidden />
      {ALUMNI_BADGE[alumni]}
    </span>
  );
}

/** Orden dentro de cada tipo: primero los egresados de la FCE, luego los de la UNAL y después el resto. */
const alumniRank = (alumni: string) => (alumni === "FCE" ? 0 : alumni === "UNAL" ? 1 : 2);

/** Campos del formulario de contacto (alta y edición). El cargo es opcional: si se deja vacío, se usa el tipo. */
function LeadFields({ lead, defaultKind = "RECLUTADOR" }: { lead?: CompanyLeadData; defaultKind?: LeadKind }) {
  return (
    <>
      <Input name="name" defaultValue={lead?.name} placeholder="Nombre" required className="w-44" aria-label="Nombre" />
      <Select name="kind" defaultValue={lead?.kind ?? defaultKind} className="w-44" aria-label="Tipo de contacto">
        {LEAD_KINDS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.label}
          </option>
        ))}
      </Select>
      <Input name="role" defaultValue={lead?.role} placeholder="Cargo (ej. Gerente de Talento)" className="w-52" aria-label="Cargo" />
      <Input
        name="linkedinUrl"
        type="url"
        defaultValue={lead?.linkedinUrl ?? ""}
        placeholder="URL del perfil de LinkedIn"
        className="w-60"
        aria-label="URL de LinkedIn"
      />
      <Input
        name="undergrad"
        defaultValue={lead?.undergrad ?? ""}
        placeholder="Pregrado (ej. Economía)"
        className="w-52"
        aria-label="Pregrado"
      />
      <Input
        name="postgrad"
        defaultValue={lead?.postgrad.join("; ") ?? ""}
        placeholder="Especialización(es), separadas por ;"
        className="w-64"
        aria-label="Especialización o especializaciones"
      />
      <Select name="alumni" defaultValue={lead?.alumni ?? "NONE"} className="w-52" aria-label="Egresado de la Universidad Nacional">
        {LEAD_ALUMNI.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </Select>
      <Select name="status" defaultValue={lead?.status ?? "POR_CONTACTAR"} className="w-44" aria-label="Avance del contacto">
        {LEAD_STATUSES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
      <Input name="notes" defaultValue={lead?.notes ?? ""} placeholder="Notas" className="w-48" aria-label="Notas" />
    </>
  );
}

function LeadRow({ lead }: { lead: CompanyLeadData }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(lead.status);
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
        <LeadFields lead={lead} />
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
        <p className="flex flex-wrap items-center gap-1.5 font-medium">
          {lead.linkedinUrl ? (
            <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-link hover:underline">
              {lead.name}
            </a>
          ) : (
            <span>{lead.name}</span>
          )}
          {lead.linkedinUrl && <Linkedin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />}
          <Badge variant="outline">{LEAD_KIND_LABEL[lead.kind] ?? lead.kind}</Badge>
          <AlumniBadge alumni={lead.alumni} />
        </p>
        <p className="text-xs text-muted-foreground">
          {lead.role}
          {lead.notes ? ` · ${lead.notes}` : ""}
        </p>
        {(lead.undergrad || lead.postgrad.length > 0) && (
          <p className="mt-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {lead.undergrad && (
                <>
                  <span className="font-medium text-foreground">Pregrado:</span> {lead.undergrad}
                </>
              )}
              {lead.undergrad && lead.postgrad.length > 0 && " · "}
              {lead.postgrad.length > 0 && (
                <>
                  <span className="font-medium text-foreground">
                    {lead.postgrad.length === 1 ? "Especialización:" : "Especializaciones:"}
                  </span>{" "}
                  {lead.postgrad.join("; ")}
                </>
              )}
            </span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canEdit ? (
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              startTransition(() => setCompanyLeadStatus(lead.id, e.target.value));
            }}
            aria-label={`Avance del contacto ${lead.name}`}
            className="h-8 w-40 text-xs"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        ) : (
          <Badge variant={STATUS_VARIANT[lead.status] ?? "secondary"}>
            {LEAD_STATUSES.find((s) => s.id === lead.status)?.label ?? lead.status}
          </Badge>
        )}
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

/** Campos del formulario de empresa (alta y edición). */
function CompanyFields({ company }: { company?: TargetCompanyData }) {
  return (
    <>
      <Input name="name" defaultValue={company?.name} placeholder="Nombre de la empresa" required className="w-48" aria-label="Empresa" />
      <Input name="sector" defaultValue={company?.sector ?? ""} placeholder="Sector" className="w-52" aria-label="Sector" />
      <Input
        name="logoUrl"
        defaultValue={company?.logoUrl ?? ""}
        placeholder="Logo (archivo en /logos o URL)"
        className="w-56"
        aria-label="Logo"
      />
      <Input
        name="linkedinUrl"
        type="url"
        defaultValue={company?.linkedinUrl ?? ""}
        placeholder="LinkedIn oficial de la empresa en Colombia (URL)"
        className="w-72"
        aria-label="LinkedIn oficial de la empresa"
      />
      <Input
        name="tags"
        defaultValue={company?.tags.join(", ") ?? ""}
        placeholder="Etiquetas, separadas por coma"
        className="w-56"
        aria-label="Etiquetas"
      />
      <Input name="notes" defaultValue={company?.notes ?? ""} placeholder="Notas" className="w-64" aria-label="Notas" />
    </>
  );
}

function CompanyCard({ company }: { company: TargetCompanyData }) {
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(company.leads.length > 0);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [, startTransition] = useTransition();

  const leads = useMemo(
    () =>
      [...company.leads].sort(
        (a, b) =>
          LEAD_KIND_ORDER.indexOf(a.kind) - LEAD_KIND_ORDER.indexOf(b.kind) ||
          alumniRank(a.alumni) - alumniRank(b.alumni) ||
          a.name.localeCompare(b.name, "es"),
      ),
    [company.leads],
  );
  const pending = company.leads.filter((l) => l.status === "POR_CONTACTAR").length;
  const alumniCount = company.leads.filter((l) => isAlumni(l.alumni)).length;
  const coverage = companyCoverage(company.leads.map((l) => l.kind));

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
          <CompanyFields company={company} />
          <Button type="submit" size="sm">
            Guardar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCompany(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <div className="flex items-start gap-3">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight">{company.name}</h3>
            {company.sector && <p className="text-xs text-muted-foreground">{company.sector}</p>}
            {company.tags.length > 0 && (
              <p className="mt-1 flex flex-wrap gap-1">
                {company.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </p>
            )}
            {company.linkedinUrl ? (
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`LinkedIn oficial de ${company.name} en Colombia (se abre en otra pestaña)`}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-link hover:underline"
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden />
                LinkedIn de la empresa
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
              </a>
            ) : canEdit ? (
              <a
                href={linkedinCompanySearchUrl(company.name)}
                target="_blank"
                rel="noopener noreferrer"
                title="Abre la búsqueda en LinkedIn; luego pega el enlace con el lápiz de la empresa"
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-link hover:underline"
              >
                <Search className="h-3 w-3" aria-hidden />
                Buscar su página oficial en LinkedIn
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
              </a>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canEdit && (
              <>
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
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? `Ocultar los contactos de ${company.name}` : `Ver los contactos de ${company.name}`}
              className="press flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-150", !open && "-rotate-90")} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">
          {company.leads.length === 0
            ? "Sin contactos todavía"
            : `${company.leads.length} ${company.leads.length === 1 ? "contacto" : "contactos"}${pending > 0 ? ` · ${pending} por contactar` : ""}${alumniCount > 0 ? ` · ${alumniCount} ${alumniCount === 1 ? "egresado" : "egresados"} UNAL/FCE` : ""}`}
          {" · "}
          <span className={coverage.complete ? "font-medium text-success" : undefined}>
            {coverage.complete ? "meta cumplida" : `meta ${coverage.done}/${LEADS_PER_COMPANY_GOAL}`}
          </span>
        </p>
        <ul aria-label={`Meta de contactos de ${company.name}`} className="flex flex-wrap gap-1">
          {GOAL_SLOTS.map((slot) => {
            const ok = coverage.covered[slot.id];
            return (
              <li
                key={slot.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  ok ? "border-success/40 bg-success/10 text-foreground" : "border-dashed border-input text-muted-foreground",
                )}
              >
                {ok ? <Check className="h-3 w-3 text-success" aria-hidden /> : <Circle className="h-3 w-3" aria-hidden />}
                {slot.label}
                <span className="sr-only">{ok ? " (cubierto)" : " (falta)"}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {open && (
        <>
          {company.notes && <p className="text-xs leading-relaxed text-muted-foreground">{company.notes}</p>}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Buscar en LinkedIn:</span>
            {LEAD_KINDS.filter((k) => k.id !== "OTRO").map((k) => (
              <a
                key={k.id}
                href={linkedinSearchUrl(company.name, k.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-link hover:bg-accent"
              >
                <Search className="h-3 w-3" aria-hidden />
                {k.search}
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
              </a>
            ))}
            {(["UNAL", "FCE"] as const).map((a) => (
              <a
                key={a}
                href={linkedinAlumniSearchUrl(company.name, a)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-link hover:bg-accent"
              >
                <GraduationCap className="h-3 w-3" aria-hidden />
                Egresados {a}
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden />
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {leads.length === 0 && <p className="text-xs text-muted-foreground">Aún no hay perfiles registrados.</p>}
            {leads.map((lead) => (
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
                <LeadFields />
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
        </>
      )}
    </div>
  );
}

export function CompanyLeadsSection({ companies }: { companies: TargetCompanyData[] }) {
  const canEdit = useCanEdit();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [onlyAlumni, setOnlyAlumni] = useState(false);

  const tags = useMemo(() => Array.from(new Set(companies.flatMap((c) => c.tags))).sort((a, b) => a.localeCompare(b, "es")), [companies]);
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const nq = norm(q.trim());
  const filtered = companies.filter(
    (c) =>
      (!tag || c.tags.includes(tag)) &&
      (!onlyAlumni || c.leads.some((l) => isAlumni(l.alumni))) &&
      (!nq || [c.name, c.sector ?? "", c.notes ?? "", ...c.tags].some((f) => norm(f).includes(nq))),
  );
  const totalLeads = companies.reduce((n, c) => n + c.leads.length, 0);
  const toContact = companies.reduce((n, c) => n + c.leads.filter((l) => l.status === "POR_CONTACTAR").length, 0);
  const goal = leadsGoal(companies.map((c) => c.leads.map((l) => l.kind)));
  const alumniTotal = companies.reduce((n, c) => n + c.leads.filter((l) => isAlumni(l.alumni)).length, 0);

  return (
    <div id="empresas-interes" className="flex scroll-mt-20 flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-1.5 text-lg font-bold">
          Empresas de interés
          <InfoHint text="Empresas donde le interesaría trabajar al equipo y las personas que se les siguen en LinkedIn: reclutadores, gerentes, recursos humanos y otros contactos. Cómo se usa: abre una empresa, usa «Buscar en LinkedIn» para encontrar perfiles de cada tipo, y con perfil completo «Agregar contacto» con su nombre, tipo, cargo y enlace; cambia su avance (por contactar, conexión enviada, conectado, en conversación, sin respuesta) y usa «Marcar revisado hoy» para dejar constancia de cuándo se volvió a mirar. La meta de cada empresa son 4 casillas: un reclutador, un gerente o directivo, una persona de recursos humanos y un contacto libre (cuatro reclutadores no cubren las demás). Marca a los egresados de la UNAL o de la FCE: suelen ser los más fáciles de abordar, y «Egresados UNAL / FCE» abre su búsqueda en LinkedIn. El logo es un archivo en public/logos o una URL." />
        </h2>
        <p className="text-sm text-muted-foreground">
          {companies.length} {companies.length === 1 ? "empresa" : "empresas"} · {totalLeads}{" "}
          {totalLeads === 1 ? "contacto" : "contactos"}
          {toContact > 0 ? ` · ${toContact} por contactar` : ""}
          {alumniTotal > 0 ? ` · ${alumniTotal} ${alumniTotal === 1 ? "egresado" : "egresados"} UNAL/FCE` : ""}
        </p>
      </div>

      {companies.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">Meta por empresa: 1 reclutador, 1 gerente, 1 de recursos humanos y 1 contacto libre</span>
            <span className="tabular-nums text-muted-foreground">
              {goal.have} de {goal.total} casillas · {goal.percent}%
            </span>
          </div>
          <Progress value={goal.percent} className="mt-2 h-2.5" aria-label="Avance total frente a la meta de contactos" />
          <p className="mt-1 text-xs text-muted-foreground">
            {goal.companiesDone} de {goal.companies} empresas con la meta cumplida.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[13rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar empresa o sector…"
            className="pl-8"
            aria-label="Buscar empresa"
          />
        </div>
        {tags.length > 0 && (
          <Select value={tag} onChange={(e) => setTag(e.target.value)} className="w-56" aria-label="Filtrar por etiqueta">
            <option value="">Todas las etiquetas</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        )}
        <button
          type="button"
          onClick={() => setOnlyAlumni((v) => !v)}
          aria-pressed={onlyAlumni}
          title="Muestra solo las empresas donde hay al menos un egresado de la UNAL o de la FCE"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
            onlyAlumni ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-muted-foreground hover:bg-accent",
          )}
        >
          <GraduationCap className="h-3.5 w-3.5" aria-hidden />
          Con egresados UNAL/FCE
        </button>
        {(q || tag || onlyAlumni) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setTag("");
              setOnlyAlumni(false);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
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
            <CompanyFields />
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
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Ninguna empresa coincide con la búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
