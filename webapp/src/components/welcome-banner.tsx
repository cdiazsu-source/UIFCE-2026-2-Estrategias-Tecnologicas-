"use client";

import { useEffect, useState } from "react";
import { CalendarClock, FolderKanban, Siren, X } from "lucide-react";

import { initials, resolvePhoto } from "@/components/person-avatar";
import { formatDate } from "@/lib/utils";

export type WelcomeData = {
  /** Clave del perfil («junior-artes» / «junior-et»): separa el «ya lo cerré» de cada uno. */
  profileKey: string;
  /** Nombre de pila para el saludo (p. ej. «María Fernanda»). */
  firstName: string;
  /** Nombre completo y foto de la persona (campo «Foto» de Equipo); sin foto se muestran sus iniciales. */
  fullName: string;
  photoUrl: string | null;
  /** Cargo en el equipo (p. ej. «Junior — Artes»). */
  roleLabel: string;
  /** Proyectos abiertos asignados a la persona (responsable o con subtareas) y cuántos están en Atención Inmediata. */
  mineCount: number;
  urgentCount: number;
  /** Sus proyectos de estudio, con el próximo corte pendiente de cada uno. */
  study: { title: string; next: { label: string; due: string | null } | null }[];
};

const STORAGE_PREFIX = "et:bienvenida:";

/** Saludo según la hora de Colombia. */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("es-CO", { hour: "numeric", hour12: false, timeZone: "America/Bogota" }).format(new Date()),
  );
  if (hour < 12) return "¡Buenos días";
  if (hour < 19) return "¡Buenas tardes";
  return "¡Buenas noches";
}

/** Letrero inicial para los perfiles Junior: saludo con su nombre y un resumen de lo suyo.
 *  Aparece al entrar (una vez por sesión del navegador); se cierra con la X y vuelve a
 *  aparecer en el siguiente ingreso. A la izquierda va la foto del Junior (o sus iniciales). */
export function WelcomeBanner({ data }: { data: WelcomeData }) {
  const [visible, setVisible] = useState(false);
  const [hello, setHello] = useState("¡Hola");
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(STORAGE_PREFIX + data.profileKey) === "1";
    } catch {
      // Sin almacenamiento (modo privado): se muestra siempre.
    }
    setHello(greeting());
    setVisible(!dismissed);
  }, [data.profileKey]);

  function close() {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_PREFIX + data.profileKey, "1");
    } catch {
      // Sin almacenamiento: solo se cierra en esta visita.
    }
  }

  if (!visible) return null;

  const photo = !photoFailed && data.photoUrl && data.photoUrl.trim().length > 0 ? data.photoUrl.trim() : null;
  const nextCut = data.study.find((s) => s.next)?.next ?? null;

  return (
    <section
      aria-label="Bienvenida"
      className="relative flex flex-wrap items-center gap-5 rounded-xl bg-primary p-5 text-primary-foreground shadow-card sm:flex-nowrap sm:p-6"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvePhoto(photo)}
          alt={data.fullName}
          onError={() => setPhotoFailed(true)}
          className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/40"
        />
      ) : (
        <span
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl font-bold ring-2 ring-white/25"
          aria-hidden
        >
          {initials(data.fullName)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/70">{data.roleLabel}</p>
        <h2 className="mt-0.5 text-2xl font-bold leading-tight tracking-tight sm:text-[1.7rem]">
          {hello}, {data.firstName}!
        </h2>
        <p className="mt-1 text-sm text-primary-foreground/85">
          {data.mineCount > 0
            ? "Estos son los proyectos que tienes asignados; los encuentras primero en la lista."
            : "Por ahora no tienes proyectos asignados; cuando te asignen uno aparecerá primero en la lista."}
        </p>

        <ul className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
            <FolderKanban className="h-3.5 w-3.5" aria-hidden />
            {data.mineCount} {data.mineCount === 1 ? "proyecto asignado" : "proyectos asignados"}
          </li>
          {data.urgentCount > 0 && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-2.5 py-1 font-semibold text-brand-accent-foreground">
              <Siren className="h-3.5 w-3.5" aria-hidden />
              {data.urgentCount} en Atención Inmediata
            </li>
          )}
          {nextCut && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              Próximo corte: {nextCut.label}
              {nextCut.due ? ` · ${formatDate(nextCut.due)}` : ""}
            </li>
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Cerrar el saludo"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-md text-primary-foreground/80 outline-none transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-brand-accent"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </section>
  );
}
