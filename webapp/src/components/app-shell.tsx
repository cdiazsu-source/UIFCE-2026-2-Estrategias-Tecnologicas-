"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Code2, Eye, LogOut, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { setJuniorView, viewAsJunior } from "@/lib/actions/view";
import { JUNIOR_PROFILES } from "@/lib/auth";
import { groupBySection, isItemActive, SIDEBAR_ITEMS, type SidebarItem } from "@/lib/sidebar-nav";

type ShellProps = {
  /** Contadores en vivo por id de opción (ver SIDEBAR_ITEMS); 0 o ausente = sin badge. */
  badges?: Record<string, number>;
  canEdit?: boolean;
  viewingAsJunior?: boolean;
  /** Perfil Junior que se está viendo («junior-artes» / «junior-et»), si hay uno concreto. */
  viewingAsKey?: string | null;
  canUseJuniorView?: boolean;
  canUseDeveloper?: boolean;
  children: React.ReactNode;
};

/** Una opción del menú. La activa es una «pestaña» blanca que llega hasta el borde del
 *  panel de contenido y se funde con él mediante dos esquinas cóncavas (ver .sidebar-tab
 *  en globals.css). Redundancia visual para el estado activo: fondo blanco, texto en
 *  negrita (600), ícono en azul y alto contraste; hover y foco usan otras señales
 *  (tinte blanco translúcido y anillo amarillo) para no confundirse con él. */
function NavLink({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: SidebarItem;
  active: boolean;
  badge?: number;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <li className={cn("relative", active && "sidebar-tab")}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-l-xl py-2 pl-3 pr-4 text-sm outline-none transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent",
          active
            ? "bg-card font-semibold text-primary"
            : "font-medium text-nav-foreground hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-link")} aria-hidden />
        <span className="flex-1 leading-snug">{item.label}</span>
        {badge ? (
          <span
            className={cn(
              "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
              active ? "bg-primary text-primary-foreground" : "bg-brand-accent text-brand-accent-foreground"
            )}
            aria-label={`${badge} pendientes`}
          >
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

/** Logo de la Unidad (blanco sobre transparente, pensado para fondos oscuros), junto al nombre
 *  de la app. Se sirve tal cual (unoptimized): pesa 65 KB y el optimizador de Next falla con él. */
function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-uifce.png"
      alt="Logo de la Unidad de Informática, UIFCE"
      width={1200}
      height={550}
      priority
      unoptimized
      className={cn("w-auto shrink-0", className)}
    />
  );
}

/** UIFCITO, la mascota de la Unidad, saludando. Va sobre un círculo lila claro (el tinte de la
 *  paleta) para que su pantalla oscura y sus contornos resalten sobre el azul del menú. Sus
 *  colores NO se tocan (paleta única e inmodificable del manual): solo se le da un fondo y un
 *  leve giro al pasar el cursor. */
function Mascot() {
  return (
    <span
      className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-secondary ring-2 ring-white/25 [@media(max-height:820px)]:h-14 [@media(max-height:820px)]:w-14"
      title="UIFCITO"
    >
      <Image
        src="/uifcito-saludo.png"
        alt="UIFCITO, la mascota de la UIFCE, saludando"
        width={480}
        height={391}
        unoptimized
        className="h-[52px] w-auto -rotate-3 [@media(max-height:820px)]:h-10 transition-transform duration-200 ease-out-strong group-hover/brand:rotate-6 group-hover/brand:scale-105"
      />
    </span>
  );
}

/** Zona desplazable del menú SIN barra de desplazamiento visible (la barra nativa chocaba
 *  con el borde derecho donde la pestaña activa se funde con el contenido). Si hay más opciones
 *  abajo, aparece un botón circular con una flecha para bajar; la rueda, el gesto táctil y el
 *  teclado siguen funcionando igual. */
function ScrollableNav({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      {/* pt-4: deja sitio a la esquina cóncava superior de la primera opción activa. */}
      <nav aria-label="Navegación principal" ref={ref} className="scrollbar-none h-full overflow-y-auto pb-4 pt-4">
        {children}
      </nav>
      <button
        type="button"
        aria-label="Ver más opciones del menú"
        tabIndex={more ? 0 : -1}
        onClick={() => ref.current?.scrollBy({ top: ref.current.clientHeight * 0.8, behavior: "smooth" })}
        className={cn(
          "absolute bottom-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white/15 text-white outline-none backdrop-blur-sm transition-opacity duration-150 hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-brand-accent",
          more ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** Selector de la Vista Junior: el máster elige QUÉ Junior quiere ver (Junior Artes o Junior ET) y
 *  la app se muestra tal como la ve ese monitor (su saludo, sus proyectos primero y solo su
 *  proyecto de estudio). Es un desplegable en línea, con las opciones a 44 px. */
function JuniorViewPicker({
  buttonClass,
  label,
  current,
}: {
  buttonClass: string;
  label: string;
  current: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Elegir qué Junior ver: Junior Artes o Junior ET"
        className={buttonClass}
      >
        <Eye className="h-5 w-5 shrink-0" aria-hidden />
        <span className="flex-1">{label}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-150", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ul className="ml-8 mt-0.5 flex flex-col gap-0.5">
          {Object.entries(JUNIOR_PROFILES).map(([key, name]) => {
            const on = current === key;
            return (
              <li key={key}>
                <form action={viewAsJunior.bind(null, key)}>
                  <button
                    type="submit"
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2.5 rounded-l-xl py-2 pl-3 pr-4 text-left text-sm outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent",
                      on ? "bg-white/15 font-semibold text-white" : "font-medium text-nav-foreground"
                    )}
                  >
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full border", on ? "border-brand-accent bg-brand-accent" : "border-white/60")}
                      aria-hidden
                    />
                    {name}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/** Contenido del menú (lo comparten la barra fija de escritorio y el cajón móvil). */
function SidebarContent({
  pathname,
  badges,
  canEdit,
  viewingAsJunior,
  viewingAsKey,
  canUseJuniorView,
  canUseDeveloper,
  onNavigate,
}: Omit<ShellProps, "children"> & { pathname: string; onNavigate: () => void }) {
  const groups = groupBySection(SIDEBAR_ITEMS);
  const footerButton =
    "flex min-h-11 w-full items-center gap-3 rounded-l-xl py-2 pl-3 pr-4 text-left text-sm font-medium text-nav-foreground outline-none transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent";

  return (
    <>
      <div className="px-5 pb-5 pt-5 [@media(max-height:820px)]:pb-3 [@media(max-height:820px)]:pt-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="group/brand block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <span className="flex items-center justify-between gap-3">
            <BrandLogo className="h-11 [@media(max-height:820px)]:h-9" />
            <Mascot />
          </span>
          <span className="mt-3 block text-lg [@media(max-height:820px)]:mt-2 font-bold leading-tight tracking-tight text-white">ET en Marcha</span>
        </Link>
      </div>

      <ScrollableNav>
        {groups.map((g, i) => (
          <div key={g.section || `grupo-${i}`} className={cn(i > 0 && "mt-5 [@media(max-height:820px)]:mt-3")}>
            {g.section && (
              <p className="mb-1.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-nav-foreground/60">
                {g.section}
              </p>
            )}
            <ul className="ml-3 flex flex-col gap-0.5">
              {g.items.map((item) => (
                <NavLink
                  key={item.id}
                  item={item}
                  active={isItemActive(item, pathname)}
                  badge={badges?.[item.id]}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </ScrollableNav>

      <div className="border-t border-white/15 py-3 [@media(max-height:820px)]:py-2">
        <ul className="ml-3 flex flex-col gap-0.5">
          {canUseDeveloper && (
            <NavLink
              item={{ id: "desarrollador", label: "Desarrollador", icon: Code2, href: "/desarrollador" }}
              active={pathname.startsWith("/desarrollador")}
              onNavigate={onNavigate}
            />
          )}
          {viewingAsJunior ? (
            <>
              <li>
                <form action={setJuniorView.bind(null, false)}>
                  <button type="submit" className={cn(footerButton, "text-brand-accent")}>
                    <Eye className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="flex flex-col leading-tight">
                      Vista Junior · salir
                      {viewingAsKey && JUNIOR_PROFILES[viewingAsKey] && (
                        <span className="text-xs font-normal text-nav-foreground/80">Como {JUNIOR_PROFILES[viewingAsKey]}</span>
                      )}
                    </span>
                  </button>
                </form>
              </li>
              <JuniorViewPicker buttonClass={footerButton} label="Cambiar de Junior" current={viewingAsKey ?? null} />
            </>
          ) : canUseJuniorView ? (
            <JuniorViewPicker buttonClass={footerButton} label="Vista Junior" current={null} />
          ) : !canEdit ? (
            <li className="flex min-h-11 items-center gap-3 py-2 pl-3 pr-4 text-sm text-nav-foreground/70">
              <Eye className="h-5 w-5 shrink-0" aria-hidden />
              Modo lectura
            </li>
          ) : null}
          <li>
            <form action={logout}>
              <button type="submit" className={footerButton}>
                <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                Salir
              </button>
            </form>
          </li>
        </ul>
      </div>
    </>
  );
}

/** Estructura de la app autenticada: menú lateral azul oscuro a la izquierda y, pegado a
 *  él, el panel de contenido blanco. En pantallas angostas el menú pasa a un cajón que se
 *  abre desde una barra superior. En /login no hay menú. */
export function AppShell({ children, ...nav }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // El cajón móvil se cierra al navegar y con Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname === "/login") return <>{children}</>;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-nav px-4 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir el menú"
          aria-expanded={open}
          className="press -ml-2 flex h-11 w-11 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
          <BrandLogo className="h-8" />
          <span className="text-base font-bold tracking-tight">ET en Marcha</span>
        </Link>
      </header>

      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-nav text-nav-foreground transition-transform duration-200 ease-out-strong lg:z-30 lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar el menú"
          className="absolute right-2 top-3 flex h-11 w-11 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-brand-accent lg:hidden"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} {...nav} />
      </aside>

      {/* Panel de contenido: blanco y pegado al menú, para que la pestaña activa se funda con él. */}
      <div className="min-h-screen bg-card lg:pl-64">{children}</div>
    </>
  );
}
