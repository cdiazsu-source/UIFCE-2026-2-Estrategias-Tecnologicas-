import {
  CalendarClock,
  CalendarDays,
  Presentation,
  Clock,
  GraduationCap,
  Handshake,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  type LucideIcon,
  Megaphone,
  Palette,
  PanelsTopLeft,
  Users,
  Wrench,
} from "lucide-react";

/** Una opción del menú lateral. `badge` NO va aquí: es un dato en vivo que llega por
 *  props (`badges[id]`), así la lista de rutas sigue siendo estática y legible. */
export type SidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Encabezado del grupo en el que se muestra; sin sección = arriba, sin encabezado. */
  section?: string;
  /** Rutas adicionales que también marcan esta opción como activa (por prefijo). */
  alsoActiveFor?: string[];
  /** Solo se muestra a un monitor Junior (su atajo personal). */
  juniorOnly?: boolean;
  /** Se oculta a un monitor Junior. */
  hideForJunior?: boolean;
  /** Solo la ve el máster (sin «Ver como»). */
  masterOnly?: boolean;
};

/** Opciones del menú que corresponden a un perfil: los Junior ven sus atajos y no ven las que se les ocultan. */
export function itemsFor(isJunior: boolean, isMaster = false): SidebarItem[] {
  return SIDEBAR_ITEMS.filter((i) => (isJunior ? !i.hideForJunior : !i.juniorOnly) && (isMaster || !i.masterOnly));
}

/** Rutas del menú lateral, en el orden en que se muestran. Para agregar una opción,
 *  basta con sumarla aquí; el estado activo lo da la ruta actual. */
export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "panel",
    label: "Panel principal",
    icon: LayoutDashboard,
    href: "/",
    // El detalle de un proyecto y los proyectos de estudio cuelgan del panel.
    alsoActiveFor: ["/proyectos"],
  },
  { id: "mi-horario", label: "Mi horario", icon: CalendarClock, href: "/horas?vista=horario", juniorOnly: true },
  { id: "calendario", label: "Calendario", icon: CalendarDays, href: "/calendario", hideForJunior: true },

  { id: "difusion-digital", label: "Difusión digital", icon: Megaphone, href: "/difusion/digital", section: "Difusión y visibilidad", alsoActiveFor: ["/linkedin"] },
  { id: "difusion-fisica", label: "Difusión física", icon: PanelsTopLeft, href: "/difusion/fisica", section: "Difusión y visibilidad" },
  { id: "plantillas", label: "Plantillas", icon: LayoutTemplate, href: "/plantillas", section: "Difusión y visibilidad" },
  { id: "linea-grafica", label: "Línea gráfica", icon: Palette, href: "/linea-grafica", section: "Difusión y visibilidad" },

  { id: "herramientas", label: "Herramientas y licencias", icon: Wrench, href: "/herramientas", section: "Recursos y equipo" },
  { id: "aliados", label: "Aliados", icon: Handshake, href: "/aliados", section: "Recursos y equipo" },
  { id: "egresados", label: "Egresados", icon: GraduationCap, href: "/egresados", section: "Recursos y equipo" },
  { id: "horas", label: "Horas del equipo", icon: Clock, href: "/horas", section: "Recursos y equipo" },
  { id: "equipo", label: "Equipo", icon: Users, href: "/equipo", section: "Recursos y equipo" },
  { id: "reunion", label: "Reunión coordinación", icon: Presentation, href: "/reunion", section: "Recursos y equipo", masterOnly: true },
  { id: "comites", label: "Comités de Gestión", icon: Landmark, href: "/comites", section: "Recursos y equipo", masterOnly: true },
];

/** ¿Esta opción corresponde a la ruta actual? «/» solo coincide exacto; las demás por prefijo. */
export function isItemActive(item: SidebarItem, pathname: string, view?: string | null, isJunior = false): boolean {
  const starts = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  const [base, query] = item.href.split("?");
  // Una opción con «?vista=…» (Mi horario) solo está activa con esa vista; sin ella, la pantalla es de «Horas del equipo».
  if (query) return starts(base) && view === new URLSearchParams(query).get("vista");
  if (item.id === "horas" && view === "horario" && starts(base) && isJunior) return false;
  if (item.href === "/") return pathname === "/" || (item.alsoActiveFor ?? []).some(starts);
  return starts(item.href) || (item.alsoActiveFor ?? []).some(starts);
}

/** Agrupa las opciones por sección conservando el orden. La clave "" es el grupo sin encabezado. */
export function groupBySection(items: SidebarItem[]): { section: string; items: SidebarItem[] }[] {
  const groups: { section: string; items: SidebarItem[] }[] = [];
  for (const item of items) {
    const section = item.section ?? "";
    const last = groups[groups.length - 1];
    if (last && last.section === section) last.items.push(item);
    else groups.push({ section, items: [item] });
  }
  return groups;
}
