/** Catálogo de módulos de «ET en Marcha» para el foco del prompt de «Desarrollador».
 *  Es texto estático y se mantiene a mano, igual que `developer-prompt.ts`: si una pantalla
 *  cambia de archivos, apartados o permisos, actualiza su entrada aquí (y la sección 10 de
 *  CLAUDE.md). Lo importante es que las rutas de archivo existan: una IA las va a abrir. */

export type DevModuleSection = {
  /** id del elemento en la página (si lo tiene) o nombre del componente. */
  id: string;
  label: string;
  /** Qué hace y de qué componente sale. */
  detail: string;
};

export type DevModule = {
  id: string;
  label: string;
  group: string;
  route: string;
  /** Qué es y para quién. */
  summary: string;
  /** Rutas relativas a `webapp/src/`. */
  page: string | null;
  components: string[];
  actions: string[];
  lib: string[];
  /** Modelos de Prisma que lee o escribe. */
  models: string[];
  permissions: string;
  /** Apartados que se pueden elegir como foco. */
  sections: DevModuleSection[];
  /** Detalles propios del módulo que ayudan a estructurarlo bien. */
  notes: string[];
  /** Ids de módulos que cambian junto con este. */
  related: string[];
};

export const DEV_MODULE_GROUPS = ["Trabajo diario", "Difusión y visibilidad", "Recursos y equipo", "Transversal"] as const;

export const DEV_MODULES: DevModule[] = [
  {
    id: "panel",
    label: "Panel principal",
    group: "Trabajo diario",
    route: "/",
    summary:
      "Portada de la app: resumen del área, situación actual, semestre y objetivos, integrantes, grilla de proyectos, proyectos de estudio, comentarios y feed de actividad. Es la pantalla más larga (~580 líneas) y la que más cambia entre el perfil completo y la vista Junior.",
    page: "app/page.tsx",
    components: [
      "area-overview.tsx",
      "access-log.tsx",
      "situation-strip.tsx",
      "semester-tabs.tsx",
      "semester-objectives.tsx",
      "et-strategies-card.tsx",
      "team-roster.tsx",
      "category-distribution.tsx",
      "dofa-overlay.tsx (+ dofa-board.tsx)",
      "strategic-analysis-overlay.tsx",
      "project-seed-prompt-button.tsx",
      "new-project-button.tsx",
      "projects-grid.tsx",
      "project-card.tsx (ProjectCard y ProjectList)",
      "study-projects.tsx",
      "study-comments.tsx",
      "updates-feed.tsx",
      "team-comments.tsx",
      "collapsible.tsx",
    ],
    actions: ["area.ts", "stats.ts", "semesters.ts", "users.ts", "projects.ts", "study.ts", "study-comments.ts", "team-comments.ts"],
    lib: ["session.ts", "notify.ts", "view-profiles.ts", "project-order.ts", "person-filter.ts", "category-groups.ts", "dofa-data.ts", "strategic-analysis.ts", "utils.ts"],
    models: ["AreaProfile", "SituationStat", "Semester", "Project", "ChecklistItem", "ProjectNote", "User", "StudyProject", "StudyProjectComment", "TeamComment"],
    permissions:
      "Todos los perfiles lo ven. Escribe el perfil completo (blockedForJunior); el Junior solo gestiona checklist, consentimientos, KPIs y notas. Con `juniorKey` (propio o «Ver como») la vista cambia: saludo, «Asignados a ti» primero y bloques contraídos por defecto.",
    sections: [
      { id: "area", label: "El área", detail: "AreaOverview (franja contraíble con la descripción del área; `defaultOpen={!juniorKey}`)." },
      { id: "situacion", label: "Situación actual", detail: "CollapsibleBlock `home:situacion` con SituationStrip (cifras editables)." },
      { id: "semestre", label: "Semestre y objetivos", detail: "SemesterTabs + SemesterObjectives + EtStrategiesCard (frentes de difusión), dentro de `#semestre`." },
      { id: "integrantes", label: "Integrantes", detail: "TeamRoster en `#integrantes`; el Junior solo ve su propio «requiere tu atención»." },
      { id: "proyectos", label: "Proyectos", detail: "CollapsibleBlock `home:proyectos`: CategoryDistribution, DofaOverlay, StrategicAnalysisOverlay, ProjectSeedPromptButton, NewProjectButton y ProjectsGrid (lista por defecto o cuadrícula; `#asignados`)." },
      { id: "estudio", label: "Proyectos de estudio", detail: "CollapsibleBlock `home:estudio` con StudyProjects (por Junior y semestre, 4 cortes)." },
      { id: "comentarios-estudio", label: "Comentarios de proyectos de estudio", detail: "StudyComments en `#comentarios-estudio`." },
      { id: "actividad", label: "Actividad reciente", detail: "CollapsibleBlock `home:actividad` con UpdatesFeed." },
      { id: "comentarios-equipo", label: "Comentarios del equipo", detail: "TeamComments (hilos con respuestas), al final de la página." },
    ],
    notes: [
      "Para que un apartado nuevo tenga botón en el menú rápido lateral: dale `id` + `scroll-mt-20` y súmalo a `HOME_ITEMS` en `components/quick-nav.tsx` (con `scope` si es contraíble).",
      "Cada bloque contraíble usa una `key` distinta por vista (`key={...juniorKey ?? \"todos\"}`) para reiniciar su estado al cambiar de perfil: respétalo en bloques nuevos.",
    ],
    related: ["proyecto", "estudio", "shell", "acceso"],
  },
  {
    id: "proyecto",
    label: "Detalle de un proyecto",
    group: "Trabajo diario",
    route: "/proyectos/[id]",
    summary:
      "Pantalla de un proyecto: cabecera editable (título, enlaces, estado, urgencia, responsable, solicitante, horario), «Qué se debe hacer», actividades hijas, checklist y bitácora. Algunos proyectos (por id) llevan paneles especiales.",
    page: "app/proyectos/[id]/page.tsx",
    components: [
      "project-title-editor.tsx",
      "project-links.tsx (+ links-field.tsx)",
      "project-status-select.tsx",
      "project-priority-select.tsx",
      "project-assignee-select.tsx",
      "project-requester-select.tsx",
      "project-event-controls.tsx",
      "project-controls.tsx",
      "project-context-button.tsx",
      "mark-project-seen.tsx",
      "checklist.tsx",
      "checklist-seed-panel.tsx",
      "notes-log.tsx",
      "mention-picker.tsx",
      "consent-panel.tsx",
      "expenses-panel.tsx",
      "leads-goal-panel.tsx",
      "alumni-cta.tsx",
    ],
    actions: ["projects.ts", "checklist.ts", "notes.ts", "consent.ts", "expenses.ts"],
    lib: ["note-links.ts", "requester.ts", "notify.ts", "project-context-prompt.ts", "checklist-seed-prompt.ts", "checklist-lines.ts", "mentions.ts", "undo.ts", "consent.ts", "expenses.ts", "company-leads.ts", "alumni.ts", "utils.ts"],
    models: ["Project", "ChecklistItem", "ProjectNote", "Semester", "User", "ConsentSignatory", "Expense", "TargetCompany", "CompanyLead", "Alumnus"],
    permissions:
      "Edición de cabecera y de proyecto: perfil completo. El Junior marca/agrega subtareas (canManageChecklist), registra consentimientos (canManageConsent) y escribe notas; el resto es lectura. Los paneles especiales dependen del id del proyecto, no del perfil.",
    sections: [
      { id: "cabecera", label: "Cabecera y controles", detail: "Título, enlaces, estado, urgencia, responsable, solicitante, horario/evento, ProjectControls y botón «Contexto para IA»." },
      { id: "p-rastreo", label: "Avance del rastreo", detail: "LeadsGoalPanel (solo en `redes-rastreo-contactos-empresas`)." },
      { id: "p-descripcion", label: "Qué se debe hacer", detail: "CollapsibleCard `project:descripcion` con descripción, resultado esperado y fundamento." },
      { id: "p-actividades", label: "Actividades del proyecto", detail: "Proyectos hijos (`mainProjectId`) con estado y horario." },
      { id: "p-consentimientos", label: "Consentimientos", detail: "ConsentPanel (solo en `consentimiento-imagen-micrositio`)." },
      { id: "p-gastos", label: "Seguimiento de gastos", detail: "ExpensesPanel (solo en `innovacion-seguimiento-gastos-et`)." },
      { id: "p-checklist", label: "Checklist", detail: "Subtareas con responsable, fecha, menciones y chip de bitácora relacionada; semilla de checklist con IA." },
      { id: "p-bitacora", label: "Bitácora", detail: "NotesLog: notas con autor, enlaces, menciones y subtarea relacionada." },
    ],
    notes: [
      "Un panel o botón exclusivo de un proyecto se cuelga de su id (constantes `*_PROJECT_ID` en `lib/consent.ts`, `lib/expenses.ts`, `lib/company-leads.ts`, `lib/alumni.ts`) con una bandera `isX` en la página, no con un campo nuevo en `Project`.",
      "Los enlaces del proyecto son `Project.links` (JSON `[{label,url}]`, hasta 10). `driveFolderUrl` está obsoleto.",
      "Para sumar un botón al menú rápido del proyecto: `PROJECT_ITEMS` en `components/quick-nav.tsx`.",
    ],
    related: ["panel", "aliados", "egresados", "ia-prompts"],
  },
  {
    id: "estudio",
    label: "Proyectos de estudio",
    group: "Trabajo diario",
    route: "/#estudio (la ruta /proyectos-de-estudio solo redirige a /#proyectos)",
    summary:
      "Proyecto de estudio de cada monitor Junior por semestre, con 4 cortes (checkpoints) y comentarios. Vive dentro del panel principal, no tiene página propia.",
    page: null,
    components: ["study-projects.tsx", "study-comments.tsx"],
    actions: ["study.ts", "study-comments.ts"],
    lib: ["csv.ts", "person-color.ts", "utils.ts"],
    models: ["StudyProject", "StudyCheckpoint", "StudyProjectComment"],
    permissions: "Escribe el perfil completo. El Junior ve SOLO su proyecto de estudio y los comentarios de ese proyecto (filtrado en el servidor, en app/page.tsx).",
    sections: [
      { id: "estudio", label: "Proyectos de estudio", detail: "StudyProjects agrupados por semestre." },
      { id: "comentarios-estudio", label: "Comentarios", detail: "StudyComments con autor y destino." },
    ],
    notes: ["Los datos se consultan en `app/page.tsx` (no en una página propia): un cambio de datos toca esa página."],
    related: ["panel"],
  },
  {
    id: "calendario",
    label: "Calendario",
    group: "Trabajo diario",
    route: "/calendario",
    summary: "Calendario de eventos: junta los proyectos con horario (`startAt/endAt`), subtareas con fecha y eventos propios del calendario.",
    page: "app/calendario/page.tsx",
    components: ["calendar-panel.tsx"],
    actions: ["calendar-events.ts"],
    lib: ["events.ts", "utils.ts"],
    models: ["CalendarEvent", "Project", "ChecklistItem"],
    permissions: "Todos lo ven; crea y edita el perfil completo (blockedForJunior). El badge del menú cuenta los eventos de los próximos 7 días (`loadBadges()` en app/layout.tsx).",
    sections: [{ id: "calendario", label: "Calendario", detail: "CalendarPanel: eventos de proyectos, subtareas con fecha y eventos propios, alta y edición de eventos." }],
    notes: ["Fechas en hora de Bogotá con los helpers de `lib/utils.ts`; las «solo día» se guardan a medianoche UTC a propósito."],
    related: ["proyecto", "shell"],
  },
  {
    id: "difusion-digital",
    label: "Difusión digital (redes y métricas)",
    group: "Difusión y visibilidad",
    route: "/difusion/digital",
    summary: "Canales de redes sociales de la Unidad, su estado de oficialización, interacciones y métricas por periodo.",
    page: "app/difusion/digital/page.tsx",
    components: ["social-panel.tsx", "social-metrics.tsx"],
    actions: ["social.ts", "social-metrics.ts"],
    lib: ["utils.ts", "session.ts"],
    models: ["SocialChannel", "SocialInteraction", "SocialMetric", "User"],
    permissions: "Todos lo ven. Editar canales: perfil completo. Registrar métricas: `canRecordMetrics()` (incluye al Junior).",
    sections: [
      { id: "canales", label: "Canales", detail: "SocialPanel: una tarjeta por plataforma (Instagram, LinkedIn, TikTok, YouTube…) con estado y responsable." },
      { id: "metricas", label: "Métricas", detail: "SocialMetrics: registro y gráficas SVG a mano." },
    ],
    notes: ["La pestaña de LinkedIn (`/linkedin`) cuelga de este módulo en el menú (`alsoActiveFor`)."],
    related: ["linkedin", "shell"],
  },
  {
    id: "linkedin",
    label: "LinkedIn (tracker y plantilla de perfil)",
    group: "Difusión y visibilidad",
    route: "/linkedin",
    summary: "Tracker de métricas de LinkedIn por persona y cuestionario de 11 preguntas de la plantilla de perfil con autoguardado.",
    page: "app/linkedin/page.tsx",
    components: ["linkedin-tracker.tsx", "linkedin-profile-template.tsx"],
    actions: ["linkedin.ts", "linkedin-profile.ts"],
    lib: ["linkedin-profile-questions.ts", "utils.ts"],
    models: ["LinkedInTrackee", "LinkedInSnapshot", "LinkedInProfileAnswer", "SocialChannel", "User"],
    permissions: "Todos lo ven; registrar métricas y responder el cuestionario: `canRecordMetrics()`.",
    sections: [
      { id: "tracker", label: "Tracker por persona", detail: "LinkedInTracker: indicadores (impresiones, seguidores, profile score, SSI, conexiones…) por snapshot." },
      { id: "plantilla", label: "Plantilla de perfil", detail: "LinkedInProfileTemplate: una pregunta por pantalla; `questionKey` fija en `LinkedInProfileAnswer` (ver `workLines`, con opciones y tope)." },
    ],
    notes: ["Las respuestas se guardan como texto bajo una `questionKey` fija: cambiar redacción u orden no pierde datos. Las opciones no llevan comas ni punto y coma."],
    related: ["difusion-digital", "aliados"],
  },
  {
    id: "difusion-fisica",
    label: "Difusión física",
    group: "Difusión y visibilidad",
    route: "/difusion/fisica",
    summary: "Espacios físicos de la Facultad donde se difunde (título, descripción, estado de intervención y galería de imágenes).",
    page: "app/difusion/fisica/page.tsx",
    components: ["difusion-spaces-panel.tsx"],
    actions: ["difusion-spaces.ts"],
    lib: ["image-client.ts", "utils.ts"],
    models: ["DifusionSpace", "DifusionSpaceImage"],
    permissions: "Todos lo ven; edita el perfil completo.",
    sections: [{ id: "espacios", label: "Espacios", detail: "DifusionSpacesPanel: una tarjeta por espacio con estado (por intervenir / en intervención / intervenido) y galería (pegar, arrastrar o elegir imagen)." }],
    notes: ["Las imágenes se comprimen en el cliente (`lib/image-client.ts`) antes de enviarse."],
    related: ["plantillas"],
  },
  {
    id: "plantillas",
    label: "Plantillas",
    group: "Difusión y visibilidad",
    route: "/plantillas",
    summary: "Plantillas de piezas y de prompts. Una plantilla puede ser un prompt (`Template.promptText`) con «Copiar prompt» y «Ver prompt».",
    page: "app/plantillas/page.tsx",
    components: ["templates-panel.tsx"],
    actions: ["templates.ts"],
    lib: ["image-client.ts", "copy-text.ts"],
    models: ["Template"],
    permissions: "Todos lo ven; edita el perfil completo.",
    sections: [{ id: "plantillas", label: "Plantillas por categoría", detail: "TemplatesPanel: tarjetas con captura, categoría, formato, enlace (Drive, Canva, Figma…) y, si aplica, prompt." }],
    notes: ["El prompt maestro de noticias NO está en git (`webapp/private/`, cargado con `scripts/save-prompt-noticias.mjs`)."],
    related: ["linea-grafica", "difusion-fisica"],
  },
  {
    id: "linea-grafica",
    label: "Línea gráfica",
    group: "Difusión y visibilidad",
    route: "/linea-grafica",
    summary: "Guía de identidad visual de la UIFCE (paleta, UIFCITO, tipografía, márgenes) con indicaciones editables.",
    page: "app/linea-grafica/page.tsx",
    components: ["brand-guidelines.tsx"],
    actions: ["brand.ts"],
    lib: ["brand-summary.ts", "copy-text.ts"],
    models: ["BrandGuideline"],
    permissions: "Todos lo ven; edita el perfil completo.",
    sections: [{ id: "indicaciones", label: "Indicaciones", detail: "BrandGuidelines: título, color y texto de cada indicación; resumen copiable." }],
    notes: ["La paleta oficial vive en `prisma/brand-palette-uifce.json`; los tokens de la app, en `globals.css`."],
    related: ["plantillas"],
  },
  {
    id: "herramientas",
    label: "Herramientas y licencias",
    group: "Recursos y equipo",
    route: "/herramientas",
    summary: "Herramientas y licencias de la Unidad (pestaña UIFCE) y puestos de las salas con su vista del aula.",
    page: "app/herramientas/page.tsx",
    components: ["herramientas-tabs.tsx", "tools-table.tsx", "lab-room-preview.tsx"],
    actions: ["tools.ts", "lab-seats.ts"],
    lib: ["utils.ts"],
    models: ["Tool", "LabSeat"],
    permissions: "Todos lo ven; edita el perfil completo.",
    sections: [
      { id: "uifce", label: "Pestaña UIFCE", detail: "ToolsTable: herramienta, estado de la licencia (`ToolStatus`), ubicación, última verificación y notas." },
      { id: "salas", label: "Salas 1 a 3", detail: "LabRoomPreview (Sala 1 con puestos); Salas 2 y 3 con `RoomPlaceholder`." },
    ],
    notes: ["Las pestañas son estado local (`tab`) en `herramientas-tabs.tsx`: una pestaña nueva = una entrada en su arreglo + un bloque `tab === key`."],
    related: ["difusion-fisica"],
  },
  {
    id: "aliados",
    label: "Aliados (contactos y empresas de interés)",
    group: "Recursos y equipo",
    route: "/aliados",
    summary: "Directorio de contactos y tracker de empresas objetivo con contactos de LinkedIn por tipo, avance y egresados.",
    page: "app/aliados/page.tsx",
    components: ["contacts-table.tsx", "company-leads-section.tsx", "leads-goal-panel.tsx"],
    actions: ["contacts.ts", "target-companies.ts"],
    lib: ["company-leads.ts", "utils.ts"],
    models: ["Contact", "TargetCompany", "CompanyLead", "Project"],
    permissions:
      "Contactos y empresas: perfil completo. Registrar y actualizar contactos de empresas: `canManageLeads()` (incluye al Junior); borrar contactos y editar empresas: perfil completo.",
    sections: [
      { id: "contactos", label: "Contactos", detail: "ContactsTable (directorio de aliados)." },
      { id: "empresas-interes", label: "Empresas de interés", detail: "CompanyLeadsSection en `#empresas-interes`: meta de 4 casillas por empresa, «Anexar perfil de LinkedIn» (QuickAddLead), filtros y atajos de búsqueda." },
    ],
    notes: ["El proyecto `redes-rastreo-contactos-empresas` (LEADS_PROJECT_ID) enlaza aquí con un botón grande (`LeadsCta`)."],
    related: ["proyecto", "egresados", "linkedin"],
  },
  {
    id: "egresados",
    label: "Egresados",
    group: "Recursos y equipo",
    route: "/egresados",
    summary: "Tracker de antiguos monitores (empresa y cargo actuales, carrera, LinkedIn, estado). Los directorios de origen salen de `Project.links` del proyecto de egresados.",
    page: "app/egresados/page.tsx",
    components: ["alumni-tracker.tsx", "alumni-cta.tsx"],
    actions: ["alumni.ts"],
    lib: ["alumni.ts", "note-links.ts"],
    models: ["Alumnus", "TargetCompany", "Project"],
    permissions: "Registrar y actualizar: `canManageLeads()` (Junior y perfil completo); borrar: perfil completo.",
    sections: [
      { id: "directorios", label: "Directorios de origen", detail: "Botones que salen de los enlaces del proyecto `estrategicos-tracker-egresados-uifce`." },
      { id: "agregar", label: "Agregar egresados", detail: "Nombres pegados o filas copiadas de la hoja (Nombre, Carrera, Empresa, Cargo)." },
      { id: "listado", label: "Listado", detail: "Una fila por egresado con carrera (botones), empresa, cargo, LinkedIn, estado y «Revisado hoy»." },
    ],
    notes: ["Los enlaces a los directorios NO están en git (`webapp/private/`, `scripts/save-egresados-links.mjs`)."],
    related: ["aliados", "proyecto"],
  },
  {
    id: "horas",
    label: "Horas del equipo y horario de oficina",
    group: "Recursos y equipo",
    route: "/horas",
    summary:
      "Dos pestañas (`?vista=horario` abre la segunda). Plan semanal y horas reales del máster y los Junior (meta 20 h, con GC, PE, PI) más la grilla de horario de oficina de lunes a sábado con edificio. Cada Junior ve «Mis horas y mi horario» con una tarjeta «Ahora» en tiempo real.",
    page: "app/horas/page.tsx",
    components: ["hours-tabs.tsx", "hours-board.tsx", "schedule-board.tsx"],
    actions: ["hours.ts", "office-schedule.ts"],
    lib: ["hours.ts", "office-schedule.ts", "session.ts"],
    models: ["HourWeek", "HourEntry", "OfficeShift", "User", "Project", "Semester"],
    permissions:
      "Solo registra el máster (`canManageHours()`: credencial MASTER sin «Ver como»). El Junior consulta solo lo suyo: el servidor (app/horas/page.tsx) filtra por `juniorKey` y no envía los datos de los demás.",
    sections: [
      { id: "panel-horas", label: "Pestaña Horas", detail: "HoursBoard: contador por persona (PersonCard), registros (EntryForm/EntryRow), semanas (WeekForm) y «Estadísticas del equipo» (contraído)." },
      { id: "panel-horario", label: "Pestaña Horario de oficina", detail: "ScheduleBoard: grilla L–S con bloques por persona o del equipo (`userId` null), ShiftForm, línea roja de «ahora»." },
      { id: "ahora", label: "Tarjeta «Ahora»", detail: "NowCard + `useNow` (30 s) para el Junior: bloque actual, edificio y tiempo restante." },
    ],
    notes: [
      "Categorías y estados se guardan como texto validado en el servidor (cambiarlos no requiere migración). Constantes y cálculos en `lib/hours.ts`.",
      "Los horarios y planes reales de personas NO están en git: `webapp/private/*.json` + `scripts/load-horario-oficina.mjs` y `scripts/load-horas-semanas.mjs`.",
    ],
    related: ["equipo", "acceso", "proyecto"],
  },
  {
    id: "equipo",
    label: "Equipo",
    group: "Recursos y equipo",
    route: "/equipo",
    summary: "Directorio de personas del área (roles, foto, color, último acceso) y atajos de «Ver como».",
    page: "app/equipo/page.tsx",
    components: ["users-table.tsx", "photo-field.tsx", "person-avatar.tsx"],
    actions: ["users.ts", "view.ts"],
    lib: ["view-profiles.ts", "person-color.ts", "session.ts"],
    models: ["User"],
    permissions: "Todos lo ven; edita el perfil completo. El último acceso (`User.lastSeenAt`) lo ve el perfil completo.",
    sections: [{ id: "personas", label: "Personas", detail: "UsersTable: alta, edición, rol (`UserRole`), foto en `public/avatares/` y botón «Ver como»." }],
    notes: ["Roles: MASTER, JUNIOR_ARTES, JUNIOR_AUXILIAR, COORDINADOR, DIRECTOR, EQUIPO, LIDER. `credentialKey` enlaza con las credenciales nominales."],
    related: ["acceso", "horas", "panel"],
  },
  {
    id: "shell",
    label: "Menú lateral, navegación y avisos",
    group: "Transversal",
    route: "Todas las pantallas (app/layout.tsx)",
    summary:
      "Estructura común: menú lateral fijo (cajón en móvil), menú rápido de apartados por pantalla, campana de novedades de bitácora, banner de deshacer y pie. Aquí se agregan las opciones de navegación nuevas.",
    page: "app/layout.tsx",
    components: ["app-shell.tsx", "quick-nav.tsx", "novedades-bell.tsx", "undo-banner.tsx", "access-context.tsx", "collapsible.tsx", "info-hint.tsx"],
    actions: ["undo.ts", "view.ts", "auth.ts"],
    lib: ["sidebar-nav.ts", "brand.ts", "notify.ts", "seen-updates.ts", "undo.ts", "presence.ts"],
    models: ["CalendarEvent", "Project", "User"],
    permissions: "Lo ven todos; las opciones del menú no son seguridad (la validación va en cada página y acción).",
    sections: [
      { id: "menu-lateral", label: "Menú lateral", detail: "`SIDEBAR_ITEMS` en lib/sidebar-nav.ts (id, label, icon, href, section, alsoActiveFor); badges de `loadBadges()` en app/layout.tsx." },
      { id: "menu-rapido", label: "Menú rápido de apartados", detail: "`HOME_ITEMS` y `PROJECT_ITEMS` en components/quick-nav.tsx; solo aparece lo que existe en la página (por `id`)." },
      { id: "novedades", label: "Campana de novedades", detail: "NovedadesBell + lib/notify.ts (notas de otras personas en proyectos asignados, 14 días; lo visto va en localStorage)." },
      { id: "colapsables", label: "Bloques contraíbles", detail: "collapsible.tsx: useCollapse, CollapsibleCard, CollapsibleBlock, CollapseAllControls, scrollToSection." },
    ],
    notes: [
      "Una pantalla nueva = carpeta en `src/app/<ruta>/page.tsx` + entrada en `SIDEBAR_ITEMS`. La protección por sesión ya la da `src/middleware.ts` para todo el sitio.",
      "Los colores son tokens semánticos de `globals.css` (paleta UIFCE); no hardcodear.",
    ],
    related: ["acceso", "panel"],
  },
  {
    id: "acceso",
    label: "Ingreso, sesión y permisos",
    group: "Transversal",
    route: "/login (y src/middleware.ts)",
    summary: "Credenciales, cookie firmada, perfiles (máster, nominales, un perfil por Junior), «Ver como» y funciones de permiso reutilizadas por páginas y acciones.",
    page: "app/login/page.tsx",
    components: ["access-context.tsx", "welcome-layer.tsx", "footprint-panel.tsx", "week-glance.tsx", "activity-tracker.tsx", "access-log.tsx"],
    actions: ["auth.ts", "view.ts", "users.ts"],
    lib: ["auth.ts", "session.ts", "view-profiles.ts", "presence.ts", "welcome.ts", "welcome-types.ts", "activity.ts"],
    models: ["User", "ActivityEvent"],
    permissions:
      "`getSession()` expone `juniorKey`, `isMaster`, `level`, `viewing`. Guardas: `canEdit`, `blockedForJunior`, `canRecordMetrics`, `canManageChecklist`, `canManageConsent`, `canManageLeads`, `canManageHours`, `canUseDeveloper`.",
    sections: [
      { id: "login", label: "Pantalla de ingreso", detail: "Formulario y marca (BRAND_SUBTITLE)." },
      { id: "permisos", label: "Funciones de permiso", detail: "lib/session.ts: una función por capacidad; la UI las consume vía AccessProvider/hooks." },
      { id: "ver-como", label: "Ver como", detail: "Cookie `et_view`; perfiles en lib/view-profiles.ts." },
      { id: "capa-bienvenida", label: "Capa de bienvenida", detail: "WelcomeLayer (montada en app/layout.tsx, datos de GET /api/bienvenida): último ingreso, novedades que involucran a la persona y semana por edificio; el máster ve la huella digital." },
      { id: "huella-digital", label: "Huella digital", detail: "ActivityTracker (solo Junior con credencial propia) → POST /api/actividad → ActivityEvent; resumen en FootprintPanel con loadFootprint de lib/activity.ts. Nunca guarda lo escrito; 90 días." },
    ],
    notes: ["NUNCA escribir contraseñas ni secretos: viven en variables de entorno de Vercel. Un permiso nuevo = una función `canX()` en `lib/session.ts` + su hook en `access-context.tsx` si la UI la necesita."],
    related: ["shell", "equipo", "horas"],
  },
  {
    id: "ia-prompts",
    label: "Prompts y contexto para IA",
    group: "Transversal",
    route: "Botones en el panel, en cada proyecto y /desarrollador",
    summary: "Prompts semilla y de contexto que se copian para otra IA: proyecto nuevo, checklist de un proyecto, «Contexto para IA» y este generador de Desarrollador.",
    page: "app/desarrollador/page.tsx",
    components: ["developer-prompt-panel.tsx", "project-seed-prompt-button.tsx", "checklist-seed-panel.tsx", "project-context-button.tsx"],
    actions: ["checklist.ts"],
    lib: ["developer-prompt.ts", "developer-modules.ts", "project-seed-prompt.ts", "checklist-seed-prompt.ts", "project-context-prompt.ts", "checklist-lines.ts", "copy-text.ts"],
    models: ["Project", "ChecklistItem", "Semester"],
    permissions: "«Contexto para IA»: cualquier perfil. Semilla de proyecto y de checklist: perfil completo. Desarrollador: solo el máster (`canUseDeveloper()`).",
    sections: [
      { id: "desarrollador", label: "Desarrollador", detail: "Plantilla estática + foco por módulo/proyecto + estado en vivo." },
      { id: "semillas", label: "Semillas", detail: "project-seed-prompt (comparte `ET_AREA_CONTEXT`) y checklist-seed-prompt con «Pegar lista»." },
      { id: "contexto", label: "Contexto para IA", detail: "project-context-prompt.ts: Unidad + proyecto + checklist + bitácora." },
    ],
    notes: ["Si cambian rutas, modelos o convenciones, actualizar `developer-prompt.ts`, este catálogo y la sección 10 de CLAUDE.md."],
    related: ["proyecto", "panel"],
  },
];

/** Proyectos con panel o botón propio, enganchados por su id (no por un campo de `Project`). */
export const PROJECT_SPECIALS: Record<string, string> = {
  "consentimiento-imagen-micrositio":
    "Lleva el panel `ConsentPanel` (components/consent-panel.tsx, #p-consentimientos): firmantes y consentimientos de imagen. Acciones en lib/actions/consent.ts, constantes en lib/consent.ts (CONSENT_PROJECT_ID), modelo ConsentSignatory, guarda `canManageConsent()`.",
  "innovacion-seguimiento-gastos-et":
    "Lleva el panel `ExpensesPanel` (components/expenses-panel.tsx, #p-gastos): gastos por categoría y estado. Acciones en lib/actions/expenses.ts, constantes en lib/expenses.ts (EXPENSES_PROJECT_ID), modelo Expense.",
  "redes-rastreo-contactos-empresas":
    "Lleva `LeadsGoalPanel` (#p-rastreo, barra de progreso por empresa) y el botón grande `LeadsCta` hacia /aliados#empresas-interes. Lógica en lib/company-leads.ts (LEADS_PROJECT_ID, GOAL_SLOTS, companyCoverage).",
  "estrategicos-tracker-egresados-uifce":
    "Lleva el botón grande `AlumniCta` hacia /egresados con el avance de egresados verificados. Lógica en lib/alumni.ts (ALUMNI_PROJECT_ID). Sus enlaces a directorios van en Project.links y no están en git.",
};

/** Un tipo de estructuración: qué hacer en ESTE código cuando el cambio es de ese tipo. */
export type DevChangeKind = { id: string; label: string; hint: string; steps: string[] };

export const DEV_CHANGE_KINDS: DevChangeKind[] = [
  {
    id: "apartado",
    label: "Agregar apartado",
    hint: "Una sección nueva dentro de una pantalla.",
    steps: [
      "Hazlo como componente propio en `src/components/` y móntalo desde la página del módulo; si necesita datos, consúltalos en la página (server component) y pásalos como props serializables.",
      "Si es largo, envuélvelo en `CollapsibleCard`/`CollapsibleBlock` (`components/collapsible.tsx`) con `scope` propio; en la vista Junior debe arrancar contraído si el resto de bloques lo hacen.",
      "Dale `id` y `scroll-mt-20`. El menú rápido lateral (`components/quick-nav.tsx`) solo existe en el Panel principal (`HOME_ITEMS`) y en el detalle de proyecto (`PROJECT_ITEMS`): si el apartado está ahí, regístralo; en otras pantallas, la navegación interna se hace con pestañas (patrón de `hours-tabs.tsx`).",
      "Agrega un `InfoHint` con «Cómo se usa» y «Ejemplo».",
      "Decide qué ve cada perfil (máster, Junior Artes, Junior ET, «Ver como», nominales) y filtra en el servidor lo que un Junior no deba recibir.",
    ],
  },
  {
    id: "boton",
    label: "Agregar botones / acciones",
    hint: "Un botón que guarda, copia, abre o cambia algo.",
    steps: [
      "Si escribe datos: server action en `src/lib/actions/<dominio>.ts` con la guarda de permisos como primera línea, validación de `FormData`, escritura con `prisma` y `revalidatePath` de la ruta afectada (más `/` si el cambio se ve en el panel).",
      "Si es reversible, devuelve un `UndoAction` (`lib/undo.ts`, `components/undo-banner.tsx`).",
      "Oculta el botón en cliente con los hooks de `components/access-context.tsx`, pero la validación real va en la acción. Usa los componentes de `components/ui/` (`Button`) y los tokens semánticos.",
      "Si solo copia texto, usa `lib/copy-text.ts` (patrón de los botones «Contexto para IA» y «Semilla»).",
      "Estados de carga y error visibles; mensajes en español.",
    ],
  },
  {
    id: "enlace",
    label: "Agregar enlaces / navegación",
    hint: "Enlaces entre módulos, al menú, a Drive o a páginas externas.",
    steps: [
      "Entre pantallas de la app: `next/link` hacia la ruta con ancla (`/aliados#empresas-interes`). Para saltar dentro de la misma página y abrir un bloque contraído, `scrollToSection` de `components/collapsible.tsx`.",
      "Opción nueva en el menú lateral: una entrada en `SIDEBAR_ITEMS` de `lib/sidebar-nav.ts` (`section` para agruparla; `alsoActiveFor` si cuelga de otra).",
      "Enlaces con nombre en un proyecto: `Project.links` (`lib/note-links.ts`, editor `components/project-links.tsx`); no uses `driveFolderUrl` (obsoleto).",
      "Enlaces externos: `target=\"_blank\" rel=\"noopener noreferrer\"`; nunca pongas en git enlaces a hojas con datos de personas (van en `webapp/private/`).",
    ],
  },
  {
    id: "pantalla",
    label: "Nueva pantalla / módulo",
    hint: "Una ruta nueva con su propio dato.",
    steps: [
      "Carpeta `src/app/<ruta>/page.tsx` como server component con `export const dynamic = \"force-dynamic\"`; título con ícono de `lucide-react` e `InfoHint`.",
      "Opción en `SIDEBAR_ITEMS`. El middleware ya exige sesión; la página valida además el permiso que corresponda (`canX()` de `lib/session.ts`) y redirige si no aplica.",
      "Componentes de cliente en `src/components/`, acciones en `src/lib/actions/<dominio>.ts`, utilidades de dominio en `src/lib/<dominio>.ts`.",
      "Si necesita tablas: modelos en `schema.prisma` + migración escrita a mano (aditiva) — no ejecutes la migración.",
      "Define su vista Junior (qué ve, filtrado en servidor) y actualiza CLAUDE.md (sección 10), `developer-prompt.ts` y `developer-modules.ts`.",
    ],
  },
  {
    id: "reestructurar",
    label: "Reestructurar / mover contenido",
    hint: "Reordenar, dividir, fusionar o rediseñar una pantalla ya existente.",
    steps: [
      "Antes de mover nada, lista qué consume cada bloque (props, acciones, ids de ancla, entradas del menú rápido) para no romper enlaces ni `scrollToSection`.",
      "Cambia en fases que dejen la app compilando; mantén los `id` de ancla existentes (o deja la ruta vieja redirigiendo, como `/proyectos-de-estudio`).",
      "Conserva el comportamiento por perfil: la vista Junior y «Ver como» deben seguir viendo solo lo suyo.",
      "Si divides una pantalla en pestañas, sigue el patrón de `hours-tabs.tsx` / `herramientas-tabs.tsx` (paneles con `id` y estado en la URL cuando convenga).",
    ],
  },
  {
    id: "datos",
    label: "Campos o modelos nuevos",
    hint: "Guardar información que hoy no se guarda.",
    steps: [
      "Cambios de esquema: edita `prisma/schema.prisma` y escribe a mano `prisma/migrations/AAAAMMDDHHMMSS_nombre/migration.sql` (posterior a la última; aditiva y compatible hacia atrás). Corre solo `npx prisma generate`.",
      "Prefiere texto validado en el servidor (como categoría y estado en `HourEntry`) a un enum nuevo si los valores van a cambiar.",
      "Si el dato son personas reales (horarios, contactos, enlaces a hojas), NO lo pongas en git: `webapp/private/` + script de carga con dry-run y `--apply`.",
      "Indica en el resumen final las migraciones que debo aplicar con `cd webapp && npm run db:deploy` (y `db:seed` si toca el seed).",
    ],
  },
];

/** Un proyecto del tracker que se puede elegir como foco (ya serializable). */
export type DevProjectOption = {
  id: string;
  title: string;
  category: string;
  statusLabel: string;
  assignee: string | null;
  requesterArea: string | null;
  description: string;
  expectedOutcome: string;
  links: { label: string; url: string }[];
  checklist: { text: string; done: boolean }[];
  /** Cuántas subtareas tiene en total (la lista puede venir recortada). */
  checklistTotal: number;
  isManual: boolean;
};

/** Lo que el usuario eligió como foco del cambio. */
export type DeveloperFocus = {
  moduleIds: string[];
  /** Claves `moduloId:apartadoId` de los apartados marcados. */
  sectionKeys: string[];
  kindIds: string[];
  project: DevProjectOption | null;
};

export const EMPTY_FOCUS: DeveloperFocus = { moduleIds: [], sectionKeys: [], kindIds: [], project: null };

export function hasFocus(f: DeveloperFocus): boolean {
  return f.moduleIds.length > 0 || f.kindIds.length > 0 || f.project !== null;
}

const compact = (s: string, max: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t || "—";
};

function moduleBlock(m: DevModule, sections: DevModuleSection[]): string {
  const list = (items: string[], prefix: string) => (items.length ? items.map((i) => `\`${prefix}${i}\``).join(", ") : "—");
  const lines = [
    `## Módulo: ${m.label} (\`${m.route}\`)`,
    m.summary,
    `- Página: ${m.page ? `\`src/${m.page}\`` : "no tiene página propia (vive dentro de otra; ver el resumen)"}.`,
    `- Componentes (\`src/components/\`): ${list(m.components, "")}.`,
    `- Server actions (\`src/lib/actions/\`): ${list(m.actions, "")}.`,
    `- Utilidades (\`src/lib/\`): ${list(m.lib, "")}.`,
    `- Modelos de Prisma: ${m.models.join(", ")}.`,
    `- Permisos: ${m.permissions}`,
  ];
  if (sections.length) {
    lines.push("- Apartados EN FOCO (el cambio se concentra aquí):");
    for (const s of sections) lines.push(`  - ${s.label} (\`${s.id}\`): ${s.detail}`);
  }
  const others = m.sections.filter((s) => !sections.includes(s));
  if (others.length) {
    lines.push(`- Otros apartados de la pantalla (no tocar salvo que el cambio lo exija): ${others.map((s) => s.label).join("; ")}.`);
  }
  for (const n of m.notes) lines.push(`- Ojo: ${n}`);
  const rel = m.related
    .map((id) => DEV_MODULES.find((x) => x.id === id)?.label)
    .filter(Boolean)
    .join("; ");
  if (rel) lines.push(`- Módulos que suelen cambiar junto con este: ${rel}.`);
  return lines.join("\n");
}

function projectBlock(p: DevProjectOption): string {
  const special = PROJECT_SPECIALS[p.id];
  const checklist = p.checklist.length
    ? p.checklist.map((c, i) => `  ${i + 1}. [${c.done ? "x" : " "}] ${compact(c.text, 160)}`).join("\n") +
      (p.checklistTotal > p.checklist.length ? `\n  (se muestran ${p.checklist.length} de ${p.checklistTotal})` : "")
    : "  Sin subtareas.";
  return [
    `## Proyecto en foco: ${p.title}`,
    `- id (slug de la ruta \`/proyectos/${p.id}\`): \`${p.id}\`${p.isManual ? " · creado a mano en la app" : " · viene del CSV de planeación"}.`,
    `- Categoría: ${p.category} · Estado: ${p.statusLabel} · Responsable: ${p.assignee ?? "—"} · Área solicitante: ${p.requesterArea ?? "—"}.`,
    `- Qué se debe hacer: ${compact(p.description, 900)}`,
    `- Qué se espera: ${compact(p.expectedOutcome, 600)}`,
    `- Enlaces del proyecto: ${p.links.length ? p.links.map((l) => `${l.label || "Enlace"} (${l.url})`).join("; ") : "—"}.`,
    `- Panel o botón propio de este proyecto: ${special ?? "ninguno; usa los apartados comunes del detalle de proyecto."}`,
    "- Checklist actual:",
    checklist,
    "Todo cambio que dependa de este proyecto debe engancharse a su id (constante `*_PROJECT_ID` y bandera `isX` en `app/proyectos/[id]/page.tsx`), nunca con un campo nuevo en `Project`. Si el cambio altera los textos del proyecto, recuerda que la fuente de verdad es `planeacion/planeacion_del_area.csv` y que el seed no pisa lo editado en la app.",
  ].join("\n");
}

/** Sección «foco» del prompt: módulos, apartados, proyecto y tipos de cambio. Vacía si no hay foco. */
export function buildFocusSection(focus: DeveloperFocus): string {
  if (!hasFocus(focus)) return "";
  const parts: string[] = [];
  const mods = focus.moduleIds.map((id) => DEV_MODULES.find((m) => m.id === id)).filter((m): m is DevModule => !!m);
  // Si hay proyecto en foco, el detalle de proyecto va siempre como módulo (es su pantalla).
  if (focus.project && !mods.some((m) => m.id === "proyecto")) {
    const detail = DEV_MODULES.find((m) => m.id === "proyecto");
    if (detail) mods.unshift(detail);
  }
  for (const m of mods) {
    const chosen = m.sections.filter((s) => focus.sectionKeys.includes(`${m.id}:${s.id}`));
    parts.push(moduleBlock(m, chosen));
  }
  if (focus.project) parts.push(projectBlock(focus.project));
  const kinds = focus.kindIds.map((id) => DEV_CHANGE_KINDS.find((k) => k.id === id)).filter((k): k is DevChangeKind => !!k);
  if (kinds.length) {
    parts.push(
      "## Tipo de estructuración y cómo se hace en este código\n" +
        kinds.map((k) => `### ${k.label}\n${k.steps.map((s) => `- ${s}`).join("\n")}`).join("\n\n"),
    );
  }
  return parts.join("\n\n");
}
